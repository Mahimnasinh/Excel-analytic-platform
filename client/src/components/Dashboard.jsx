"use client"

import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import { useAuth } from "../context/authContext"

const Dashboard = () => {
  const { user, token } = useAuth()
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalRows: 0,
    recentUploads: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/files/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-info">
                  <h3>{stats.totalFiles}</h3>
                  <p>Total Files</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>{stats.totalRows}</h3>
                  <p>Total Rows Processed</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <h3>{stats.recentUploads.length}</h3>
                  <p>Recent Uploads</p>
                </div>
              </div>
            </div>

            <div className="recent-files">
              <h2>Recent Uploads</h2>
              {stats.recentUploads.length > 0 ? (
                <div className="files-list">
                  {stats.recentUploads.map((file) => (
                    <div key={file._id} className="file-item">
                      <div className="file-icon">📄</div>
                      <div className="file-info">
                        <h4>{file.filename}</h4>
                        <p>Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</p>
                        <p>Rows: {file.rowCount || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>
                    No files uploaded yet. <a href="/upload">Upload your first file</a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
