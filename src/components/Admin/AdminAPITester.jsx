import React, { useState } from 'react';
import adminChatAPI from '../../services/adminChatAPI';

/**
 * Admin API Test Component - For CRM Dashboard Testing
 * This component provides buttons to test all admin API endpoints
 * Only works with admin endpoints - designed for localhost:8000/crm
 */
const AdminAPITester = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, status, data = null, error = null) => {
    const result = {
      id: Date.now(),
      test,
      status,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const runTest = async (testName, testFn) => {
    try {
      const result = await testFn();
      addResult(testName, 'success', result);
      return result;
    } catch (error) {
      addResult(testName, 'error', null, error.message);
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: List all rooms
      const rooms = await runTest('List All Rooms', () => adminChatAPI.listAllRooms());
      
      if (rooms.status === 'success' && rooms.data && rooms.data.length > 0) {
        const testRoom = rooms.data[0];
        const roomId = testRoom.room_id;
        
        // Test 2: Get room details
        await runTest('Get Room Details', () => adminChatAPI.getRoomDetails(roomId));
        
        // Test 3: Get room messages
        await runTest('Get Room Messages', () => adminChatAPI.getRoomMessages(roomId));
        
        // Test 4: Get room stats
        await runTest('Get Room Stats', () => adminChatAPI.getRoomStats(roomId));
        
        // Test 5: Check admin rights (for first participant)
        if (testRoom.participants && testRoom.participants.length > 0) {
          const participant = testRoom.participants.find(p => p.employee_id !== 'N/A');
          if (participant) {
            await runTest('Check Admin Rights', () => 
              adminChatAPI.checkAdminRights(roomId, participant.employee_id)
            );
          }
        }
        
        // Test 6: Edit room details (if it's a group)
        if (testRoom.is_group) {
          await runTest('Edit Room Details', () => 
            adminChatAPI.editRoomDetails(roomId, {
              room_name: `${testRoom.room_name} (API Test)`,
              room_desc: 'Updated via CRM API test'
            })
          );
        }
      }
      
      // Test 7: Create test group
      await runTest('Create Test Group', () => 
        adminChatAPI.createGroup({
          group_name: 'CRM API Test Group',
          group_description: 'Created via CRM dashboard test',
          group_icon: 'test-icon',
          participants_ids: ['emp-K6m82p2AJ6bd', 'emp-Hfpxcxh1L612']
        })
      );

      addResult('All Tests', 'success', { message: 'All tests completed successfully!' });
      
    } catch (error) {
      addResult('Test Suite', 'error', null, 'Some tests failed - check individual results');
    } finally {
      setIsRunning(false);
    }
  };

  const testSpecificEndpoint = async (endpointName, testFn) => {
    setIsRunning(true);
    try {
      await runTest(endpointName, testFn);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="admin-api-tester p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">CRM Admin API Tester</h2>
        <p className="text-gray-600 text-sm">
          Test all admin API endpoints to ensure they work correctly in the CRM environment
        </p>
        <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
          Testing: https://console.gofloww.xyz/api/wall/chat/admin/*
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-purple-500 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {isRunning ? '🧪 Running Tests...' : '🧪 Run All Tests'}
          </button>
          
          <button
            onClick={() => testSpecificEndpoint('List Rooms', () => adminChatAPI.listAllRooms())}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded"
          >
            📋 List Rooms
          </button>
          
          <button
            onClick={() => testSpecificEndpoint('Test Create Group', () => 
              adminChatAPI.createGroup({
                group_name: `Test Group ${Date.now()}`,
                group_description: 'Quick test group',
                group_icon: 'test',
                participants_ids: ['emp-K6m82p2AJ6bd']
              })
            )}
            disabled={isRunning}
            className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded"
          >
            ➕ Create Group
          </button>

          <button
            onClick={() => setTestResults([])}
            className="bg-gray-500 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded"
          >
            🗑️ Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        <h3 className="font-semibold">Test Results ({testResults.length})</h3>
        
        {testResults.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No tests run yet. Click "Run All Tests" to start.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded-lg border-l-4 ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">
                    {result.status === 'success' ? '✅' : '❌'} {result.test}
                  </span>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                
                {result.status === 'success' && result.data && (
                  <div className="text-sm text-green-700 mt-1">
                    {typeof result.data === 'object' ? (
                      result.data.status ? 
                        `Status: ${result.data.status}${result.data.data?.length ? ` • Count: ${result.data.data.length}` : ''}` :
                        JSON.stringify(result.data, null, 2).substring(0, 100) + '...'
                    ) : (
                      String(result.data)
                    )}
                  </div>
                )}
                
                {result.error && (
                  <div className="text-sm text-red-700 mt-1">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="mt-6 text-xs text-gray-500 border-t pt-4">
        <p><strong>Note:</strong> This component only works in the CRM admin environment (localhost:8000/crm).</p>
        <p>All API calls use admin endpoints with proper authorization tokens.</p>
        <p>Open browser console (F12) to see detailed API logs.</p>
      </div>
    </div>
  );
};

export default AdminAPITester;