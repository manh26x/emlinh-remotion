#!/usr/bin/env node

import { RemotionService } from './src/services/remotion-service.ts';

async function testEpic2Directly() {
  console.log('🎬 Testing Epic 2: Remotion Integration (Direct Test)\n');

  const remotionService = new RemotionService('../');

  try {
    // Test 1: Validate Project
    console.log('1️⃣ Testing Project Validation...');
    const validation = await remotionService.validateProject();
    
    console.log('✅ Project validation completed');
    console.log('Is Valid:', validation.isValid);
    console.log('Errors:', validation.errors);
    console.log('Warnings:', validation.warnings);
    console.log('Compositions found:', validation.compositions.length);

    // Test 2: Discover Compositions
    console.log('\n2️⃣ Testing Composition Discovery...');
    const compositions = await remotionService.discoverCompositions();
    
    console.log('✅ Composition discovery completed');
    console.log('Compositions found:', compositions.length);
    
    if (compositions.length > 0) {
      compositions.forEach((comp, index) => {
        console.log(`\nComposition ${index + 1}:`);
        console.log(`  ID: ${comp.id}`);
        console.log(`  Resolution: ${comp.width}x${comp.height}`);
        console.log(`  Duration: ${comp.durationInFrames} frames (${Math.round(comp.durationInFrames / comp.fps * 100) / 100}s)`);
        console.log(`  FPS: ${comp.fps}`);
      });
    }

    // Test 3: Check specific composition
    if (compositions.length > 0) {
      console.log('\n3️⃣ Testing Composition Info...');
      const firstComp = compositions[0];
      const exists = await remotionService.compositionExists(firstComp.id);
      const info = await remotionService.getCompositionInfo(firstComp.id);
      
      console.log('✅ Composition info test completed');
      console.log(`Composition "${firstComp.id}" exists:`, exists);
      console.log('Composition info:', info);
    }

    console.log('\n✅ Epic 2 Direct Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEpic2Directly();
