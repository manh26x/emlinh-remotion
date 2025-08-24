import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { useMemo } from 'react';
import { useLipSync } from './lipSync/useLipSync'; // Assuming this is the core lip-sync hook

const LIP_SYNC_LOG_PREFIX = "[useRemotionLipSync]";

export const useRemotionLipSync = (mouthCuesUrl, headMorphDict, teethMorphDict, options = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { audioOffset = 0, intensityFactor = 1.0, visemeOpeningDuration = 0.1, neutralIntensity = 0.1, springConfig = { stiffness: 80, damping: 25 } } = options;

  const mouthCues = useLipSync(mouthCuesUrl);

  const { headInfluences, teethInfluences } = useMemo(() => {
    if (!mouthCues || !headMorphDict) {
      return { headInfluences: null, teethInfluences: null };
    }

    const currentAudioTime = (frame / fps) - audioOffset;

    let currentCue = null;
    for (let i = mouthCues.length - 1; i >= 0; i--) {
      if (currentAudioTime >= mouthCues[i].start) {
        currentCue = mouthCues[i];
        break;
      }
    }

    const headInfluences = new Array(Object.keys(headMorphDict).length).fill(0);
    const teethInfluences = teethMorphDict ? new Array(Object.keys(teethMorphDict).length).fill(0) : [];

    if (currentCue) {
      const viseme = currentCue.value;
      const timeSinceCueStart = currentAudioTime - currentCue.start;

      const progress = interpolate(timeSinceCueStart, [0, visemeOpeningDuration], [0, 1], { extrapolateRight: 'clamp' });
      const visemeSpring = spring({ frame: progress * 100, fps: 100, config: springConfig });

      const influence = visemeSpring * intensityFactor;

      // Map visemes to morph targets
      const mapping = {
        'A': 'viseme_aa',
        'B': 'viseme_PP',
        'C': 'viseme_kk',
        'D': 'viseme_DD',
        'E': 'viseme_E',
        'F': 'viseme_ff',
        'G': 'viseme_kk',
        'H': 'viseme_O',
        'X': 'viseme_sil',
      };

      const targetName = mapping[viseme] || 'viseme_sil';

      if (headMorphDict[targetName] !== undefined) {
        headInfluences[headMorphDict[targetName]] = influence;
      }

      // Add a bit of neutral mouth opening
      if (headMorphDict['mouthOpen'] !== undefined) {
        headInfluences[headMorphDict['mouthOpen']] = Math.max(headInfluences[headMorphDict['mouthOpen']] || 0, neutralIntensity);
      }
    }

    return { headInfluences, teethInfluences };

  }, [frame, fps, mouthCues, headMorphDict, teethMorphDict, audioOffset, intensityFactor, visemeOpeningDuration, neutralIntensity, springConfig]);

  return { head: headInfluences, teeth: teethInfluences };
};
