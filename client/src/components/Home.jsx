import { Link } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />

      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Excel Analytics Platform</h1>
          <p className="hero-subtitle">
            Upload, analyze, and visualize your Excel data with powerful analytics and interactive charts
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/signin" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Advanced Analytics</h3>
            <p>Get detailed insights from your Excel data with comprehensive analytics</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Interactive Charts</h3>
            <p>Visualize your data with beautiful, interactive charts and graphs</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Storage</h3>
            <p>Your data is safely stored and protected with enterprise-grade security</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Processing</h3>
            <p>Quick file processing and real-time analytics for immediate insights</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Home
