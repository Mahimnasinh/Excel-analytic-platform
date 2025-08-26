"use client"
import { Link } from "react-router-dom"
import { useAuth } from "../context/authContext"

const Navbar = () => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          📊 ExcelAnalytics
        </Link>

        <div className="nav-menu">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/upload" className="nav-link">
                Upload
              </Link>
              <Link to="/analytics" className="nav-link">
                Analytics
              </Link>
              <span className="nav-user">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="nav-link logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="nav-link">
                Sign In
              </Link>
              <Link to="/signup" className="nav-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
