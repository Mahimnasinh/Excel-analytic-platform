"use client"

import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext" // Import useAuth

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate() // Initialize useNavigate
  const { logout } = useAuth() // Get logout function from auth context

  const menuItems = [
    { path: "/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/upload", icon: "📤", label: "Upload File" },
    { path: "/view-data", icon: "📋", label: "View Data" },
    { path: "/analytics", icon: "📊", label: "Analytics" },
    { path: "/charts", icon: "📈", label: "Charts" },
    { path: "/settings", icon: "⚙️", label: "Settings" },
    { path: "/profile", icon: "👤", label: "Profile" },
  ]

  const handleLogout = () => {
    logout() // Call the logout function from context
    navigate("/signin") // Redirect to sign-in page after logout
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>📊 ExcelAnalytics</h2>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link to={item.path} className={`nav-link ${location.pathname === item.path ? "active" : ""}`}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout button at the bottom of the sidebar */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-link logout-btn">
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
