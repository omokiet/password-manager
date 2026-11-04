import { Shield } from 'lucide-react';

interface PrivacyOverlayProps {
  isVisible: boolean;
}

export default function PrivacyOverlay({ isVisible }: PrivacyOverlayProps) {
  if (!isVisible) return null;

  return (
    <div 
      data-testid="privacy-overlay"
      className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center select-none cursor-default"
      aria-hidden="true"
    >
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 animate-pulse">
        <Shield size={28} className="text-white" strokeWidth={1.5} />
      </div>
      <p className="text-zinc-400 text-sm font-medium tracking-wide">Vault Protected</p>
    </div>
  );
}
