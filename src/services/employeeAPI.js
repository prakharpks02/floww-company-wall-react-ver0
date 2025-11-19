// Employee API service for fetching real employee data
import { cookieUtils } from '../utils/cookieUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/wall', '') || 'https://console.gofloww.xyz/api';

const getApiHeaders = () => {
  const { employeeToken, employeeId } = cookieUtils.getAuthTokens();
  return {
    'Authorization': employeeToken || '',
    'employeeId': employeeId || '',
    'Content-Type': 'application/json'
  };
};

/**
 * Fetch all employees from the API
 * @returns {Promise<Array>} Array of employee objects
 */
export const fetchAllEmployees = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/employee/get-all-employees/`, {
      method: 'GET',
      headers: getApiHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'success' && Array.isArray(data.response)) {
      // Transform API response to match the structure expected by the chat components
      return data.response.map((employee, index) => ({
        id: index + 1, // Generate sequential IDs for compatibility
        name: employee.employeeName,
        email: employee.companyEmail,
        phone: employee.phoneNumber,
        role: employee.designation || 'Not provided',
        department: employee.department || 'Not provided',
        location: 'Not provided', // API doesn't provide location
        employeeId: employee.employeeId,
        joinDate: 'Not provided', // API doesn't provide join date
        bio: `${employee.designation || 'Employee'} in ${employee.department || 'the company'}. Contact at ${employee.companyEmail}`,
        avatar: getInitials(employee.employeeName),
        status: Math.random() > 0.3 ? 'online' : Math.random() > 0.5 ? 'away' : 'offline', // Random status for demo
        lastSeen: new Date(Date.now() - Math.floor(Math.random() * 4 * 60 * 60 * 1000)), // Random last seen within 4 hours
        profilePictureLink: employee.profilePictureLink
      }));
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    // Return empty array on error to prevent breaking the app
    return [];
  }
};

/**
 * Get employee initials from name for avatar
 * @param {string} name - Employee name
 * @returns {string} Initials
 */
const getInitials = (name) => {
  if (!name) return 'U';
  
  const nameParts = name.trim().split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Find employee by ID (employeeId from API)
 * @param {string} employeeId - Employee ID from API
 * @param {Array} employees - Array of employees
 * @returns {Object|null} Employee object or null
 */
export const findEmployeeByEmployeeId = (employeeId, employees) => {
  return employees.find(emp => emp.employeeId === employeeId) || null;
};

/**
 * Find employee by sequential ID (used internally in chat)
 * @param {number} id - Sequential ID
 * @param {Array} employees - Array of employees
 * @returns {Object|null} Employee object or null
 */
export const findEmployeeById = (id, employees) => {
  return employees.find(emp => emp.id === id) || null;
};

/**
 * Search employees by name, email, or department
 * @param {string} query - Search query
 * @param {Array} employees - Array of employees
 * @returns {Array} Filtered employees
 */
export const searchEmployees = (query, employees) => {
  if (!query || !employees) return employees;
  
  const lowercaseQuery = query.toLowerCase();
  return employees.filter(employee => 
    employee.name.toLowerCase().includes(lowercaseQuery) ||
    employee.email.toLowerCase().includes(lowercaseQuery) ||
    employee.department.toLowerCase().includes(lowercaseQuery) ||
    employee.role.toLowerCase().includes(lowercaseQuery)
  );
};
