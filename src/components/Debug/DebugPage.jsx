import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext_token';

const DebugPage = () => {
  const { testUserLookup, setUserWithId } = useAuth();
  const [username, setUsername] = useState('user123');
  const [email, setEmail] = useState('user@gmail.com');
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const results = await testUserLookup(username, email);
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: error.message });
    }
    setLoading(false);
  };

  const handleManualSet = () => {
    // Manually set user with USR49174 for testing
    setUserWithId('USR49174', username, email);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔧 Debug User API</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username: </label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '5px', marginLeft: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email: </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '5px', marginLeft: '10px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleTest} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Testing...' : '🧪 Test API Calls'}
        </button>
        
        <button 
          onClick={handleManualSet}
          style={{ 
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          👤 Set User Manually (USR49174)
        </button>
      </div>

      {testResults && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <h3>🔍 Test Results</h3>
          <pre style={{ 
            background: 'white', 
            padding: '10px', 
            borderRadius: '3px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>1. Enter your username and email</li>
          <li>2. Click "Test API Calls" to see what the API returns</li>
          <li>3. Check browser console for detailed logs</li>
          <li>4. Use "Set User Manually" to bypass API and test with USR49174</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugPage;
