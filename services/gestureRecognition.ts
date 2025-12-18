
import { HandGestureResult } from '../types';

export const analyzeHand = (landmarks: any[]): HandGestureResult => {
  if (!landmarks || landmarks.length === 0) {
    return { gesture: 'NONE', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } };
  }

  const hand = landmarks[0]; // Primary hand
  
  // Hand Center (approximate with wrist or palm center)
  const wrist = hand[0];
  const palmBase = hand[9]; // Middle finger MCP
  const palmCenter = {
    x: (wrist.x + palmBase.x) / 2,
    y: (wrist.y + palmBase.y) / 2,
    z: (wrist.z + palmBase.z) / 2
  };

  // Distance calculator
  const dist = (p1: any, p2: any) => Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
  );

  // Finger tips
  const thumbTip = hand[4];
  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  // Distances from palm base to tips
  const thumbDist = dist(thumbTip, palmBase);
  const indexDist = dist(indexTip, palmBase);
  const middleDist = dist(middleTip, palmBase);
  const ringDist = dist(ringTip, palmBase);
  const pinkyDist = dist(pinkyTip, palmBase);

  // Average distance
  const avgDist = (indexDist + middleDist + ringDist + pinkyDist) / 4;

  // Gesture logic
  let gesture: 'FIST' | 'OPEN' | 'PINCH' | 'NONE' = 'NONE';
  
  // Pinch detection
  const pinchDist = dist(thumbTip, indexTip);
  if (pinchDist < 0.05) {
    gesture = 'PINCH';
  } else if (avgDist < 0.12) {
    gesture = 'FIST';
  } else if (avgDist > 0.25) {
    gesture = 'OPEN';
  }

  // Rotation logic (simple roll/pitch based on hand tilt)
  const rotation = {
    x: (hand[9].y - hand[0].y) * 2, // Tilt
    y: (hand[17].x - hand[5].x) * 2, // Yaw
    z: 0
  };

  return {
    gesture,
    position: palmCenter,
    rotation
  };
};
