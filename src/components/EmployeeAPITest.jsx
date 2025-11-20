import React, { useEffect, useState } from 'react';
import { fetchAllEmployees } from '../services/employeeAPI.js';

const EmployeeAPITest = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setLoading(true);
        const result = await fetchAllEmployees();
        setEmployees(result);
      
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">Loading employees from API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading employees: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-green-800 font-semibold mb-2">
        API Test Successful! Loaded {employees.length} employees
      </h3>
      <div className="max-h-40 overflow-y-auto">
        {employees.slice(0, 5).map((emp, index) => (
          <div key={emp.id} className="text-sm text-green-700 mb-1">
            {index + 1}. {emp.name} ({emp.role}) - {emp.email}
          </div>
        ))}
        {employees.length > 5 && (
          <div className="text-sm text-green-600 italic">
            ... and {employees.length - 5} more employees
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAPITest;
