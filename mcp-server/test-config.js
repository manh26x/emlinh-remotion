// Test configuration với direct import
import('./dist/server.js').then(async (server) => {
  console.log('🧪 Testing Configuration...\n');
  
  try {
    // Create services để test configuration
    const remotionService = new (await import('./src/services/remotion-service.ts')).RemotionService();
    
    console.log('Testing project validation...');
    const validation = await remotionService.validateProject();
    
    console.log('\n📊 Validation Results:');
    console.log('Valid:', validation.isValid);
    console.log('Errors:', validation.errors);
    console.log('Warnings:', validation.warnings);
    console.log('Compositions found:', validation.compositions.length);
    
    if (validation.isValid) {
      console.log('\n🎉 Project validation successful!');
    } else {
      console.log('\n❌ Project validation failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}).catch(console.error);
