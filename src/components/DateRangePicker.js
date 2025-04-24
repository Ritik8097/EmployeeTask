
import { useState } from "react"

const DateRangePicker = ({ onDateChange }) => {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value
    setStartDate(newStartDate)

    if (endDate && newStartDate) {
      onDateChange({ startDate: newStartDate, endDate })
    } else if (newStartDate) {
      onDateChange({ startDate: newStartDate, endDate: null })
    } else if (endDate) {
      onDateChange({ startDate: null, endDate })
    } else {
      onDateChange(null)
    }
  }

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value
    setEndDate(newEndDate)

    if (startDate && newEndDate) {
      onDateChange({ startDate, endDate: newEndDate })
    } else if (newEndDate) {
      onDateChange({ startDate: null, endDate: newEndDate })
    } else if (startDate) {
      onDateChange({ startDate, endDate: null })
    } else {
      onDateChange(null)
    }
  }

  const clearDates = () => {
    setStartDate("")
    setEndDate("")
    onDateChange(null)
  }

  return (
    <div className="date-range-picker">
      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">From:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={handleStartDateChange}
            max={endDate || undefined}
          />
        </div>

        <div className="date-input-group">
          <label htmlFor="end-date">To:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate || undefined}
          />
        </div>
      </div>

      {(startDate || endDate) && (
        <button onClick={clearDates} className="clear-date-btn" title="Clear dates">
          ×
        </button>
      )}
    </div>
  )
}

export default DateRangePicker;


