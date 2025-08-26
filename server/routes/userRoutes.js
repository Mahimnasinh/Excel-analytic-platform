const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../model/userModel")
const { protect } = require("../middleware/userMiddleware")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  })
}

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email, and password",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    })

    // Update last login
    await user.updateLastLogin()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    })
  }
})

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      })
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        message: "Account is deactivated. Please contact support.",
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    // Update last login
    await user.updateLastLogin()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    })
  }
})

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({
      message: "Server error fetching profile",
      error: error.message,
    })
  }
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email } = req.body

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        message: "Please provide name and email",
      })
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user.id },
    })

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already taken by another user",
      })
    }

    // Update user
    const user = await User.findByIdAndUpdate(req.user.id, { name, email }, { new: true, runValidators: true })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({
      message: "Server error updating profile",
      error: error.message,
    })
  }
})

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Please provide current password and new password",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      })
    }

    // Find user with password
    const user = await User.findById(req.user.id).select("+password")
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Password change error:", error)
    res.status(500).json({
      message: "Server error changing password",
      error: error.message,
    })
  }
})

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get("/", protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      })
    }

    const users = await User.find({}).select("-password").sort({ createdAt: -1 })

    res.json({
      count: users.length,
      users,
    })
  } catch (error) {
    console.error("Users fetch error:", error)
    res.status(500).json({
      message: "Server error fetching users",
      error: error.message,
    })
  }
})

module.exports = router
