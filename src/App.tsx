import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import VaultScreen from './components/VaultScreen';
import Dashboard from './components/Dashboard';
import PrivacyOverlay from './components/PrivacyOverlay';

const BACKGROUND_GRACE_PERIOD_MS = 60000;

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPrivacyCoverVisible, setIsPrivacyCoverVisible] = useState(false);
  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        setIsPrivacyCoverVisible(true);
        backgroundTimeRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const bgTime = backgroundTimeRef.current;
        backgroundTimeRef.current = null;
        
        if (isUnlocked && bgTime && Date.now() - bgTime >= BACKGROUND_GRACE_PERIOD_MS) {
          try {
            await invoke('lock_vault');
          } catch (e) {
            console.error('Failed to lock on background timeout:', e);
          }
          setIsUnlocked(false);
        }
        setIsPrivacyCoverVisible(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked]);

  return (
    <div className="w-screen h-[100dvh] bg-[#050505] relative flex items-center justify-center overflow-hidden font-sans">
      <PrivacyOverlay isVisible={isPrivacyCoverVisible} />

      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      
      <div className="absolute inset-0 bg-noise z-0" />

      <main className="relative z-10 w-full md:max-w-5xl h-[100dvh] md:h-[calc(100dvh-3rem)] md:rounded-[2rem] bg-black/40 backdrop-blur-3xl md:border md:border-white/5 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]">
        {isUnlocked ? (
          <Dashboard onLock={() => setIsUnlocked(false)} />
        ) : (
          <VaultScreen onUnlocked={() => setIsUnlocked(true)} />
        )}
      </main>
    </div>
  );
}
