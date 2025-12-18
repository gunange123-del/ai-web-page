
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
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    instances: {
      spheres: THREE.InstancedMesh;
      cubes: THREE.InstancedMesh;
      candies: THREE.InstancedMesh;
    };
    photoGroup: THREE.Group;
    particles: ParticleData[];
    photoPlanes: THREE.Mesh[];
  } | null>(null);

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const COLORS = {
    GOLD: 0xD4AF37,
    MATTE_GREEN: 0x1A3D1A,
    RED: 0xC41E3A,
  };

  const PARTICLE_COUNT = 1200;

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    scene.fog = new THREE.FogExp2(0x020202, 0.04);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // 2. Lighting (Enhanced for Gold shine)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const goldPoint = new THREE.PointLight(COLORS.GOLD, 200, 50);
    goldPoint.position.set(0, 2, 5);
    scene.add(goldPoint);

    // 3. Post-Processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.8, 0.5, 0.8
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 4. Background Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) {
        starPos[i] = (Math.random() - 0.5) * 100;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 5. Instanced Meshes
    const sphereGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const cubeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const candyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);

    const goldMat = new THREE.MeshStandardMaterial({ color: COLORS.GOLD, metalness: 1, roughness: 0.2 });
    const greenMat = new THREE.MeshStandardMaterial({ color: COLORS.MATTE_GREEN, roughness: 0.9, metalness: 0 });
    const redMat = new THREE.MeshStandardMaterial({ color: COLORS.RED, metalness: 0.8, roughness: 0.3 });

    const spheres = new THREE.InstancedMesh(sphereGeo, redMat, PARTICLE_COUNT / 3);
    const cubes = new THREE.InstancedMesh(cubeGeo, goldMat, PARTICLE_COUNT / 3);
    const candies = new THREE.InstancedMesh(candyGeo, greenMat, PARTICLE_COUNT / 3);

    scene.add(spheres, cubes, candies);

    // 6. Particle Data Generation
    const particles: ParticleData[] = [];
    const totalCount = PARTICLE_COUNT;
    for (let i = 0; i < totalCount; i++) {
      const height = Math.random() * 12 - 6;
      const progress = (height + 6) / 12; // 0 to 1
      const radiusAtHeight = (1 - progress) * 4.5;
      const angle = Math.random() * Math.PI * 2;
      const tx = Math.cos(angle) * radiusAtHeight * Math.random();
      const tz = Math.sin(angle) * radiusAtHeight * Math.random();
      
      const initial: [number, number, number] = [tx, height + 2, tz];
      const exploded: [number, number, number] = [
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 35
      ];

      particles.push({
        initialPosition: initial,
        explodedPosition: exploded,
        currentPosition: [...initial],
        type: i % 3 === 0 ? 'sphere' : i % 3 === 1 ? 'cube' : 'candy',
        color: ''
      });
    }

    const photoGroup = new THREE.Group();
    scene.add(photoGroup);

    sceneRef.current = {
      scene, camera, renderer, composer,
      instances: { spheres, cubes, candies },
      photoGroup,
      particles,
      photoPlanes: []
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const dummy = new THREE.Object3D();
    let frameId = 0;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!sceneRef.current) return;

      const { instances, particles, camera, photoPlanes, composer } = sceneRef.current;
      
      let sIdx = 0, cIdx = 0, kIdx = 0;
      particles.forEach((p) => {
        const targetArr = state === TreeState.CLOSED ? p.initialPosition : p.explodedPosition;
        
        p.currentPosition[0] += (targetArr[0] - p.currentPosition[0]) * 0.04;
        p.currentPosition[1] += (targetArr[1] - p.currentPosition[1]) * 0.04;
        p.currentPosition[2] += (targetArr[2] - p.currentPosition[2]) * 0.04;

        dummy.position.set(p.currentPosition[0], p.currentPosition[1], p.currentPosition[2]);
        dummy.rotation.x += 0.01;
        dummy.rotation.y += 0.01;
        dummy.updateMatrix();

        if (p.type === 'sphere' && sIdx < instances.spheres.count) instances.spheres.setMatrixAt(sIdx++, dummy.matrix);
        else if (p.type === 'cube' && cIdx < instances.cubes.count) instances.cubes.setMatrixAt(cIdx++, dummy.matrix);
        else if (kIdx < instances.candies.count) instances.candies.setMatrixAt(kIdx++, dummy.matrix);
      });

      instances.spheres.instanceMatrix.needsUpdate = true;
      instances.cubes.instanceMatrix.needsUpdate = true;
      instances.candies.instanceMatrix.needsUpdate = true;

      // Subtle rotation of background
      stars.rotation.y += 0.0005;

      // Camera Movement
      const targetCamX = (gesture.gesture !== 'NONE') ? (gesture.position.x - 0.5) * 15 : 0;
      const targetCamY = (gesture.gesture !== 'NONE') ? -(gesture.position.y - 0.5) * 10 : 0;
      
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 1, 0);

      // Photos
      photoPlanes.forEach((plane, i) => {
        const isZoomed = state === TreeState.ZOOMED && activePhotoIndex === i;
        if (isZoomed) {
           plane.position.lerp(new THREE.Vector3(0, 1, 12), 0.08);
           plane.rotation.set(0, 0, 0);
           plane.scale.lerp(new THREE.Vector3(6, 6, 1), 0.08);
        } else {
           const targetPos = (state === TreeState.CLOSED) ? 
             new THREE.Vector3(0, (i - photos.length/2) * 2.5 + 2, 1.2) : 
             new THREE.Vector3(
                Math.sin(i * 1.5 + Date.now()*0.0008) * 12, 
                Math.cos(i * 0.8 + Date.now()*0.0004) * 10, 
                Math.sin(i * 0.5 + Date.now()*0.0006) * 8
             );
           plane.position.lerp(targetPos, 0.04);
           plane.rotation.y += 0.005;
           plane.scale.lerp(new THREE.Vector3(2.2, 2.2, 1), 0.08);
        }
      });

      composer.render();
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [state, photos.length]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { photoGroup, photoPlanes } = sceneRef.current;

    photoPlanes.forEach(p => photoGroup.remove(p));
    photoPlanes.length = 0;

    const loader = new THREE.TextureLoader();
    photos.forEach((url, i) => {
      const texture = loader.load(url);
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        side: THREE.DoubleSide,
        transparent: true 
      });
      const mesh = new THREE.Mesh(geometry, material);
      photoGroup.add(mesh);
      photoPlanes.push(mesh);
    });
  }, [photos]);

  useEffect(() => {
    if (gesture.gesture === 'PINCH' && state === TreeState.EXPLODED && photos.length > 0) {
      if (activePhotoIndex === null) {
        setActivePhotoIndex(Math.floor(Math.random() * photos.length));
      }
    } else if (gesture.gesture !== 'PINCH' && state !== TreeState.ZOOMED) {
      setActivePhotoIndex(null);
    }
  }, [gesture.gesture, state, photos.length]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default TreeScene;
