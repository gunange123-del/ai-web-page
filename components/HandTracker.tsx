
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
  const onGestureRef = useRef(onGesture);

  // 始终保持对最新回调的引用，防止闭包过期
  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  useEffect(() => {
    let hands: any;
    let camera: any;
    let isActive = true;

    const init = async () => {
      if (!window.Hands || !window.Camera) {
        if (isActive) setTimeout(init, 500);
        return;
      }

      try {
        hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6, // 提高灵敏度
          minTrackingConfidence: 0.6
        });

        hands.onResults((results: any) => {
          if (!isActive) return;

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const analysis = analyzeHand(results.multiHandLandmarks);
            onGestureRef.current(analysis);
          } else {
            onGestureRef.current({ 
              gesture: 'NONE', 
              position: { x: 0.5, y: 0.5, z: 0 }, 
              rotation: { x: 0, y: 0, z: 0 } 
            });
          }
          
          // 绘制调试点
          if (canvasRef.current && results.multiHandLandmarks) {
             const ctx = canvasRef.current.getContext('2d');
             if (ctx) {
               ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
               results.multiHandLandmarks.forEach((landmarks: any) => {
                 landmarks.forEach((p: any) => {
                   ctx.fillStyle = "#F59E0B";
                   ctx.beginPath();
                   ctx.arc(p.x * canvasRef.current!.width, p.y * canvasRef.current!.height, 3, 0, Math.PI * 2);
                   ctx.fill();
                 });
               });
             }
          }
        });

        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (hands && isActive) await hands.send({ image: videoRef.current! });
            },
            width: 640,
            height: 480
          });
          camera.start();
        }
      } catch (err) {
        console.error("MediaPipe Init Error:", err);
      }
    };

    init();

    return () => {
      isActive = false;
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  return (
    <div className="w-full h-full bg-black/60 relative">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover opacity-80" width={640} height={480} />
      <div className="absolute top-6 left-6 flex items-center gap-3">
         <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
         <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold">Neural Core Link active</span>
      </div>
    </div>
  );
};

export default HandTracker;
