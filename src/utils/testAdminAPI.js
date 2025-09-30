// Admin API Test Script
// This script tests all the admin API functions to ensure they work correctly

import adminAPI from '../services/adminAPI.js';

const testAdminAPI = async () => {
  console.log('🚀 Starting Admin API Tests...\n');

  try {
    // Test 1: List all rooms
    console.log('📋 Test 1: Listing all rooms...');
    const roomsResponse = await adminAPI.listAllRooms();
    console.log('✅ Rooms Response:', roomsResponse);
    
    if (roomsResponse.status === 'success' && roomsResponse.data.length > 0) {
      const testRoom = roomsResponse.data[0];
      console.log(`📍 Using test room: ${testRoom.room_name} (${testRoom.room_id})\n`);

      // Test 2: Get room details
      console.log('🔍 Test 2: Getting room details...');
      const roomDetails = await adminAPI.getRoomDetails(testRoom.room_id);
      console.log('✅ Room Details:', roomDetails);

      // Test 3: Get room messages
      console.log('\n💬 Test 3: Getting room messages...');
      const messages = await adminAPI.getRoomMessages(testRoom.room_id);
      console.log('✅ Messages Response:', messages);

      // Test 4: Get room statistics
      console.log('\n📊 Test 4: Getting room statistics...');
      const stats = await adminAPI.getRoomStats(testRoom.room_id);
      console.log('✅ Room Stats:', stats);

      // Test 5: Edit room details (if it's a group)
      if (testRoom.is_group) {
        console.log('\n✏️  Test 5: Editing room details...');
        const editResponse = await adminAPI.editRoomDetails(testRoom.room_id, {
          room_name: `${testRoom.room_name} (Updated)`,
          room_desc: 'Updated via API test'
        });
        console.log('✅ Edit Response:', editResponse);
      }

      // Test 6: Check admin rights for first participant
      if (testRoom.participants && testRoom.participants.length > 0) {
        const firstParticipant = testRoom.participants[0];
        if (firstParticipant.employee_id !== 'N/A') {
          console.log('\n👤 Test 6: Checking admin rights...');
          const hasAdminRights = await adminAPI.checkAdminRights(testRoom.room_id, firstParticipant.employee_id);
          console.log(`✅ ${firstParticipant.employee_name} has admin rights: ${hasAdminRights}`);
        }
      }
    }

    // Test 7: Create a test group
    console.log('\n🏗️  Test 7: Creating a test group...');
    const createGroupResponse = await adminAPI.createGroup({
      group_name: 'API Test Group',
      group_description: 'Created via API test script',
      group_icon: 'test-icon',
      participants_ids: ['emp-K6m82p2AJ6bd', 'emp-Hfpxcxh1L612']
    });
    console.log('✅ Create Group Response:', createGroupResponse);

    console.log('\n🎉 All Admin API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in other modules
export default testAdminAPI;

// For direct Node.js execution
if (typeof window === 'undefined') {
  testAdminAPI();
}