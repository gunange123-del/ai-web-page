
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { TreeState, ParticleData, HandGestureResult } from '../types';

interface TreeSceneProps {
  state: TreeState;
  gesture: HandGestureResult;
  photos: string[];
}

const TreeScene: React.FC<TreeSceneProps> = ({ state, gesture, photos }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef(gesture);
  const stateRef = useRef(state);
  
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    giftInstances: THREE.InstancedMesh[];
    glitterPoints: THREE.Points;
    particles: ParticleData[];
    photoPlanes: THREE.Mesh[];
    photoGroup: THREE.Group;
  } | null>(null);

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // 同步外部状态到 Ref，避免动画循环闭包失效
  useEffect(() => { gestureRef.current = gesture; }, [gesture]);
  useEffect(() => { stateRef.current = state; }, [state]);

  const PARTICLE_COUNT = 1050; // 必须是 COLORS 长度的倍数
  const COLORS = [
    0xFFD700, // Gold
    0xC41E3A, // Festive Red
    0x228B22, // Forest Green
    0x00BFFF, // Ice Blue
    0xFF69B4, // Pink Ribbon
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020202, 0.025);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    containerRef.current.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2.8, 0.7, 0.15
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const p1 = new THREE.PointLight(0xffffff, 250); p1.position.set(15, 20, 15); scene.add(p1);
    const p2 = new THREE.PointLight(0xffd700, 150); p2.position.set(-15, -15, 10); scene.add(p2);

    // 粒子生成
    const particles: ParticleData[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const height = Math.random() * 18 - 9;
      const radiusAtHeight = Math.max(0.1, (9 - height) * 0.45);
      const angle = Math.random() * Math.PI * 2;
      const tx = Math.cos(angle) * radiusAtHeight * (0.3 + Math.random() * 0.7);
      const tz = Math.sin(angle) * radiusAtHeight * (0.3 + Math.random() * 0.7);
      
      particles.push({
        initialPosition: [tx, height, tz],
        explodedPosition: [(Math.random() - 0.5) * 65, (Math.random() - 0.5) * 55, (Math.random() - 0.5) * 45],
        currentPosition: [tx, height, tz],
        type: 'cube',
        color: COLORS[i % COLORS.length].toString()
      });
    }

    // 礼物箱模型
    const boxGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    const giftInstances = COLORS.map(color => {
      const mat = new THREE.MeshStandardMaterial({ 
        color, metalness: 0.9, roughness: 0.1,
        emissive: color, emissiveIntensity: 0.5 
      });
      const mesh = new THREE.InstancedMesh(boxGeo, mat, PARTICLE_COUNT / COLORS.length);
      scene.add(mesh);
      return mesh;
    });

    // 闪烁星星
    const glitterGeo = new THREE.BufferGeometry();
    const glitterPos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000 * 3; i++) glitterPos[i] = (Math.random() - 0.5) * 120;
    glitterGeo.setAttribute('position', new THREE.BufferAttribute(glitterPos, 3));
    const glitterPoints = new THREE.Points(glitterGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.08, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
    }));
    scene.add(glitterPoints);

    const photoGroup = new THREE.Group();
    scene.add(photoGroup);

    sceneRef.current = {
      scene, camera, renderer, composer, giftInstances, glitterPoints, particles, photoGroup, photoPlanes: []
    };

    const dummy = new THREE.Object3D();
    let frameId = 0;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!sceneRef.current) return;
      const { giftInstances, particles, camera, composer, glitterPoints, photoPlanes } = sceneRef.current;
      const time = Date.now() * 0.001;

      // 粒子物理
      const colorIndices = new Array(COLORS.length).fill(0);
      particles.forEach((p, i) => {
        const target = stateRef.current === TreeState.CLOSED ? p.initialPosition : p.explodedPosition;
        const lerpSpeed = stateRef.current === TreeState.CLOSED ? 0.06 : 0.03;

        p.currentPosition[0] += (target[0] - p.currentPosition[0]) * lerpSpeed;
        p.currentPosition[1] += (target[1] - p.currentPosition[1]) * lerpSpeed;
        p.currentPosition[2] += (target[2] - p.currentPosition[2]) * lerpSpeed;

        const cIdx = i % COLORS.length;
        const instIdx = colorIndices[cIdx]++;
        
        dummy.position.set(p.currentPosition[0], p.currentPosition[1], p.currentPosition[2]);
        dummy.rotation.set(time * 0.8 + i, time * 0.5 + i, 0);
        
        // 梦幻缩放动画
        const pulse = 1.0 + Math.sin(time * 3 + i) * 0.15;
        dummy.scale.set(pulse, pulse, pulse);
        
        dummy.updateMatrix();
        giftInstances[cIdx].setMatrixAt(instIdx, dummy.matrix);
      });
      giftInstances.forEach(inst => inst.instanceMatrix.needsUpdate = true);

      // 背景星空
      glitterPoints.rotation.y += 0.0008;
      glitterPoints.position.y = Math.sin(time * 0.4) * 3;

      // 相机逻辑 - 响应手势
      const currentG = gestureRef.current;
      let tx = Math.sin(time * 0.3) * 6;
      let ty = Math.cos(time * 0.2) * 4;
      if (currentG.gesture !== 'NONE') {
        tx = (currentG.position.x - 0.5) * 45;
        ty = -(currentG.position.y - 0.5) * 35;
      }
      camera.position.x += (tx - camera.position.x) * 0.08;
      camera.position.y += (ty - camera.position.y) * 0.08;
      camera.lookAt(0, 0, 0);

      // 相册交互
      photoPlanes.forEach((plane, i) => {
        const isZoomed = stateRef.current === TreeState.ZOOMED && activePhotoIndex === i;
        if (isZoomed) {
          plane.position.lerp(new THREE.Vector3(0, 0, 16), 0.12);
          plane.scale.lerp(new THREE.Vector3(14, 14, 1), 0.12);
          plane.rotation.set(0, 0, 0);
        } else {
          const orbit = stateRef.current === TreeState.CLOSED ? 0.6 : 1.4;
          const dist = stateRef.current === TreeState.CLOSED ? 8 : 22;
          const pos = new THREE.Vector3(
            Math.sin(i + time * orbit) * dist,
            Math.cos(i * 0.7 + time * orbit * 0.5) * (dist * 0.8),
            Math.sin(i * 0.4 + time * orbit * 0.7) * (dist * 0.5)
          );
          plane.position.lerp(pos, 0.06);
          plane.rotation.y += 0.015;
          plane.scale.lerp(new THREE.Vector3(3.8, 3.8, 1), 0.1);
        }
      });

      composer.render();
    };

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []); // 仅挂载一次，依靠 Ref 同步状态

  // 照片纹理更新
  useEffect(() => {
    if (!sceneRef.current) return;
    const { photoGroup, photoPlanes } = sceneRef.current;
    photoPlanes.forEach(p => photoGroup.remove(p));
    photoPlanes.length = 0;

    const loader = new THREE.TextureLoader();
    photos.forEach((url) => {
      const texture = loader.load(url);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
      );
      photoGroup.add(mesh);
      photoPlanes.push(mesh);
    });
  }, [photos]);

  // 捏合缩放逻辑
  useEffect(() => {
    if (gesture.gesture === 'PINCH' && state === TreeState.EXPLODED && photos.length > 0) {
      if (activePhotoIndex === null) {
        setActivePhotoIndex(Math.floor(Math.random() * photos.length));
      }
    } else if (gesture.gesture !== 'PINCH' && state !== TreeState.ZOOMED) {
      setActivePhotoIndex(null);
    }
  }, [gesture.gesture, state, photos.length]);

  return <div ref={containerRef} className="w-full h-full cursor-none" />;
};

export default TreeScene;
