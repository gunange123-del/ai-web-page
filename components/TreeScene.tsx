
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

  const PARTICLE_COUNT = 800;

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(COLORS.GOLD, 100);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(COLORS.RED, 80);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // 3. Post-Processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 4. Instanced Meshes
    const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const cubeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const candyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);

    const goldMat = new THREE.MeshStandardMaterial({ color: COLORS.GOLD, metalness: 0.9, roughness: 0.1 });
    const greenMat = new THREE.MeshStandardMaterial({ color: COLORS.MATTE_GREEN, roughness: 0.8 });
    const redMat = new THREE.MeshStandardMaterial({ color: COLORS.RED, metalness: 0.5, roughness: 0.2 });

    const spheres = new THREE.InstancedMesh(sphereGeo, redMat, PARTICLE_COUNT);
    const cubes = new THREE.InstancedMesh(cubeGeo, goldMat, PARTICLE_COUNT);
    const candies = new THREE.InstancedMesh(candyGeo, greenMat, PARTICLE_COUNT);

    scene.add(spheres, cubes, candies);

    // 5. Generate Particle Data
    const particles: ParticleData[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const height = Math.random() * 10 - 5;
      const radiusAtHeight = (5 - height) * 0.4;
      const angle = Math.random() * Math.PI * 2;
      const tx = Math.cos(angle) * radiusAtHeight * Math.random();
      const tz = Math.sin(angle) * radiusAtHeight * Math.random();
      
      const initial: [number, number, number] = [tx, height, tz];
      const exploded: [number, number, number] = [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      ];

      particles.push({
        initialPosition: initial,
        explodedPosition: exploded,
        currentPosition: [...initial],
        type: i % 3 === 0 ? 'sphere' : i % 3 === 1 ? 'cube' : 'candy',
        color: 'none'
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
      
      // Update Particles
      let sIdx = 0, cIdx = 0, kIdx = 0;
      particles.forEach((p) => {
        const targetArr = state === TreeState.CLOSED ? p.initialPosition : p.explodedPosition;
        
        // Easing current position per particle
        p.currentPosition[0] += (targetArr[0] - p.currentPosition[0]) * 0.05;
        p.currentPosition[1] += (targetArr[1] - p.currentPosition[1]) * 0.05;
        p.currentPosition[2] += (targetArr[2] - p.currentPosition[2]) * 0.05;

        dummy.position.set(p.currentPosition[0], p.currentPosition[1], p.currentPosition[2]);
        dummy.rotation.x += 0.01;
        dummy.rotation.y += 0.01;
        dummy.updateMatrix();

        if (p.type === 'sphere') instances.spheres.setMatrixAt(sIdx++, dummy.matrix);
        else if (p.type === 'cube') instances.cubes.setMatrixAt(cIdx++, dummy.matrix);
        else instances.candies.setMatrixAt(kIdx++, dummy.matrix);
      });

      instances.spheres.instanceMatrix.needsUpdate = true;
      instances.cubes.instanceMatrix.needsUpdate = true;
      instances.candies.instanceMatrix.needsUpdate = true;

      // Camera Movement
      const targetCamX = (gesture.gesture !== 'NONE') ? (gesture.position.x - 0.5) * 20 : 0;
      const targetCamY = (gesture.gesture !== 'NONE') ? -(gesture.position.y - 0.5) * 15 : 0;
      
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Photos
      photoPlanes.forEach((plane, i) => {
        const isZoomed = state === TreeState.ZOOMED && activePhotoIndex === i;
        if (isZoomed) {
           plane.position.lerp(new THREE.Vector3(0, 0, 10), 0.1);
           plane.rotation.set(0, 0, 0);
           plane.scale.lerp(new THREE.Vector3(5, 5, 1), 0.1);
        } else {
           const targetPos = (state === TreeState.CLOSED) ? 
             new THREE.Vector3(0, (i - photos.length/2) * 2.0, 0.5) : 
             new THREE.Vector3(
                Math.sin(i * 1.5 + Date.now()*0.001) * 8, 
                Math.cos(i * 0.8 + Date.now()*0.0005) * 8, 
                Math.sin(i * 0.5 + Date.now()*0.0008) * 5
             );
           plane.position.lerp(targetPos, 0.05);
           plane.rotation.y += 0.01;
           plane.scale.lerp(new THREE.Vector3(1.5, 1.5, 1), 0.1);
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
