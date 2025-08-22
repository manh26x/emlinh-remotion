import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

// Mock để test validation
async function testValidation() {
  console.log('🧪 Testing Project Validation...\n');

  try {
    // Test project structure từ project root
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '../../');
    console.log('Project root:', projectRoot);
    
    // Check package.json
    const packageJsonPath = path.join(projectRoot, 'package.json');
    try {
      await fs.access(packageJsonPath);
      console.log('✅ package.json found at:', packageJsonPath);
    } catch {
      console.log('❌ package.json not found at:', packageJsonPath);
    }

    // Check src directory
    const srcPath = path.join(projectRoot, 'src');
    try {
      await fs.access(srcPath);
      console.log('✅ src directory found at:', srcPath);
    } catch {
      console.log('❌ src directory not found at:', srcPath);
    }

    // Check remotion.config.ts
    const configPath = path.join(projectRoot, 'remotion.config.ts');
    try {
      await fs.access(configPath);
      console.log('✅ remotion.config.ts found at:', configPath);
    } catch {
      console.log('⚠️ remotion.config.ts not found at:', configPath, '(optional)');
    }

    console.log('\n🎉 Project structure validation completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testValidation();
