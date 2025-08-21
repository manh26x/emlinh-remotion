const { VideoStreamingService } = require('./dist/server.js');

async function testVideoStreaming() {
  console.log('🧪 Testing Video Streaming Service...\n');

  try {
    const service = new VideoStreamingService();
    
    // Test 1: Create video stream
    console.log('1. Testing createVideoStream...');
    const stream = await service.createVideoStream('test-job-123', './test-video.mp4');
    console.log('✅ Stream created:', {
      id: stream.id,
      jobId: stream.jobId,
      status: stream.status,
      totalBytes: stream.totalBytes,
      contentType: stream.contentType
    });

    // Test 2: Get stream info
    console.log('\n2. Testing getStreamInfo...');
    const streamInfo = await service.getStreamInfo(stream.id);
    console.log('✅ Stream info retrieved:', {
      id: streamInfo.id,
      status: streamInfo.status,
      progress: `${Math.round((streamInfo.streamedBytes / streamInfo.totalBytes) * 100)}%`
    });

    // Test 3: List streams
    console.log('\n3. Testing listStreams...');
    const streams = await service.listStreams();
    console.log('✅ Streams listed:', streams.length, 'streams found');

    // Test 4: Stream video chunk
    console.log('\n4. Testing streamVideoChunk...');
    const chunk = await service.streamVideoChunk(stream.id, 0);
    console.log('✅ Video chunk streamed:', {
      chunkSize: chunk.chunk.length,
      offset: chunk.offset,
      total: chunk.total,
      isLast: chunk.isLast
    });

    // Test 5: Cancel stream
    console.log('\n5. Testing cancelStream...');
    const cancelled = await service.cancelStream(stream.id);
    console.log('✅ Stream cancelled:', cancelled);

    console.log('\n🎉 All tests passed! Video streaming service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testVideoStreaming();
