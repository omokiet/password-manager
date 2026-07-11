import { useState, useEffect } from 'react';
import { Copy, RefreshCw, X } from 'lucide-react';

interface Props {
  onSelect: (password: string) => void;
  onClose: () => void;
}

export default function PasswordGenerator({ onSelect, onClose }: Props) {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');

  const generate = () => {
    let charset = '';
    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    if (charset === '') {
      setPassword('');
      return;
    }

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    setPassword(result);
  };

  useEffect(() => {
    generate();
  }, [length, useUpper, useLower, useNumbers, useSymbols]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="w-full max-w-[400px] relative z-10 p-1.5 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[calc(2rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5">
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors active:scale-95 border border-white/5"
          >
            <X size={14} />
          </button>

          <div className="inline-block rounded-full px-3 py-1 mb-6 text-[9px] uppercase tracking-[0.25em] font-medium bg-white/5 text-zinc-400 border border-white/10">
            Tạo mật khẩu
          </div>
          
          <div className="relative mb-8 group">
            <input
              type="text"
              readOnly
              value={password}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-14 py-5 text-white font-mono text-center text-xl tracking-[0.1em] focus:outline-none"
            />
            <button 
              onClick={generate}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                <span>Độ dài</span>
                <span className="text-white font-mono">{length}</span>
              </div>
              <input 
                type="range" 
                min="8" 
                max="64" 
                value={length} 
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {[
                { label: 'Chữ hoa (A-Z)', state: useUpper, set: setUseUpper },
                { label: 'Chữ thường (a-z)', state: useLower, set: setUseLower },
                { label: 'Số (0-9)', state: useNumbers, set: setUseNumbers },
                { label: 'Ký tự đặc biệt (!@#$)', state: useSymbols, set: setUseSymbols },
              ].map((opt, i) => (
                <label key={i} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-zinc-400 group-hover:text-white transition-colors tracking-wide">{opt.label}</span>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${opt.state ? 'bg-white' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-zinc-900 transition-transform duration-300 ${opt.state ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <input 
                    type="checkbox" 
                    checked={opt.state} 
                    onChange={(e) => opt.set(e.target.checked)}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              onSelect(password);
              onClose();
            }}
            disabled={!password}
            className="w-full group relative flex items-center justify-center bg-white hover:bg-zinc-100 text-black active:scale-[0.98] font-medium rounded-full py-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:opacity-50"
          >
            <span className="transform translate-x-0 group-hover:-translate-x-3 transition-transform duration-500">
              Sử dụng
            </span>
            <div className="absolute right-2 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <Copy size={16} strokeWidth={2} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
