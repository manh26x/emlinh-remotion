import { Composition, CalculateMetadataFunction } from 'remotion';
import { z } from 'zod';
import { VideoContainer } from './VideoContainer';
import { scriptV1Schema, Scene } from './schemas/scriptV1.schema';

// Schema for the composition's props. It expects the full script.
export const compSchema = z.object({
  script: scriptV1Schema.optional(),
});

export const calculateDynamicVideoMetadata: CalculateMetadataFunction<
  z.infer<typeof compSchema>
> = async ({ props }) => {
  // In Node.js, we can read the file and calculate the metadata
  if (typeof window === 'undefined') {
    try {
      const { getVideoScript } = require('./get-video-script');
      const script = getVideoScript();
      const durationInFrames = script.scenes.reduce(
        (acc: number, scene: Scene) => acc + scene.durationInFrames,
        0
      );
      return {
        durationInFrames,
        width: script.meta.width,
        height: script.meta.height,
        fps: script.meta.fps,
        props: { ...props, script },
      };
    } catch (err) {
      console.error('Error loading script for metadata:', err);
    }
  }

  // In the browser, we can't read the file, so we fetch it.
  // We return placeholder data initially, and the actual data will be loaded in the component.
  return {
    durationInFrames: 120, // Placeholder duration
    width: 1080,
    height: 1920,
    fps: 30,
    props: {
      ...props,
      // The script will be fetched in the component
    },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DynamicVideo"
        component={VideoContainer}
        calculateMetadata={calculateDynamicVideoMetadata}
        durationInFrames={120} // Placeholder
        width={1080}
        height={1920}
        fps={30}
        schema={compSchema}
        defaultProps={{
          // No default script needed, it will be fetched
        }}
      />
    </>
  );
};
