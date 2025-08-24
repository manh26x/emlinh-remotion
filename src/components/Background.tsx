import { Img, AbsoluteFill } from 'remotion';
import React from 'react';

interface BackgroundProps {
  src: string;
  fit?: 'cover' | 'contain' | 'fill';
}

export const Background: React.FC<BackgroundProps> = ({ src, fit = 'cover' }) => {
  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: fit,
        }}
      />
    </AbsoluteFill>
  );
};
