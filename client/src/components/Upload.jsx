"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import { useAuth } from "../context/authContext"

const Upload = () => {
  const { token } = useAuth()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const fileType = selectedFile.type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ]

      if (validTypes.includes(fileType) || selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setFile(selectedFile)
        setMessage("")
      } else {
        setMessage("Please select a valid Excel file (.xlsx or .xls)")
        setFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first")
      return
    }

    setUploading(true)
    setMessage("")
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          setMessage("File uploaded and processed successfully!")
          setFile(null)
          setUploadProgress(0)
          // Reset file input
          document.getElementById("file-input").value = ""
        } else {
          const error = JSON.parse(xhr.responseText)
          setMessage(error.message || "Upload failed")
        }
        setUploading(false)
      }

      xhr.onerror = () => {
        setMessage("Upload failed. Please try again.")
        setUploading(false)
        setUploadProgress(0)
      }

      xhr.open("POST", "http://localhost:5000/api/files/upload")
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.send(formData)
    } catch (error) {
      console.error("Upload error:", error)
      setMessage("Upload failed. Please try again.")
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-main">
        <div className="upload-container">
          <div className="upload-header">
            <h1>Upload Excel File</h1>
            <p>Upload your Excel files (.xlsx or .xls) for analysis</p>
          </div>

          <div className="upload-card">
            <div className="upload-area">
              <div className="upload-icon">📤</div>
              <h3>Select Excel File</h3>
              <p>Choose an Excel file to upload and analyze</p>

              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="file-input"
              />

              {file && (
                <div className="file-selected">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <div>
                      <p className="file-name">{file.name}</p>
                      <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p>{uploadProgress}% uploaded</p>
                </div>
              )}

              <button onClick={handleUpload} disabled={!file || uploading} className="btn btn-primary upload-btn">
                {uploading ? "Uploading..." : "Upload File"}
              </button>
            </div>

            {message && <div className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</div>}
          </div>

          <div className="upload-info">
            <h3>Supported File Types</h3>
            <ul>
              <li>Excel 2007+ (.xlsx)</li>
              <li>Excel 97-2003 (.xls)</li>
            </ul>

            <h3>File Requirements</h3>
            <ul>
              <li>Maximum file size: 10MB</li>
              <li>Files should contain structured data</li>
              <li>First row should contain column headers</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Upload
