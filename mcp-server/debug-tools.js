import('./dist/server.js').then(async (module) => {
  console.log('🔍 Debugging Tools...\n');
  
  try {
    // Extract MCPHandler from module
    const exports = Object.keys(module);
    console.log('Available exports:', exports);
    
    // Try to access MCPHandler 
    if (module.MCPHandler) {
      const handler = new module.MCPHandler();
      console.log('MCPHandler created successfully');
      
      // Access tools property directly
      if (handler.tools) {
        console.log('Tools count:', handler.tools.length);
        console.log('Tool names:', handler.tools.map(t => t.name));
        
        // Check for video streaming tools
        const videoTools = handler.tools.filter(t => t.name.includes('video'));
        console.log('Video tools found:', videoTools.length);
        console.log('Video tool names:', videoTools.map(t => t.name));
      } else {
        console.log('No tools property found');
      }
    } else {
      console.log('MCPHandler not found in exports');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}).catch(console.error);
