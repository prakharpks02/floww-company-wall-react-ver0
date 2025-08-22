// Custom hook for mentions handling
import { useState } from 'react';

export const useMentionsHandling = (getAllEmployees) => {
  const [showMentions, setShowMentions] = useState(false);

  const filterEmployees = (searchTerm) => {
    const employees = getAllEmployees();
    if (!searchTerm) return employees.slice(0, 10);
    
    return employees
      .filter(emp =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10);
  };

  return {
    showMentions,
    setShowMentions,
    filterEmployees
  };
};
