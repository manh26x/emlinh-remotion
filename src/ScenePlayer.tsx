import React, { Suspense } from 'react';
import { AbsoluteFill, staticFile, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { PerspectiveCamera } from '@react-three/drei';
import { Avatar } from './Avatar';
import { Label } from './components/Label';
import { StaticImage } from './components/StaticImage';
import { Scene, VideoElement } from './schemas/scriptV1.schema';

interface ScenePlayerProps {
  scene: Scene;
}

export const ScenePlayer: React.FC<ScenePlayerProps> = ({ scene }) => {
  const { width, height } = useVideoConfig();
  
  // Tính toán aspect ratio và positioning responsive
  const aspectRatio = width / height;
  const isPortrait = aspectRatio < 1;
  
  // Điều chỉnh camera và avatar position dựa trên aspect ratio
  const cameraDistance = isPortrait ? 6 : 8;
  const avatarYPosition = isPortrait ? -1.8 : -2.5;
  const avatarScale = isPortrait ? 2.2 : 2.5;
  const cameraFov = isPortrait ? 35 : 30;

  return (
    <AbsoluteFill style={{ backgroundColor: 'lightblue' }}>
      {scene.elements.map((element: VideoElement, idx: number) => {
        // Bảo đảm key luôn duy nhất cho mỗi element trong scene
        const key = `${scene.id}-${idx}-${element.type}`;

        switch (element.type) {
          case 'background':
            return (
              <StaticImage
                key={key}
                src={element.props.src}
                fit={element.props.fit || 'cover'}
                isBackground
                animation={element.props.animation}
              />
            );
          case 'label':
            return <Label key={key} {...element.props} />;
          case 'image':
            return <StaticImage key={key} {...element.props} />;
          case 'character':
            return (
              <ThreeCanvas
                width={width}
                height={height}
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <Suspense fallback={null}>
                  <PerspectiveCamera 
                    makeDefault 
                    position={[0, 0, cameraDistance]} 
                    fov={cameraFov}
                  />
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[3, 2, 5]} intensity={1} />
                  <Avatar
                    key={key}
                    modelUrl={staticFile(element.props.model)}
                    mouthCuesUrl={element.props.lipSyncFile ? staticFile(element.props.lipSyncFile) : undefined}
                    position={[0, avatarYPosition, 0]} // Căn chỉnh responsive
                    scale={avatarScale} // Scale responsive
                  />
                </Suspense>
              </ThreeCanvas>
            );
          default:
            return null;
        }
      })}
    </AbsoluteFill>
  );
};

