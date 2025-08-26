const mongoose = require("mongoose")

// Define a sub-schema for individual column statistics
const columnStatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["number", "text"], required: true },
  nonEmpty: { type: Number, required: true },
  unique: { type: Number, required: true },
  average: { type: Number }, // Optional for text columns
  sum: { type: Number }, // Optional for text columns
  min: { type: mongoose.Schema.Types.Mixed }, // Can be number or string
  max: { type: mongoose.Schema.Types.Mixed }, // Can be number or string
})

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
      trim: true,
    },
    mimetype: {
      type: String,
      required: [true, "File mimetype is required"],
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
    },
    // Parsed Excel data
    data: {
      headers: [String],
      rows: [[mongoose.Schema.Types.Mixed]], // Array of arrays, each containing mixed types
      sheetNames: [String],
    },
    // Analytics data
    analytics: {
      totalRows: Number,
      totalColumns: Number,
      nonEmptyCells: Number,
      emptyCells: Number,
      columnStats: [columnStatSchema], // Use the defined sub-schema here
    },
    // Processing status
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    processingError: String,
    // File metadata
    metadata: {
      worksheetCount: Number,
      hasFormulas: Boolean,
      hasCharts: Boolean,
      lastModified: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
fileSchema.index({ uploadedBy: 1, uploadDate: -1 })
fileSchema.index({ processingStatus: 1 })

// Virtual for row count
fileSchema.virtual("rowCount").get(function () {
  return this.data && this.data.rows ? this.data.rows.length : 0
})

// Virtual for column count
fileSchema.virtual("columnCount").get(function () {
  return this.data && this.data.headers ? this.data.headers.length : 0
})

// Method to update processing status
fileSchema.methods.updateProcessingStatus = function (status, error = null) {
  this.processingStatus = status
  if (error) {
    this.processingError = error
  }
  return this.save()
}

// Method to calculate basic analytics
fileSchema.methods.calculateAnalytics = function () {
  if (!this.data || !this.data.rows || !this.data.headers) {
    return null
  }

  const { headers, rows } = this.data
  const totalRows = rows.length
  const totalColumns = headers.length
  let nonEmptyCells = 0
  let emptyCells = 0

  // Column statistics
  const columnStats = headers.map((header, colIndex) => {
    const columnData = rows
      .map((row) => row[colIndex])
      .filter((cell) => cell !== null && cell !== undefined && cell !== "")
    const nonEmpty = columnData.length
    const unique = new Set(columnData).size

    // Determine column type and calculate statistics
    const numericData = columnData.map((cell) => Number.parseFloat(cell)).filter((num) => !isNaN(num))
    const isNumeric = numericData.length > 0 && numericData.length === columnData.length

    const stats = {
      name: header,
      type: isNumeric ? "number" : "text",
      nonEmpty,
      unique,
    }

    if (isNumeric) {
      stats.average = numericData.reduce((sum, num) => sum + num, 0) / numericData.length
      stats.sum = numericData.reduce((sum, num) => sum + num, 0)
      stats.min = Math.min(...numericData)
      stats.max = Math.max(...numericData)
    } else {
      // For text columns, min/max might be based on alphabetical order or simply not applicable
      // For now, we'll leave them undefined if not numeric, or you can implement string min/max logic
      stats.min = columnData.length > 0 ? columnData.reduce((a, b) => (a < b ? a : b)) : undefined
      stats.max = columnData.length > 0 ? columnData.reduce((a, b) => (a > b ? a : b)) : undefined
    }

    return stats
  })

  // Count empty and non-empty cells
  rows.forEach((row) => {
    row.forEach((cell) => {
      if (cell !== null && cell !== undefined && cell !== "") {
        nonEmptyCells++
      } else {
        emptyCells++
      }
    })
  })

  this.analytics = {
    totalRows,
    totalColumns,
    nonEmptyCells,
    emptyCells,
    columnStats,
  }

  return this.analytics
}

module.exports = mongoose.model("File", fileSchema)
