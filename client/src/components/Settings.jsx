"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import { useAuth } from "../context/authContext"

const Settings = () => {
  const { user, token } = useAuth()
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("New passwords do not match")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/change-password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Password changed successfully!")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setMessage(data.message || "Password change failed")
      }
    } catch (error) {
      setMessage("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-main">
        <div className="settings-container">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Manage your account settings and preferences</p>
          </div>

          <div className="settings-content">
            <div className="settings-section">
              <h2>Change Password</h2>
              <div className="settings-card">
                <form onSubmit={handlePasswordSubmit} className="password-form">
                  {message && (
                    <div className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</div>
                  )}

                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Changing Password..." : "Change Password"}
                  </button>
                </form>
              </div>
            </div>

            <div className="settings-section">
              <h2>Account Information</h2>
              <div className="settings-card">
                <div className="account-info">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{user?.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Member since:</span>
                    <span className="info-value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h2>Data Management</h2>
              <div className="settings-card">
                <div className="data-management">
                  <p>Manage your uploaded files and data</p>
                  <div className="management-actions">
                    <button className="btn btn-secondary">Export Data</button>
                    <button className="btn btn-danger">Delete All Files</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings
