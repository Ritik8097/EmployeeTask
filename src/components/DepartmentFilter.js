import React from 'react';

const DepartmentFilter = ({ departments, selectedDepartment, onSelectDepartment }) => {
  return (
    <div className="department-filter">
      <label htmlFor="department-select">Filter by Department:</label>
      <select
        id="department-select"
        value={selectedDepartment}
        onChange={(e) => onSelectDepartment(e.target.value)}
      >
        <option value="all">All Departments</option>
        {departments.map(dept => (
          <option key={dept._id} value={dept.name}>
            {dept.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DepartmentFilter;