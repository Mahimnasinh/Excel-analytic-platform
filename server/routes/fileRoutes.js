const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const XLSX = require("xlsx")
const File = require("../model/fileModel")
const { protect } = require("../middleware/userMiddleware")
const { processExcelFile } = require("../middleware/fileMiddleware")

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]

  if (
    allowedTypes.includes(file.mimetype) ||
    file.originalname.endsWith(".xlsx") ||
    file.originalname.endsWith(".xls")
  ) {
    cb(null, true)
  } else {
    cb(new Error("Only Excel files (.xlsx, .xls) are allowed"), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// @desc    Upload Excel file
// @route   POST /api/files/upload
// @access  Private
router.post("/upload", protect, upload.single("file"), processExcelFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      })
    }

    const fileRecord = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      filePath: req.file.path,
      data: req.excelData,
      processingStatus: "completed",
    })

    // Calculate analytics
    fileRecord.calculateAnalytics()

    await fileRecord.save()

    res.status(201).json({
      message: "File uploaded and processed successfully",
      file: {
        id: fileRecord._id,
        filename: fileRecord.originalName,
        size: fileRecord.size,
        uploadDate: fileRecord.uploadDate,
        rowCount: fileRecord.rowCount,
        columnCount: fileRecord.columnCount,
        processingStatus: fileRecord.processingStatus,
      },
    })
  } catch (error) {
    console.error("File upload error:", error)

    // Clean up uploaded file if processing failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      message: "File upload failed",
      error: error.message,
    })
  }
})

// @desc    Get all user files
// @route   GET /api/files
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const files = await File.find({ uploadedBy: req.user.id })
      .select("-data") // Exclude large data field
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)

    const total = await File.countDocuments({ uploadedBy: req.user.id })

    res.json({
      files: files.map((file) => ({
        _id: file._id,
        filename: file.originalName,
        size: file.size,
        uploadDate: file.uploadDate,
        rowCount: file.rowCount,
        columnCount: file.columnCount,
        processingStatus: file.processingStatus,
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Files fetch error:", error)
    res.status(500).json({
      message: "Error fetching files",
      error: error.message,
    })
  }
})

// @desc    Get file data
// @route   GET /api/files/:id/data
// @access  Private
router.get("/:id/data", protect, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
    })

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      })
    }

    if (file.processingStatus !== "completed") {
      return res.status(400).json({
        message: "File is still being processed",
      })
    }

    res.json({
      headers: file.data.headers,
      rows: file.data.rows,
      sheetNames: file.data.sheetNames,
      metadata: {
        totalRows: file.data.rows.length,
        totalColumns: file.data.headers.length,
        filename: file.originalName,
        uploadDate: file.uploadDate,
      },
    })
  } catch (error) {
    console.error("File data fetch error:", error)
    res.status(500).json({
      message: "Error fetching file data",
      error: error.message,
    })
  }
})

// @desc    Get file analytics
// @route   GET /api/files/:id/analytics
// @access  Private
router.get("/:id/analytics", protect, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
    })

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      })
    }

    if (file.processingStatus !== "completed") {
      return res.status(400).json({
        message: "File is still being processed",
      })
    }

    // Recalculate analytics if not present
    if (!file.analytics) {
      file.calculateAnalytics()
      await file.save()
    }

    res.json(file.analytics)
  } catch (error) {
    console.error("Analytics fetch error:", error)
    res.status(500).json({
      message: "Error fetching analytics",
      error: error.message,
    })
  }
})

// @desc    Get dashboard stats
// @route   GET /api/files/stats
// @access  Private
router.get("/stats", protect, async (req, res) => {
  try {
    const totalFiles = await File.countDocuments({ uploadedBy: req.user.id })
    const totalRowsResult = await File.aggregate([
      { $match: { uploadedBy: req.user.id, processingStatus: "completed" } },
      { $group: { _id: null, totalRows: { $sum: "$analytics.totalRows" } } },
    ])
    const totalRows = totalRowsResult.length > 0 ? totalRowsResult[0].totalRows : 0

    const recentUploads = await File.find({ uploadedBy: req.user.id })
      .select("filename originalName uploadDate rowCount")
      .sort({ uploadDate: -1 })
      .limit(5)

    res.json({
      totalFiles,
      totalRows,
      recentUploads: recentUploads.map((file) => ({
        _id: file._id,
        filename: file.originalName,
        uploadDate: file.uploadDate,
        rowCount: file.rowCount,
      })),
    })
  } catch (error) {
    console.error("Dashboard stats fetch error:", error)
    res.status(500).json({
      message: "Error fetching dashboard statistics",
      error: error.message,
    })
  }
})

// @desc    Delete a file
// @route   DELETE /api/files/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
    })

    if (!file) {
      return res.status(404).json({
        message: "File not found or you do not have permission to delete it.",
      })
    }

    // Delete the physical file from the uploads directory
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath)
      console.log(`Deleted physical file: ${file.filePath}`)
    } else {
      console.warn(`Physical file not found at: ${file.filePath}, deleting database record only.`)
    }

    // Delete the file record from the database
    await File.deleteOne({ _id: req.params.id })

    res.json({
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("File deletion error:", error)
    res.status(500).json({
      message: "Error deleting file",
      error: error.message,
    })
  }
})

module.exports = router
