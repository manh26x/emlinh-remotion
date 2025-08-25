import React, { useState, useEffect } from 'react';
import { AbsoluteFill, Sequence, Audio, useCurrentFrame, interpolate, staticFile } from 'remotion';
import { ScriptV1, Scene as SceneType } from './schemas/scriptV1.schema';
import { ScenePlayer } from './ScenePlayer';
import { Captions } from './components/Captions';
import { normalizeScript } from './utils/normalize-script';

interface VideoContainerProps {
  script?: ScriptV1;
}

export const VideoContainer: React.FC<VideoContainerProps> = ({ script: initialScript }) => {
  const [script, setScript] = useState<ScriptV1 | undefined>(initialScript);

  useEffect(() => {
    if (!initialScript) {
      fetch(staticFile('/sample-video.json'))
        .then((res) => res.json())
        .then((data) => {
          const validatedScript = normalizeScript(data);
          setScript(validatedScript);
        })
        .catch((err) => {
          console.error('Failed to load video script:', err);
        });
    }
  }, [initialScript]);

  const frame = useCurrentFrame();

  if (!script) {
    return null; // Or a loading indicator
  }

  let fromFrame = 0;
  const music = script.audio.music;
  const voiceover = script.audio.voiceover;

    const dbToVolume = (db: number) => 10 ** (db / 20);

  const musicVolume = (() => {
    if (!music) return 0;

    const defaultGainDb = music.gainDb ?? 0;
    if (!music.duckingOnVoiceover || !voiceover?.captions || voiceover.captions.length === 0) {
      return dbToVolume(defaultGainDb);
    }

    const allPoints = voiceover.captions.flatMap((c) => [
      c.start * script.meta.fps,
      c.end * script.meta.fps,
    ]);
    const uniquePoints = [...new Set(allPoints)].sort((a, b) => a - b);

    const duckingGainDb = -20; // Sensible default for ducking

    const outputRangeDb = uniquePoints.map((p) => {
      const isDuringCaption = voiceover.captions.some(
        (c) => p >= c.start * script.meta.fps && p < c.end * script.meta.fps
      );
      return isDuringCaption ? duckingGainDb : defaultGainDb;
    });

    const currentGainDb = interpolate(frame, uniquePoints, outputRangeDb, {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    return dbToVolume(currentGainDb);
  })();

  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      {voiceover && <Audio src={staticFile(voiceover.url)} />}
      {music && <Audio src={staticFile(music.url)} volume={musicVolume} />}

      {script.scenes.map((scene: SceneType) => {
        // Inject lipSyncFile from audio.voiceover into character elements
        const enhancedScene = {
          ...scene,
          elements: scene.elements.map(element => {
            if (element.type === 'character' && voiceover?.lipSyncFile) {
              return {
                ...element,
                props: {
                  ...element.props,
                  lipSyncFile: element.props.lipSyncFile || voiceover.lipSyncFile
                }
              };
            }
            return element;
          })
        };
        
        const sequence = (
          <Sequence key={scene.id} from={fromFrame} durationInFrames={scene.durationInFrames}>
            <ScenePlayer scene={enhancedScene} />
          </Sequence>
        );
        fromFrame += scene.durationInFrames;
        return sequence;
      })}

      {voiceover?.captions && <Captions captions={voiceover.captions} fps={script.meta.fps} />}
    </AbsoluteFill>
  );
};
