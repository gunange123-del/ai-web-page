
import React, { useState, useCallback, useEffect } from 'react';
import TreeScene from './components/TreeScene';
import HandTracker from './components/HandTracker';
import { TreeState, HandGestureResult } from './types';
import { Upload, Hand, Minimize2, Maximize2, Zap, Play, X, Image as ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<TreeState>(TreeState.CLOSED);
  const [gesture, setGesture] = useState<HandGestureResult>({
    gesture: 'NONE',
    position: { x: 0.5, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleGesture = useCallback((res: HandGestureResult) => {
    setGesture(res);
    if (!started) return;

    if (res.gesture === 'FIST') {
      setState(TreeState.CLOSED);
    } else if (res.gesture === 'PINCH' && state === TreeState.EXPLODED) {
      setState(TreeState.ZOOMED);
    } else if (res.gesture === 'OPEN') {
      setState(TreeState.EXPLODED);
    }
  }, [state, started]);

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).map(f => URL.createObjectURL(f as Blob));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#020202] text-white overflow-hidden">
      {/* Intro Landing Screen */}
      {!started && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl transition-all duration-1000">
          <div className="max-w-2xl text-center px-6 animate-in fade-in zoom-in duration-700">
            <h1 className="text-7xl font-serif tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-500 mb-4">
              Noël Éthéré
            </h1>
            <p className="text-amber-500/60 uppercase tracking-[0.4em] text-xs mb-12">A Cinematic Gesture-Controlled Holiday Experience</p>
            
            <div className="grid grid-cols-3 gap-8 mb-16 opacity-80">
                <GestureGuide icon={<Minimize2 size={24}/>} label="Fist" desc="Gather Tree" />
                <GestureGuide icon={<Maximize2 size={24}/>} label="Palm" desc="Explode Cloud" />
                <GestureGuide icon={<Hand size={24}/>} label="Pinch" desc="Zoom Memory" />
            </div>

            <button 
              onClick={() => setStarted(true)}
              className="group relative flex items-center gap-4 mx-auto btn-gold px-12 py-5 rounded-full"
            >
              <Play fill="black" size={20} />
              <span className="uppercase tracking-[0.2em] text-sm">Enter Experience</span>
            </button>
            <p className="mt-8 text-[10px] text-white/30 uppercase tracking-widest">Camera permissions required for interaction</p>
          </div>
        </div>
      )}

      {/* 3D Scene Layer */}
      <TreeScene state={state} gesture={gesture} photos={photos} />

      {/* MediaPipe Layer (only show preview when started) */}
      {started && <HandTracker onGesture={handleGesture} />}

      {/* UI Overlay - Web Page Interface */}
      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-10 transition-all duration-1000 ${started ? 'opacity-100' : 'opacity-0 scale-105'}`}>
        
        {/* Header Navigation */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="group cursor-default">
            <h2 className="text-3xl font-serif tracking-tighter text-amber-200 group-hover:text-amber-400 transition-colors">
              NOËL ÉTHÉRÉ
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-12 h-[1px] bg-amber-500/40" />
                <span className="text-[9px] text-amber-500/60 uppercase tracking-[0.3em]">Interactive Gallery</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
                onClick={() => setSidebarOpen(true)}
                className="glass hover:bg-white/10 p-4 rounded-full transition-all group relative"
            >
                <ImageIcon size={20} className="text-amber-400" />
                {photos.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 text-black text-[10px] font-bold flex items-center justify-center rounded-full border border-black">
                        {photos.length}
                    </span>
                )}
            </button>
            <label className="cursor-pointer glass hover:bg-white/10 flex items-center gap-3 px-6 py-4 rounded-full transition-all">
              <Upload size={18} className="text-amber-400" />
              <span className="text-xs uppercase tracking-[0.15em] font-semibold">Add Memory</span>
              <input type="file" multiple className="hidden" onChange={onFileUpload} accept="image/*" />
            </label>
          </div>
        </div>

        {/* Center Prompt */}
        {photos.length === 0 && started && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 glass rounded-full flex items-center justify-center animate-bounce">
                <Zap size={32} className="text-amber-400" />
            </div>
            <p className="text-sm font-light text-amber-100/50 uppercase tracking-[0.5em]">Upload memories to form the cloud</p>
          </div>
        )}

        {/* Dynamic State Feedback (Floating Web Cards) */}
        <div className="flex justify-between items-end pointer-events-auto">
          <div className="flex gap-4">
            <ControlCard 
                icon={<Minimize2 size={18}/>} 
                label="Gathered" 
                active={state === TreeState.CLOSED} 
                detected={gesture.gesture === 'FIST'}
            />
            <ControlCard 
                icon={<Maximize2 size={18}/>} 
                label="Exploded" 
                active={state === TreeState.EXPLODED} 
                detected={gesture.gesture === 'OPEN'}
            />
             <ControlCard 
                icon={<Hand size={18}/>} 
                label="Zooming" 
                active={state === TreeState.ZOOMED} 
                detected={gesture.gesture === 'PINCH'}
            />
          </div>

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.4em] text-amber-500/40 mb-2 font-bold">System Status</div>
            <div className="text-sm font-light text-white/80 glass px-6 py-2 rounded-full border border-white/5">
                {gesture.gesture === 'NONE' ? 'WAITING FOR HAND...' : 'INTERACTING'}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 glass z-[110] transition-transform duration-500 transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-serif text-amber-200">The Cloud</h3>
                <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {photos.length === 0 ? (
                    <p className="text-xs text-center text-white/20 uppercase tracking-widest mt-20">Your gallery is empty</p>
                ) : (
                    photos.map((url, i) => (
                        <div key={i} className="group relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all">
                            <img src={url} alt={`Memory ${i}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all" />
                        </div>
                    ))
                )}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[9px] text-white/30 uppercase tracking-widest leading-relaxed">
                    Interactive photo cloud generated from local uploads. Data remains in session.
                </p>
            </div>
        </div>
      </div>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
};

const GestureGuide: React.FC<{ icon: React.ReactNode, label: string, desc: string }> = ({ icon, label, desc }) => (
    <div className="flex flex-col items-center">
        <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-amber-400 mb-3">
            {icon}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">{label}</div>
        <div className="text-[8px] text-white/40 uppercase mt-1 tracking-tighter">{desc}</div>
    </div>
);

const ControlCard: React.FC<{ icon: React.ReactNode, label: string, active: boolean, detected: boolean }> = ({ icon, label, active, detected }) => (
  <div className={`px-6 py-4 rounded-2xl border transition-all duration-500 flex items-center gap-4 ${active ? 'glass border-amber-500/50 scale-105 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'bg-black/20 border-white/5 opacity-40 grayscale'}`}>
    <div className={`p-2 rounded-lg ${detected ? 'text-amber-400 scale-125' : 'text-white'} transition-all duration-300`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
      <div className={`h-1 rounded-full mt-2 transition-all duration-500 ${active ? 'w-full bg-amber-500' : 'w-0 bg-white/20'}`} />
    </div>
  </div>
);

export default App;
