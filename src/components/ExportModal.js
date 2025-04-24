
import { useState } from "react"

const ExportModal = ({ isOpen, onClose, onExport, departments }) => {
  const [exportType, setExportType] = useState("excel")
  const [department, setDepartment] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  if (!isOpen) return null

  const handleExport = () => {
    onExport({
      type: exportType,
      department,
      dateRange: startDate || endDate ? { startDate, endDate } : null,
    })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="export-modal">
        <div className="modal-header">
          <h3>Export Tasks</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="export-type">Export Format:</label>
            <select id="export-type" value={exportType} onChange={(e) => setExportType(e.target.value)}>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="export-department">Department:</label>
            <select id="export-department" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id || dept} value={dept.name || dept}>
                  {dept.name || dept}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date Range (Optional):</label>
            <div className="date-inputs">
              <div className="date-input-group">
                <label htmlFor="export-start-date">From:</label>
                <input
                  type="date"
                  id="export-start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
              </div>

              <div className="date-input-group">
                <label htmlFor="export-end-date">To:</label>
                <input
                  type="date"
                  id="export-end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="export-button" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
