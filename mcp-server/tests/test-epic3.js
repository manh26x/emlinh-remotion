#!/usr/bin/env node

import { RenderService } from '../src/services/render-service.ts';
import { RemotionService } from '../src/services/remotion-service.ts';

async function testEpic3() {
  console.log('🎬 Testing Epic 3: Render Operations (Direct Test)\n');

  const renderService = new RenderService('../../');
  const remotionService = new RemotionService('../../');

  try {
    // Test 1: List compositions (prerequisite)
    console.log('1️⃣ Checking available compositions...');
    const compositions = await remotionService.discoverCompositions();
    console.log(`✅ Found ${compositions.length} compositions:`, compositions.map(c => c.id));

    if (compositions.length === 0) {
      console.log('❌ No compositions found. Cannot test render operations.');
      return;
    }

    const testComposition = compositions[0].id;
    console.log(`\n📹 Using composition '${testComposition}' for testing...`);

    // Test 2: Trigger render
    console.log('\n2️⃣ Testing Render Triggering...');
    const renderJob = await renderService.triggerRender(testComposition, {
      width: 1280,
      height: 720,
      quality: 5,
      concurrency: 1,
      durationInFrames: 30 // Short test render
    });

    console.log('✅ Render job created successfully!');
    console.log(`Job ID: ${renderJob.id}`);
    console.log(`Status: ${renderJob.status}`);
    console.log(`Estimated Duration: ${renderJob.estimatedDuration}s`);

    // Test 3: Check status immediately
    console.log('\n3️⃣ Testing Render Status...');
    let status = await renderService.getRenderStatus(renderJob.id);
    console.log(`✅ Status retrieved: ${status?.status} (${status?.progress}%)`);

    // Test 4: List render jobs
    console.log('\n4️⃣ Testing Render Job Listing...');
    const jobs = await renderService.listRenderJobs(5);
    console.log(`✅ Listed ${jobs.length} render jobs`);
    jobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.compositionId} - ${job.status} (${job.progress}%)`);
    });

    // Test 5: Monitor render progress (for a few seconds)
    console.log('\n5️⃣ Testing Progress Monitoring...');
    let monitorCount = 0;
    const maxMonitorCount = 10; // Monitor for ~10 seconds

    while (monitorCount < maxMonitorCount) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      status = await renderService.getRenderStatus(renderJob.id);
      if (!status) break;

      console.log(`📊 Progress: ${status.status} (${status.progress}%) - ${new Date().toLocaleTimeString()}`);
      
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        console.log(`✅ Render ${status.status}!`);
        if (status.outputPath && status.status === 'completed') {
          console.log(`📄 Output file: ${status.outputPath}`);
        }
        if (status.error) {
          console.log(`❌ Error: ${status.error}`);
        }
        break;
      }

      monitorCount++;
    }

    // Test 6: Cancel render (if still running)
    if (status && (status.status === 'running' || status.status === 'pending')) {
      console.log('\n6️⃣ Testing Render Cancellation...');
      const cancelled = await renderService.cancelRender(renderJob.id);
      console.log(`✅ Cancel operation: ${cancelled ? 'SUCCESS' : 'FAILED'}`);
      
      // Check final status
      const finalStatus = await renderService.getRenderStatus(renderJob.id);
      console.log(`Final status: ${finalStatus?.status}`);
    }

    // Test 7: Test invalid operations
    console.log('\n7️⃣ Testing Error Handling...');
    
    // Test invalid composition
    try {
      await renderService.triggerRender('InvalidComposition', {});
      console.log('❌ Should have failed for invalid composition');
    } catch (error) {
      console.log('✅ Correctly handled invalid composition error');
    }

    // Test invalid job ID
    const invalidStatus = await renderService.getRenderStatus('invalid-job-id');
    console.log(`✅ Invalid job ID handled: ${invalidStatus === null ? 'NULL' : 'UNEXPECTED'}`);

    console.log('\n✅ Epic 3 Direct Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEpic3();
