"use client"

import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import { useAuth } from "../context/authContext"

const ViewData = () => {
  const { token } = useAuth()
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileData, setFileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/files", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
      }
    } catch (error) {
      console.error("Error fetching files:", error)
      setMessage("Failed to load files.")
    } finally {
      setLoading(false)
    }
  }

  const fetchFileData = async (fileId) => {
    setDataLoading(true)
    setMessage("")
    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}/data`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFileData(data)
      } else {
        const errorData = await response.json()
        setMessage(errorData.message || "Failed to fetch file data.")
        setFileData(null)
      }
    } catch (error) {
      console.error("Error fetching file data:", error)
      setMessage("Network error fetching file data.")
      setFileData(null)
    } finally {
      setDataLoading(false)
    }
  }

  const handleDeleteFile = async (fileId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return
    }

    setMessage("")
    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setMessage(`File "${filename}" deleted successfully!`)
        setFiles(files.filter((file) => file._id !== fileId))
        if (selectedFile && selectedFile._id === fileId) {
          setSelectedFile(null)
          setFileData(null)
        }
      } else {
        const errorData = await response.json()
        setMessage(errorData.message || "Failed to delete file.")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      setMessage("Network error deleting file.")
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    fetchFileData(file._id)
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-main">
        <div className="view-data-container">
          <div className="view-data-header">
            <h1>View Data</h1>
            <p>Browse and view your uploaded Excel files</p>
          </div>

          {message && <div className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</div>}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading files...</p>
            </div>
          ) : (
            <div className="view-data-content">
              <div className="files-sidebar">
                <h3>Your Files</h3>
                {files.length > 0 ? (
                  <div className="files-list">
                    {files.map((file) => (
                      <div key={file._id} className={`file-item ${selectedFile?._id === file._id ? "selected" : ""}`}>
                        <div className="file-info-wrapper" onClick={() => handleFileSelect(file)}>
                          <div className="file-icon">📄</div>
                          <div className="file-info">
                            <h4>{file.filename}</h4>
                            <p>{new Date(file.uploadDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file._id, file.filename)}
                          className="btn-delete"
                          title="Delete File"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No files uploaded yet.</p>
                    <a href="/upload">Upload your first file</a>
                  </div>
                )}
              </div>

              <div className="data-viewer">
                {selectedFile ? (
                  <>
                    <div className="data-header">
                      <h3>{selectedFile.filename}</h3>
                      <p>Uploaded: {new Date(selectedFile.uploadDate).toLocaleDateString()}</p>
                      <button
                        onClick={() => handleDeleteFile(selectedFile._id, selectedFile.filename)}
                        className="btn btn-danger delete-file-btn"
                      >
                        Delete File
                      </button>
                    </div>

                    {dataLoading ? (
                      <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading data...</p>
                      </div>
                    ) : fileData ? (
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {fileData.headers?.map((header, index) => (
                                <th key={index}>{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {fileData.rows?.slice(0, 100).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {fileData.rows?.length > 100 && (
                          <div className="table-footer">
                            <p>Showing first 100 rows of {fileData.rows.length} total rows</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <p>No data available for this file</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>Select a file to view data</h3>
                    <p>Choose a file from the left sidebar to view its contents</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ViewData
