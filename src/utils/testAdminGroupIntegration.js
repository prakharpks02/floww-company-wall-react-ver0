// Test Admin Group Creation Integration
// This test verifies that group creation in chat now uses admin API

const testAdminGroupCreation = async () => {
  console.log('🧪 Testing Admin Group Creation Integration...');
  
  try {
    // Import the admin API
    const adminChatAPI = (await import('../services/adminChatAPI')).default;
    
    // Test data matching what the chat will send
    const testGroupData = {
      group_name: 'Test Integration Group',
      group_description: 'Testing admin API integration in chat',
      group_icon: 'TIG', // Generated from group name
      participants_ids: ['emp-K6m82p2AJ6bd', 'emp-Hfpxcxh1L612']
    };
    
    console.log('🔧 Test Group Data:', testGroupData);
    
    // Call the admin API directly
    const response = await adminChatAPI.createGroup(testGroupData);
    
    console.log('✅ Admin API Response:', response);
    
    if (response.status === 'success') {
      console.log('✅ SUCCESS: Admin group creation API is working!');
      console.log('📝 The chat interface will now use:', 'https://dev.gofloww.co/api/wall/chat/admin/rooms/create_group');
      
      // Test listing rooms to see if the group appears
      const roomsResponse = await adminChatAPI.listAllRooms();
      if (roomsResponse.status === 'success') {
        const newGroup = roomsResponse.data.find(room => 
          room.room_name === testGroupData.group_name
        );
        
        if (newGroup) {
          console.log('✅ SUCCESS: New group found in rooms list:', newGroup.room_id);
        } else {
          console.log('⚠️ Group created but not found in rooms list immediately');
        }
      }
      
    } else {
      console.log('❌ FAILED: Admin API returned error:', response);
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  }
};

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.testAdminGroupCreation = testAdminGroupCreation;
  console.log('🧪 Admin group creation test loaded. Run window.testAdminGroupCreation() to test.');
}

export default testAdminGroupCreation;