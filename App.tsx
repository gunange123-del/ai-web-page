
import React, { useState, useCallback, useEffect } from 'react';
import TreeScene from './components/TreeScene';
import HandTracker from './components/HandTracker';
import { TreeState, HandGestureResult } from './types';
import { Upload, Hand, Minimize2, Maximize2, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<TreeState>(TreeState.CLOSED);
  const [gesture, setGesture] = useState<HandGestureResult>({
    gesture: 'NONE',
    position: { x: 0.5, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  });
  const [photos, setPhotos] = useState<string[]>([]);

  const handleGesture = useCallback((res: HandGestureResult) => {
    setGesture(res);
    
    // Auto state transition based on gesture
    // FIX: Simplified the logic to avoid unreachable code where 'OPEN' was checked after already being handled.
    if (res.gesture === 'FIST') {
      setState(TreeState.CLOSED);
    } else if (res.gesture === 'PINCH' && state === TreeState.EXPLODED) {
      setState(TreeState.ZOOMED);
    } else if (res.gesture === 'OPEN') {
      setState(TreeState.EXPLODED);
    }
  }, [state]);

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // FIX: Added explicit type cast to 'Blob' to resolve the 'unknown' type error for URL.createObjectURL.
      const newPhotos = Array.from(files).map(f => URL.createObjectURL(f as Blob));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#050505] text-white overflow-hidden">
      {/* Three.js Layer */}
      <TreeScene state={state} gesture={gesture} photos={photos} />

      {/* MediaPipe Layer */}
      <HandTracker onGesture={handleGesture} />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8">
        
        {/* Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-4xl font-light tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
              NOËL ÉTHÉRÉ
            </h1>
            <p className="text-xs text-amber-500/60 uppercase tracking-widest mt-1">Cinematic Hand Gesture Experience</p>
          </div>
          
          <div className="flex gap-4">
            <label className="cursor-pointer group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all">
              <Upload size={16} className="text-amber-400" />
              <span className="text-xs uppercase tracking-wider font-semibold">Upload Memories</span>
              <input type="file" multiple className="hidden" onChange={onFileUpload} accept="image/*" />
            </label>
          </div>
        </div>

        {/* Center Hint (only if no photos or initial) */}
        {photos.length === 0 && (
          <div className="flex flex-col items-center justify-center opacity-40">
            <Zap size={48} className="mb-4 text-amber-500 animate-pulse" />
            <p className="text-sm tracking-widest uppercase">Upload photos to begin the cloud</p>
          </div>
        )}

        {/* Footer / Status */}
        <div className="flex justify-between items-end pointer-events-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                <div className={`w-2 h-2 rounded-full ${gesture.gesture === 'NONE' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Hand Link</span>
              </div>
              <div className="flex gap-6">
                <StatusItem icon={<Minimize2 size={14}/>} label="Fist" sub="Close Tree" active={gesture.gesture === 'FIST'} />
                <StatusItem icon={<Maximize2 size={14}/>} label="Open" sub="Explode" active={gesture.gesture === 'OPEN'} />
                <StatusItem icon={<Hand size={14}/>} label="Pinch" sub="Zoom Photo" active={gesture.gesture === 'PINCH'} />
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.3em] text-amber-500/40 mb-1">State Configuration</div>
            <div className="text-2xl font-light text-amber-100/80">{state}</div>
          </div>
        </div>
      </div>

      {/* Vignette & Grain */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
};

const StatusItem: React.FC<{ icon: React.ReactNode, label: string, sub: string, active: boolean }> = ({ icon, label, sub, active }) => (
  <div className={`flex items-center gap-3 transition-all duration-300 ${active ? 'scale-110' : 'opacity-40 grayscale'}`}>
    <div className={`p-2 rounded-lg ${active ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/5 text-white'}`}>
      {icon}
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <span className="text-[8px] uppercase text-white/40 mt-1">{sub}</span>
    </div>
  </div>
);

export default App;
