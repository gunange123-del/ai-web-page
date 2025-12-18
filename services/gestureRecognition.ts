
import { HandGestureResult } from '../types';

export const analyzeHand = (landmarks: any[]): HandGestureResult => {
  if (!landmarks || landmarks.length === 0) {
    return { gesture: 'NONE', position: { x: 0.5, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 } };
  }

  const hand = landmarks[0]; 
  const wrist = hand[0];
  const palmBase = hand[9]; 
  
  const palmCenter = {
    x: (wrist.x + palmBase.x) / 2,
    y: (wrist.y + palmBase.y) / 2,
    z: (wrist.z + palmBase.z) / 2
  };

  const dist = (p1: any, p2: any) => Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
  );

  const thumbTip = hand[4];
  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  const indexDist = dist(indexTip, palmBase);
  const middleDist = dist(middleTip, palmBase);
  const ringDist = dist(ringTip, palmBase);
  const pinkyDist = dist(pinkyTip, palmBase);

  const avgDist = (indexDist + middleDist + ringDist + pinkyDist) / 4;

  let gesture: 'FIST' | 'OPEN' | 'PINCH' | 'NONE' = 'NONE';
  
  // 优化阈值
  const pinchDist = dist(thumbTip, indexTip);
  if (pinchDist < 0.04) { // 更敏感的捏合
    gesture = 'PINCH';
  } else if (avgDist < 0.1) { // 更明确的握拳
    gesture = 'FIST';
  } else if (avgDist > 0.18) { // 稍微降低开掌阈值，增加容错
    gesture = 'OPEN';
  }

  const rotation = {
    x: (hand[9].y - hand[0].y) * 2,
    y: (hand[17].x - hand[5].x) * 2,
    z: 0
  };

  return { gesture, position: palmCenter, rotation };
};
