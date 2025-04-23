
import React, { useState, useContext } from "react"
import { useNavigate, Link } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import axios from "axios"

const Register = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [department, setDepartment] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)

  // Fetch departments when component mounts
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // This will fail without authentication, so we'll use a hardcoded list for now
        // In a real app, you might want to create a public endpoint for this
        setDepartments(["Developer", "Creatives", "Digital Marketer", "Finance", "HR"])
      } catch (err) {
        console.error("Failed to fetch departments:", err)
      }
    }

    fetchDepartments()
  }, [])

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword || !department) {
      setError("All fields are required")
      return false
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        department,
        role: "employee", // Default role for self-registration
      })

      // Login the user with the returned data
      login(response.data)

      // Redirect to the appropriate dashboard
      navigate("/employee-dashboard")
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Employee Task Tracker</h2>
        <h3>Register</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name:</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="department">Department:</label>
            <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} required>
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="register-link" style={{ marginTop: "1rem", textAlign: "center" }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
