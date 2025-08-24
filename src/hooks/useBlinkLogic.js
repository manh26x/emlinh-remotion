import { useCurrentFrame, interpolate } from 'remotion';
import { useMemo } from 'react';

export const useBlinkLogic = ({ blinkIntervalFrames = 120, blinkDurationFrames = 9 }) => {
  const frame = useCurrentFrame();

  const blinkInfluence = useMemo(() => {
    const blinkCycle = frame % blinkIntervalFrames;
    if (blinkCycle < blinkDurationFrames) {
      // Create a smooth open/close curve
      const progress = blinkCycle / blinkDurationFrames;
      if (progress < 0.5) {
        return interpolate(progress, [0, 0.5], [0, 1]);
      } else {
        return interpolate(progress, [0.5, 1], [1, 0]);
      }
    }
    return 0;
  }, [frame, blinkIntervalFrames, blinkDurationFrames]);

  return blinkInfluence;
};
