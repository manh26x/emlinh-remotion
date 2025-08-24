import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, interpolate } from 'remotion';

interface StaticImageProps {
  src: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  style?: React.CSSProperties;
  isBackground?: boolean;
  position?: { x: string; y: string };
  animation?: {
    enter?: {
      name: string;
      durationInFrames: number;
      delay?: number;
      easing?: string;
    };
  };
}

export const StaticImage: React.FC<StaticImageProps> = ({ src, fit = 'cover', isBackground = false, style = {}, position, animation }) => {
  const frame = useCurrentFrame();
  const enter = animation?.enter;
  const delay = enter?.delay ?? 0;
  const duration = enter?.durationInFrames ?? 0;

  const eased = (t: number) => {
    const easingName = (enter?.easing || 'linear') as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
    const clamped = Math.max(0, Math.min(1, t));
    switch (easingName) {
      case 'ease-in':
        return clamped * clamped * clamped;
      case 'ease-out':
        return 1 - Math.pow(1 - clamped, 3);
      case 'ease-in-out': {
        return clamped < 0.5
          ? 4 * clamped * clamped * clamped
          : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
      }
      default:
        return clamped;
    }
  };

  const progress = duration > 0 ? eased((frame - delay) / duration) : 1;

  const imageStyle: React.CSSProperties = {
    objectFit: fit,
    width: '100%',
    height: '100%',
  };

  if (isBackground) {
    // Background animations (e.g., fadeIn, kenBurns)
    let bgOpacity = 1;
    let transform = '';
    if (enter?.name === 'fadeIn') {
      bgOpacity = interpolate(progress, [0, 1], [0, 1]);
    }
    if (enter?.name === 'kenBurns') {
      const scale = interpolate(progress, [0, 1], [1.05, 1.0]);
      const translateX = interpolate(progress, [0, 1], [10, 0]);
      const translateY = interpolate(progress, [0, 1], [10, 0]);
      transform = `scale(${scale}) translate(${-translateX}px, ${-translateY}px)`;
    }
    return (
      <AbsoluteFill style={{ opacity: bgOpacity }}>
        <Img src={src} style={{ ...imageStyle, transform }} />
      </AbsoluteFill>
    );
  }

  const containerStyle: React.CSSProperties = {
    ...style,
    position: 'absolute',
    left: position?.x,
    top: position?.y,
    transform: 'translate(-50%, -50%)', // Center the image on the position
    width: style.width || 'auto',
    height: style.height || 'auto',
  };

  // Element enter animations (non-background)
  let opacity = 1;
  let translate = { x: 0, y: 0 };
  let scale = 1;
  const name = enter?.name;
  if (name) {
    opacity = interpolate(progress, [0, 1], [0, 1]);
    if (name === 'slideInUp') translate.y = interpolate(progress, [0, 1], [30, 0]);
    if (name === 'slideInDown') translate.y = interpolate(progress, [0, 1], [-30, 0]);
    if (name === 'slideInLeft') translate.x = interpolate(progress, [0, 1], [30, 0]);
    if (name === 'slideInRight') translate.x = interpolate(progress, [0, 1], [-30, 0]);
    if (name === 'scaleIn') scale = interpolate(progress, [0, 1], [0.9, 1]);
  }

  return (
    <div style={{ ...containerStyle, opacity, transform: `${containerStyle.transform} translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}>
      <Img src={src} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
