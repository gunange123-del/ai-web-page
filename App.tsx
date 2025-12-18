
import React, { useState, useCallback } from 'react';
import TreeScene from './components/TreeScene';
import HandTracker from './components/HandTracker';
import { TreeState, HandGestureResult } from './types';
import { Upload, Hand, Minimize2, Maximize2, Sparkles, Camera, ChevronDown, Power, Gift, MousePointer2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<TreeState>(TreeState.CLOSED);
  const [gesture, setGesture] = useState<HandGestureResult>({
    gesture: 'NONE',
    position: { x: 0.5, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [isVisionActive, setIsVisionActive] = useState(false);

  const handleGesture = useCallback((res: HandGestureResult) => {
    setGesture(res);
    if (!isVisionActive) return;

    if (res.gesture === 'FIST') {
      setState(TreeState.CLOSED);
    } else if (res.gesture === 'OPEN') {
      setState(TreeState.EXPLODED);
    } else if (res.gesture === 'PINCH' && state === TreeState.EXPLODED) {
      setState(TreeState.ZOOMED);
    }
  }, [state, isVisionActive]);

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).map(f => URL.createObjectURL(f as Blob));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const toggleTree = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => prev === TreeState.CLOSED ? TreeState.EXPLODED : TreeState.CLOSED);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full min-h-screen bg-[#020202] text-white selection:bg-amber-500/30 overflow-x-hidden font-sans">
      
      {/* 3D Scene Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <TreeScene state={state} gesture={gesture} photos={photos} />
      </div>

      {/* Persistent Navigation - Ensure Clickability */}
      <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-6 md:px-12 md:py-10 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto cursor-pointer group" onClick={() => scrollToSection('hero')}>
          <div className="bg-amber-500 p-2.5 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform">
            <Gift className="text-black" size={24} />
          </div>
          <span className="text-2xl font-extralight tracking-[0.5em] uppercase hidden sm:block">NOËL</span>
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          <button 
            onClick={toggleTree}
            className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl ${
              state === TreeState.CLOSED 
              ? 'bg-amber-500 text-black shadow-amber-500/30' 
              : 'bg-white/10 text-white backdrop-blur-xl border border-white/20'
            }`}
          >
            <Power size={16} className={state === TreeState.CLOSED ? "animate-pulse" : ""} />
            <span>{state === TreeState.CLOSED ? 'Assemble Tree' : 'Explode Gifts'}</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 w-full">
        {/* Section 1: Hero */}
        <section id="hero" className="h-screen flex flex-col items-center justify-center text-center px-4">
          <div className="relative mb-6">
            <h1 className="text-8xl md:text-[14rem] font-thin tracking-tighter leading-none select-none">
              <span className="block text-white/5 opacity-40 blur-[1px]">DREAM</span>
              <span className="block -mt-12 md:-mt-24 text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-300 to-amber-600 drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">PINE</span>
            </h1>
          </div>
          <p className="max-w-md text-white/40 text-[10px] md:text-xs font-light leading-loose uppercase tracking-[0.6em] mb-16">
            A celestial ensemble of glittering gifts, <br/> guided by your ethereal touch.
          </p>
          <button 
            onClick={() => scrollToSection('magic')}
            className="flex flex-col items-center gap-5 text-white/20 hover:text-amber-400 transition-all group uppercase tracking-[0.6em] text-[9px]"
          >
            <span className="group-hover:tracking-[0.8em] transition-all duration-700">Explore Vision Mode</span>
            <ChevronDown className="animate-bounce" size={24} />
          </button>
        </section>

        {/* Section 2: Magic Mode */}
        <section id="magic" className="min-h-screen flex items-center justify-center py-32 px-6">
          <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 bg-amber-500/10 px-5 py-2 rounded-full border border-amber-500/20 text-amber-500">
                  <Sparkles size={16} />
                  <span className="text-[10px] uppercase tracking-[0.4em] font-black">Quantum Interface</span>
                </div>
                <h2 className="text-6xl md:text-7xl font-thin tracking-tighter leading-tight">Master the <br/><span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-500">Glimmer</span></h2>
              </div>
              
              <p className="text-white/40 leading-relaxed text-base max-w-sm">
                Enable our Vision Neural Link to control the gift cloud. Your hands become the gravity of this digital world.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                <FeatureCard active={gesture.gesture === 'FIST'} icon={<Minimize2 size={18}/>} label="Fist" desc="Gather Gifts" />
                <FeatureCard active={gesture.gesture === 'OPEN'} icon={<Maximize2 size={18}/>} label="Open Palm" desc="Release Magic" />
              </div>

              <button 
                onClick={() => setIsVisionActive(!isVisionActive)}
                className={`flex items-center justify-center gap-5 w-full md:w-auto px-14 py-7 rounded-3xl border-2 transition-all duration-1000 font-black tracking-[0.3em] text-[11px] uppercase ${
                  isVisionActive 
                  ? 'bg-white text-black border-white shadow-[0_0_60px_rgba(255,255,255,0.25)]' 
                  : 'bg-transparent border-white/10 text-white hover:border-amber-500/50 hover:bg-white/5'
                }`}
              >
                {isVisionActive ? <Power className="animate-pulse" /> : <Camera />}
                <span>{isVisionActive ? 'System Linked' : 'Initiate Vision Link'}</span>
              </button>
            </div>

            <div className="relative group">
               <div className="relative w-full aspect-square rounded-[4rem] overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-3xl shadow-inner transition-transform duration-700 group-hover:scale-[1.01]">
                  {isVisionActive ? (
                    <div className="w-full h-full scale-x-[-1]">
                      <HandTracker onGesture={handleGesture} />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-10 text-white/5 group transition-all duration-1000">
                      <div className="relative">
                        <Hand size={120} className="relative z-10 opacity-10 group-hover:opacity-30 transition-opacity" />
                        <div className="absolute inset-0 bg-amber-500 blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.6em] font-medium opacity-20">Scanning Sensors...</span>
                    </div>
                  )}
                  
                  {/* Dashboard Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black via-black/40 to-transparent">
                     <div className="flex justify-between items-end">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${isVisionActive ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">{isVisionActive ? 'Stream Live' : 'Offline'}</span>
                          </div>
                          <span className="block text-3xl font-extralight text-white tracking-[0.2em] uppercase">
                            {gesture.gesture !== 'NONE' ? gesture.gesture : 'Awaiting...'}
                          </span>
                        </div>
                        <div className="w-16 h-16 rounded-3xl border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md">
                           <Sparkles size={24} className={gesture.gesture !== 'NONE' ? 'text-amber-500 animate-spin-slow' : 'text-white/10'} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Section 3: Gallery */}
        <section id="gallery" className="min-h-screen py-32 px-6 flex flex-col items-center">
           <div className="text-center mb-32 space-y-6">
              <h2 className="text-7xl font-thin tracking-tighter">Memory <span className="text-amber-500 font-normal">Nucleus</span></h2>
              <p className="text-[11px] uppercase tracking-[0.8em] text-white/10 font-black">Your moments in high-fidelity</p>
           </div>

           <div className="w-full max-w-6xl">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                 {photos.map((url, i) => (
                    <div key={i} className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-white/5 border border-white/5 hover:border-amber-500/40 transition-all duration-700">
                       <img src={url} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110" alt={`Memory ${i}`} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                          <span className="text-[9px] uppercase tracking-[0.4em] font-black text-amber-500">Fragment {i+1}</span>
                       </div>
                    </div>
                 ))}
                 
                 <label className="aspect-[3/4] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-5 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all group">
                    <div className="bg-white/5 p-6 rounded-full group-hover:bg-amber-500 group-hover:text-black transition-all duration-500 group-hover:rotate-12">
                      <Upload size={32} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-black">Upload Fragment</span>
                    <input type="file" multiple className="hidden" onChange={onFileUpload} accept="image/*" />
                 </label>
              </div>
           </div>
        </section>

        <footer className="py-24 border-t border-white/5 flex flex-col items-center gap-8">
          <div className="flex gap-10 text-white/10">
            <MousePointer2 size={20} />
            <Power size={20} />
            <Gift size={20} />
          </div>
          <p className="text-[10px] uppercase tracking-[1em] text-white/5 font-black">Engineered for Wonder • 2024</p>
        </footer>
      </main>

      {/* Aesthetic Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[80] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  );
};

const FeatureCard: React.FC<{ active: boolean, icon: React.ReactNode, label: string, desc: string }> = ({ active, icon, label, desc }) => (
  <div className={`flex items-center gap-8 p-8 rounded-[2rem] border transition-all duration-1000 ${active ? 'bg-amber-500/10 border-amber-500/40 translate-x-4 shadow-[0_20px_40px_rgba(0,0,0,0.3)]' : 'bg-white/5 border-white/5'}`}>
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 ${active ? 'bg-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.5)] scale-110' : 'bg-white/5 text-white/20'}`}>
      {icon}
    </div>
    <div className="flex flex-col gap-1">
      <div className={`text-[13px] font-black uppercase tracking-[0.3em] ${active ? 'text-white' : 'text-white/40'}`}>{label}</div>
      <div className="text-[11px] text-white/20 uppercase tracking-tighter leading-tight font-medium">{desc}</div>
    </div>
  </div>
);

export default App;
