const jwt = require("jsonwebtoken")
const User = require("../model/userModel")

const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

      // Attach user to the request
      req.user = await User.findById(decoded.userId).select("-password")

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" })
      }

      next()
    } catch (error) {
      console.error("Token verification error:", error)
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Not authorized, token expired" })
      }
      return res.status(401).json({ message: "Not authorized, token failed" })
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" })
  }
}

// Middleware for admin role check (optional, if you have admin routes)
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403).json({ message: "Not authorized as an admin" })
  }
}

module.exports = { protect, admin }
