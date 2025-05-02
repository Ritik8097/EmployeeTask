import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import axios from "axios"
import TaskList from "./TaskList"
import Navbar from "./Navbar"
import DepartmentFilter from "./DepartmentFilter"
import LiveDateTime from "./LiveDateTime"

import DateRangePicker from "./DateRangePicker"
import ExportModal from "./ExportModal"
import { saveAs } from "file-saver"

const AdminDashboard = () => {
  const { user } = useContext(AuthContext)
  const [tasks, setTasks] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    const fetchTasksAndDepartments = async () => {
      try {
        const [tasksResponse, departmentsResponse] = await Promise.all([
          axios.get("https://employeetaskbackend.onrender.com/api/tasks", {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get("https://employeetaskbackend.onrender.com/api/departments", {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ])

        // Sort tasks by createdAt in descending order (newest first)
        const sortedTasks = tasksResponse.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTasks(sortedTasks);
        setDepartments(departmentsResponse.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch data")
        setLoading(false)
      }
    }

    fetchTasksAndDepartments()
  }, [user])

  const filteredTasks = () => {
    // First filter by department
    let filtered =
      selectedDepartment === "all" ? tasks : tasks.filter((task) => task.employee.department === selectedDepartment)

    // Then filter by status/priority
    

    // Filter by date range if present
    if (dateRange) {
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false

        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)

        let isAfterStart = true
        let isBeforeEnd = true

        if (dateRange.startDate) {
          const startDate = new Date(dateRange.startDate)
          startDate.setHours(0, 0, 0, 0)
          isAfterStart = taskDate >= startDate
        }

        if (dateRange.endDate) {
          const endDate = new Date(dateRange.endDate)
          endDate.setHours(0, 0, 0, 0)
          isBeforeEnd = taskDate <= endDate
        }

        return isAfterStart && isBeforeEnd
      })
    }

    // Finally, filter by search term if present
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term)) ||
          task.employee.name.toLowerCase().includes(term),
      )
    }

    return filtered
  }

  const handleExport = async (exportOptions) => {
    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (exportOptions.department !== "all") {
        params.append("department", exportOptions.department)
      }

      if (exportOptions.dateRange) {
        if (exportOptions.dateRange.startDate) {
          params.append("startDate", exportOptions.dateRange.startDate)
        }
        if (exportOptions.dateRange.endDate) {
          params.append("endDate", exportOptions.dateRange.endDate)
        }
      }

      // Determine endpoint based on export type
      const endpoint =
        exportOptions.type === "excel"
          ? "https://employeetaskbackend.onrender.com/api/tasks/export"
          : "https://employeetaskbackend.onrender.com/api/tasks/export-pdf"

      const response = await axios.get(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: "blob",
      })

      // Generate filename
      const department = exportOptions.department === "all" ? "all-departments" : exportOptions.department
      const dateStr = exportOptions.dateRange?.startDate
        ? `-${exportOptions.dateRange.startDate.replace(/-/g, "")}`
        : ""
      const extension = exportOptions.type === "excel" ? "xlsx" : "pdf"

      const filename = `tasks-${department}${dateStr}.${extension}`

      // Create and save blob
      const contentType =
        exportOptions.type === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf"

      const blob = new Blob([response.data], { type: contentType })
      saveAs(blob, filename)
    } catch (err) {
      setError(`Failed to export tasks: ${err.message}`)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Admin Dashboard</h2>
          <div className="welcome-message">Welcome, {user.name}!</div>
        </div>
        <LiveDateTime />
      </div>

      {error && <div className="error-message">{error}</div>}

      

      <div className="dashboard-controls">
        <div className="controls-left">
          <DepartmentFilter
            departments={departments}
            selectedDepartment={selectedDepartment}
            onSelectDepartment={setSelectedDepartment}
          />

          <div className="search-container">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <DateRangePicker onDateChange={setDateRange} />
        </div>

        <div className="controls-right">
          <button onClick={() => setShowExportModal(true)} className="export-button">
            Export Tasks
          </button>
        </div>
      </div>

      

      <div className="dashboard-content">
        <div className="task-section full-width">
          <h3>
            {selectedDepartment === "all" ? "All Tasks" : `Tasks for ${selectedDepartment} Department`}
            {dateRange && (
              <span className="date-filter-info">
                {dateRange.startDate && dateRange.endDate
                  ? ` (${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()})`
                  : dateRange.startDate
                    ? ` (From ${new Date(dateRange.startDate).toLocaleDateString()})`
                    : ` (Until ${new Date(dateRange.endDate).toLocaleDateString()})`}
              </span>
            )}{" "}
            ({filteredTasks().length})
          </h3>
          <TaskList tasks={filteredTasks()} isEmployee={false} showEmployeeInfo={true} />
        </div>
      </div>

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          departments={departments}
        />
      )}
    </div>
  )
}

export default AdminDashboard
