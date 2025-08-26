"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/authContext"

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return user ? children : <Navigate to="/signin" />
}

export default ProtectedRoute
