import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Lock, Unlock, ArrowRight } from 'lucide-react';

interface Props {
  onUnlocked: () => void;
}

export default function VaultScreen({ onUnlocked }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    try {
      const text = await file.text();
      await invoke('import_backup', { backupJson: text });
      setIsCreating(false);
      setPassword('');
      setConfirmPassword('');
      setError('Đã khôi phục thành công! Vui lòng đăng nhập bằng mật khẩu cũ của bản sao lưu.');
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    invoke<boolean>('check_vault_exists')
      .then((exists) => {
        setIsCreating(!exists);
        setIsChecking(false);
      })
      .catch(() => setIsChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isCreating) {
      if (password.length < 8) {
        setError('Mật khẩu tối thiểu 8 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isCreating) {
        await invoke('create_vault', { password });
      } else {
        await invoke('unlock_vault', { password });
      }
      onUnlocked();
    } catch (err: any) {
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full relative">
      <div className="w-full max-w-[420px] z-10 flex flex-col justify-center">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <div className="inline-flex items-center justify-center p-3 rounded-[1.25rem] bg-white/5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] mb-4">
            <Lock size={24} className="text-white" strokeWidth={1.25} />
          </div>
          <div className="inline-block rounded-full px-3 py-1 mb-4 text-[9px] uppercase tracking-[0.25em] font-medium bg-white/5 text-zinc-400 border border-white/10">
            {isCreating ? 'Khởi tạo' : 'Xác thực'}
          </div>
          <h1 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-3">
            {isCreating ? 'Tạo Vault' : 'Mở khóa Vault'}
          </h1>
          <p className="text-zinc-400 text-sm max-w-[280px] leading-relaxed">
            {isCreating 
              ? 'Thiết lập mật khẩu chủ. Dữ liệu được mã hóa Zero-Knowledge.' 
              : 'Hệ thống yêu cầu mật khẩu chủ để giải mã dữ liệu.'}
          </p>
        </div>

        {/* Form Container */}
        <div className="p-1.5 rounded-[2rem] bg-white/[0.02] border border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both ease-[cubic-bezier(0.32,0.72,0,1)] shadow-2xl">
          <form onSubmit={handleSubmit} className="bg-[#0a0a0a]/80 backdrop-blur-xl rounded-[calc(2rem-0.375rem)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5">
            <div className="space-y-4">
              
              <div className="space-y-1.5">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all duration-300"
                  placeholder="Mật khẩu chủ"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {isCreating && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-500">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all duration-300"
                    placeholder="Xác nhận mật khẩu"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {error && (
                <div className="text-red-400/90 text-[13px] font-medium px-2 text-center animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center bg-white hover:bg-zinc-100 text-black font-medium rounded-full px-6 py-4 mt-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="transform translate-x-0 group-hover:-translate-x-3 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  {isLoading ? 'Đang giải mã...' : isCreating ? 'Khởi tạo' : 'Mở khóa'}
                </span>
                
                {!isLoading && (
                  <div className="absolute right-2 w-10 h-10 rounded-full bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    {isCreating ? <ArrowRight size={16} strokeWidth={2} /> : <Unlock size={16} strokeWidth={2} />}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center animate-in fade-in duration-1000 delay-300 fill-mode-both">
          <button
            type="button"
            onClick={() => {
              setIsCreating(!isCreating);
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.15em] font-medium"
          >
            {isCreating ? 'Đã có Vault? Mở khóa ngay' : 'Chưa có Vault? Tạo mới'}
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[10px] text-zinc-700 uppercase tracking-[0.15em]">hoặc</span>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.15em] font-medium flex items-center justify-center gap-1.5 mx-auto"
            >
              Khôi phục từ bản sao lưu
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".vaultbak" 
              onChange={handleImportBackup} 
              className="hidden" 
            />
          </div>
        </div>

      </div>
    </div>
  );
}
