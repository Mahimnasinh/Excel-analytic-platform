"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import { useAuth } from "../context/authContext"

const Profile = () => {
  const { user, token } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Profile updated successfully!")
        setEditing(false)
      } else {
        setMessage(data.message || "Update failed")
      }
    } catch (error) {
      setMessage("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    })
    setEditing(false)
    setMessage("")
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-main">
        <div className="profile-container">
          <div className="profile-header">
            <h1>Profile</h1>
            <p>Manage your account information</p>
          </div>

          <div className="profile-card">
            <div className="profile-avatar">
              <div className="avatar-circle">{user?.name?.charAt(0).toUpperCase()}</div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              {message && (
                <div className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</div>
              )}

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                />
              </div>

              <div className="form-actions">
                {editing ? (
                  <>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button type="button" onClick={handleCancel} className="btn btn-secondary">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setEditing(true)} className="btn btn-primary">
                    Edit Profile
                  </button>
                )}
              </div>
            </form>

            <div className="profile-info">
              <h3>Account Information</h3>
              <div className="info-item">
                <span className="info-label">Member since:</span>
                <span className="info-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Last login:</span>
                <span className="info-value">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile
