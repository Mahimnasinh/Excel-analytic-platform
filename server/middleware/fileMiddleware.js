const XLSX = require("xlsx")
const fs = require("fs")
const path = require("path")

const processExcelFile = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded for processing." })
  }

  try {
    const filePath = req.file.path
    const workbook = XLSX.readFile(filePath)
    const sheetNames = workbook.SheetNames
    const firstSheetName = sheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length === 0) {
      // Clean up the uploaded file if it's empty
      fs.unlinkSync(filePath)
      return res.status(400).json({ message: "Uploaded Excel file is empty or contains no data." })
    }

    // Assume the first row is headers
    const headers = jsonData[0]
    const rows = jsonData.slice(1)

    req.excelData = {
      headers,
      rows,
      sheetNames,
    }

    next()
  } catch (error) {
    console.error("Error processing Excel file:", error)
    // Clean up the uploaded file if processing failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ message: "Failed to process Excel file.", error: error.message })
  }
}

module.exports = { processExcelFile }
