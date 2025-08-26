"use client"

import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import { useAuth } from "../context/authContext"

const Analytics = () => {
  const { token } = useAuth()
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

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
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (fileId) => {
    setAnalyticsLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    fetchAnalytics(file._id)
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-main">
        <div className="analytics-container">
          <div className="analytics-header">
            <h1>Analytics</h1>
            <p>Detailed insights and statistics from your Excel data</p>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading files...</p>
            </div>
          ) : (
            <div className="analytics-content">
              <div className="file-selector">
                <h3>Select File for Analysis</h3>
                <select
                  value={selectedFile?._id || ""}
                  onChange={(e) => {
                    const file = files.find((f) => f._id === e.target.value)
                    if (file) handleFileSelect(file)
                  }}
                  className="file-select"
                >
                  <option value="">Choose a file...</option>
                  {files.map((file) => (
                    <option key={file._id} value={file._id}>
                      {file.filename}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFile && (
                <div className="analytics-results">
                  <div className="file-info-card">
                    <h3>{selectedFile.filename}</h3>
                    <p>Uploaded: {new Date(selectedFile.uploadDate).toLocaleDateString()}</p>
                  </div>

                  {analyticsLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Analyzing data...</p>
                    </div>
                  ) : analytics ? (
                    <div className="analytics-grid">
                      <div className="analytics-card">
                        <h4>Basic Statistics</h4>
                        <div className="stats-list">
                          <div className="stat-item">
                            <span className="stat-label">Total Rows:</span>
                            <span className="stat-value">{analytics.totalRows}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Total Columns:</span>
                            <span className="stat-value">{analytics.totalColumns}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Non-empty Cells:</span>
                            <span className="stat-value">{analytics.nonEmptyCells}</span>
                          </div>
                        </div>
                      </div>

                      <div className="analytics-card">
                        <h4>Column Analysis</h4>
                        <div className="column-stats">
                          {analytics.columnStats?.map((col, index) => (
                            <div key={index} className="column-stat">
                              <h5>{col.name}</h5>
                              <div className="column-details">
                                <p>Type: {col.type}</p>
                                <p>Non-empty: {col.nonEmpty}</p>
                                {col.type === "number" && (
                                  <>
                                    <p>Average: {col.average?.toFixed(2)}</p>
                                    <p>Sum: {col.sum?.toFixed(2)}</p>
                                    <p>Min: {col.min}</p>
                                    <p>Max: {col.max}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="analytics-card">
                        <h4>Data Quality</h4>
                        <div className="quality-stats">
                          <div className="quality-item">
                            <span className="quality-label">Empty Cells:</span>
                            <span className="quality-value">{analytics.emptyCells}</span>
                          </div>
                          <div className="quality-item">
                            <span className="quality-label">Data Completeness:</span>
                            <span className="quality-value">
                              {(
                                (analytics.nonEmptyCells / (analytics.totalRows * analytics.totalColumns)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No analytics data available</p>
                    </div>
                  )}
                </div>
              )}

              {!selectedFile && files.length > 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>Select a file to view analytics</h3>
                  <p>Choose a file from the dropdown above to see detailed analytics</p>
                </div>
              )}

              {files.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <h3>No files uploaded</h3>
                  <p>
                    <a href="/upload">Upload your first Excel file</a> to see analytics
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Analytics
