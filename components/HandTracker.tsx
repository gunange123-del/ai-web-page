
import React, { useEffect, useRef } from 'react';
import { analyzeHand } from '../services/gestureRecognition';
import { HandGestureResult } from '../types';

interface HandTrackerProps {
  onGesture: (result: HandGestureResult) => void;
}

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGesture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let hands: any;
    let camera: any;

    const init = async () => {
      if (!window.Hands || !window.Camera) {
        console.warn("MediaPipe not ready yet, retrying...");
        setTimeout(init, 500);
        return;
      }

      try {
        hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const analysis = analyzeHand(results.multiHandLandmarks);
            onGesture(analysis);
          } else {
            onGesture({ gesture: 'NONE', position: { x: 0.5, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 } });
          }
          
          if (canvasRef.current && results.multiHandLandmarks) {
             const ctx = canvasRef.current.getContext('2d');
             if (ctx) {
               ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
               results.multiHandLandmarks.forEach((landmarks: any) => {
                 landmarks.forEach((p: any) => {
                   ctx.fillStyle = "#FFD700"; // Gold dots for better feel
                   ctx.beginPath();
                   ctx.arc(p.x * canvasRef.current!.width, p.y * canvasRef.current!.height, 2, 0, Math.PI * 2);
                   ctx.fill();
                 });
               });
             }
          }
        });

        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (hands) await hands.send({ image: videoRef.current! });
            },
            width: 320,
            height: 240
          });
          camera.start();
        }
      } catch (err) {
        console.error("Failed to initialize MediaPipe Hands:", err);
      }
    };

    init();

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-48 h-36 bg-black/60 rounded-xl overflow-hidden border border-amber-500/20 shadow-2xl z-50">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full opacity-60" width={320} height={240} />
      <div className="absolute top-2 left-2 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[8px] text-amber-500/80 uppercase tracking-widest font-bold">Vision Active</span>
        </div>
      </div>
    </div>
  );
};

export default HandTracker;
