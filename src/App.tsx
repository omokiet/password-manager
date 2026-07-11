import { useState } from 'react';
import VaultScreen from './components/VaultScreen';
import Dashboard from './components/Dashboard';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <div className="w-screen h-[100dvh] bg-[#050505] relative flex items-center justify-center overflow-hidden font-sans">
      {/* Ambient Mesh Gradients (Ethereal Glass Vibe) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      
      {/* Physical Film Grain Texture */}
      <div className="absolute inset-0 bg-noise z-0" />

      {/* Main Max-Width App Container */}
      <main className="relative z-10 w-full sm:max-w-5xl h-[100dvh] sm:h-[calc(100dvh-3rem)] sm:rounded-[2rem] bg-black/40 backdrop-blur-3xl sm:border sm:border-white/5 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]">
        {isUnlocked ? (
          <Dashboard onLock={() => setIsUnlocked(false)} />
        ) : (
          <VaultScreen onUnlocked={() => setIsUnlocked(true)} />
        )}
      </main>
    </div>
  );
}
