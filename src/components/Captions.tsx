import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { Caption } from '../schemas/scriptV1.schema';

interface CaptionsProps {
  captions: Caption[];
  fps: number;
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10%',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const textStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '10px',
  fontSize: '50px',
  textAlign: 'center',
};

export const Captions: React.FC<CaptionsProps> = ({ captions, fps }) => {
  const frame = useCurrentFrame();
  const time = frame / fps;

  const currentCaption = captions.find((c) => time >= c.start && time <= c.end);

  if (!currentCaption) {
    return null;
  }

  const words = currentCaption.text.split(' ');
  const durationOfCaption = currentCaption.end - currentCaption.start;
  const durationPerWord = durationOfCaption / words.length;

  return (
    <div style={containerStyle}>
      <p style={textStyle}>
        {words.map((word: string, i: number) => {
          const wordStartTime = currentCaption.start + i * durationPerWord;
          const progress = interpolate(
            time,
            [wordStartTime, wordStartTime + durationPerWord],
            [0, 1],
            { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
          );

          return (
            <span key={i} style={{ 
              backgroundImage: `linear-gradient(to right, yellow ${progress * 100}%, white ${progress * 100}%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
             }}>
              {word}{' '}
            </span>
          );
        })}
      </p>
    </div>
  );
};
