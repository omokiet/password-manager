import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  ShieldAlert,
  KeyRound,
  Download,
  DatabaseBackup,
  Trash2,
  ArrowLeft,
  Home,
  X,
  Cloud,
  CloudUpload,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import GoogleDriveGuideModal from './GoogleDriveGuideModal';
import { CloudBackupItem, GDriveStatusResponse } from '../shared/types';

interface Props {
  onBack: () => void;
  onHome: () => void;
  showToast: (msg: string) => void;
}

export default function SettingsPanel({ onBack, onHome, showToast }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  // Google Drive Cloud Backup state
  const [gdriveStatus, setGdriveStatus] = useState<GDriveStatusResponse | null>(null);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupItem[]>([]);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isConnectingGDrive, setIsConnectingGDrive] = useState(false);
  const [isBackingUpGDrive, setIsBackingUpGDrive] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<CloudBackupItem | null>(null);
  const [isRestoringGDrive, setIsRestoringGDrive] = useState(false);

  const fetchGDriveStatus = async () => {
    try {
      const res = await invoke<GDriveStatusResponse>('gdrive_get_status');
      setGdriveStatus(res);
      if (res?.is_connected) {
        await fetchCloudBackups();
      }
    } catch (err) {
      console.error('Failed to get GDrive status', err);
    }
  };

  const fetchCloudBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const list = await invoke<CloudBackupItem[]>('gdrive_list_backups');
      setCloudBackups(list || []);
    } catch (err: any) {
      console.error('Failed to list cloud backups', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchGDriveStatus();
  }, []);

  const handleConfirmGuide = async () => {
    setIsConnectingGDrive(true);
    try {
      await invoke('gdrive_start_auth');
      showToast('Kết nối Google Drive thành công!');
      setShowGuideModal(false);
      await fetchGDriveStatus();
    } catch (err: any) {
      showToast(`Lỗi kết nối Google Drive: ${err?.toString() || err}`);
    } finally {
      setIsConnectingGDrive(false);
    }
  };

  const handleDisconnectGDrive = async () => {
    try {
      await invoke('gdrive_disconnect');
      setGdriveStatus({ is_connected: false });
      setCloudBackups([]);
      showToast('Đã ngắt kết nối Google Drive');
    } catch (err: any) {
      showToast(`Lỗi ngắt kết nối: ${err?.toString() || err}`);
    }
  };

  const handleUploadCloudBackup = async () => {
    setIsBackingUpGDrive(true);
    try {
      await invoke('gdrive_upload_backup');
      showToast('Đã sao lưu lên Google Drive thành công!');
      await fetchCloudBackups();
    } catch (err: any) {
      showToast(`Lỗi sao lưu lên Drive: ${err?.toString() || err}`);
    } finally {
      setIsBackingUpGDrive(false);
    }
  };

  const confirmRestoreCloudBackup = async () => {
    if (!selectedBackupForRestore) return;
    setIsRestoringGDrive(true);
    try {
      await invoke('gdrive_restore_backup', { fileId: selectedBackupForRestore.id });
      showToast('Khôi phục thành công! Đang chuyển về màn hình mở khóa...');
      setShowRestoreConfirmModal(false);
      onHome();
    } catch (err: any) {
      showToast(`Lỗi khôi phục: ${err?.toString() || err}`);
    } finally {
      setIsRestoringGDrive(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatBackupDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };

  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setStatus('error');
      setErrorMsg('Mật khẩu mới phải từ 8 ký tự trở lên');
      return;
    }
    
    setStatus('loading');
    try {
      await invoke('change_master_password', { oldPassword, newPassword });
      setStatus('success');
      showToast('Đổi mật khẩu chủ thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.toString());
    }
  };

  const handleExportBackup = async () => {
    setStatus('loading');
    try {
      const filePath = await save({
        filters: [{
          name: 'Vault Backup',
          extensions: ['vaultbak']
        }],
        defaultPath: `backup_${new Date().toISOString().split('T')[0]}.vaultbak`
      });
      if (filePath) {
        await invoke('export_backup', { targetPath: filePath });
        setStatus('success');
        showToast(`Đã lưu bản sao lưu thành công tại: ${filePath}`);
      } else {
        setStatus('idle');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.toString());
    }
  };

  const handleDeleteAll = async () => {
    if (confirmInput !== 'CONFIRM') return;
    setStatus('loading');
    try {
      await invoke('delete_all_entries');
      setStatus('success');
      showToast('Đã xóa toàn bộ mật khẩu!');
      setShowDeleteAllModal(false);
      setConfirmInput('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.toString());
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-10 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="mb-16 flex items-start justify-between">
        <div>
          <div className="inline-block rounded-full px-3 py-1 mb-4 text-[9px] uppercase tracking-[0.25em] font-medium bg-white/5 text-zinc-400 border border-white/10">
            Settings
          </div>
          <h2 className="text-5xl font-medium text-white tracking-tight leading-tight">
            Cài đặt
          </h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onBack}
            type="button"
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 active:scale-95 text-white"
            title="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
          <button 
            onClick={onHome}
            type="button"
            className="w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-zinc-100 rounded-full transition-colors border border-transparent active:scale-95"
            title="Về Trang chủ"
          >
            <Home size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="p-1.5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 space-y-6">
            
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">Đổi mật khẩu chủ</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Mật khẩu mới sẽ được mã hóa và tạo salt mới ngay lập tức.</p>
              </div>
            </div>

            {status === 'error' && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Mật khẩu cũ</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                data-1p-ignore="true"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl px-5 py-4 text-base font-mono tracking-widest focus:outline-none transition-colors text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Mật khẩu mới</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  data-1p-ignore="true"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl pl-5 pr-20 py-4 text-base font-mono tracking-widest focus:outline-none transition-colors text-white"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-1.5 rounded-full transition-colors ${strength >= i ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} 
                    />
                  ))}
                </div>
              </div>
              {newPassword && oldPassword === newPassword && (
                <p className="text-yellow-500/90 text-[11px] mt-3 ml-1 flex items-center gap-1.5 font-medium tracking-wide">
                  <ShieldAlert size={12} /> Cảnh báo: Bạn đang sử dụng lại mật khẩu cũ.
                </p>
              )}
            </div>

            <div className="pt-6 pb-2 flex justify-end">
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="px-8 py-3.5 bg-white hover:bg-zinc-100 disabled:opacity-50 text-black active:scale-[0.98] font-medium rounded-full transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <KeyRound size={16} />
                {status === 'loading' ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </form>

        <div className="p-1.5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <DatabaseBackup size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">Sao lưu & Khôi phục</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Tạo bản sao lưu toàn bộ dữ liệu hoặc khôi phục từ file .vaultbak.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={handleExportBackup}
                disabled={status === 'loading'}
                className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white rounded-2xl transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
              >
                <Download size={18} /> {status === 'loading' ? 'Đang sao lưu...' : 'Chọn nơi lưu & Tạo bản sao lưu'}
              </button>
            </div>
          </div>
        </div>

        {/* Google Drive Cloud Backup Section */}
        <div className="p-1.5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Cloud size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-white">Sao lưu Đám mây (Google Drive)</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Lưu trữ bản sao lưu đã mã hóa vào thư mục ẩn an toàn của bạn.
                  </p>
                </div>
              </div>

              {gdriveStatus?.is_connected ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium">
                    <CheckCircle2 size={12} /> Đã kết nối
                  </span>
                  <button
                    type="button"
                    onClick={handleDisconnectGDrive}
                    disabled={status === 'loading'}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                    title="Ngắt kết nối Google Drive"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-medium">
                  Chưa kết nối
                </span>
              )}
            </div>

            {!gdriveStatus?.is_connected ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Kết nối tài khoản Google cá nhân để sao lưu file mã hóa vào thư mục ẩn (<code className="text-blue-400 font-mono text-[11px]">appDataFolder</code>). Bản sao lưu không xuất hiện trên Google Drive web, an toàn tuyệt đối và không ai có thể đọc được ngoài bạn.
                </p>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  disabled={status === 'loading' || isConnectingGDrive}
                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Cloud size={18} /> {isConnectingGDrive ? 'Đang kết nối...' : 'Kết nối Google Drive'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleUploadCloudBackup}
                    disabled={status === 'loading' || isBackingUpGDrive}
                    className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <CloudUpload size={18} />
                    {isBackingUpGDrive ? 'Đang tải lên...' : 'Sao lưu ngay lên Google Drive'}
                  </button>
                  <button
                    type="button"
                    onClick={fetchCloudBackups}
                    disabled={isLoadingBackups}
                    className="px-4 py-4 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-2xl border border-white/10 transition-colors"
                    title="Làm mới danh sách"
                  >
                    <RotateCw size={16} className={isLoadingBackups ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Các bản sao lưu trên Cloud
                  </h4>

                  {isLoadingBackups ? (
                    <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" /> Đang tải danh sách bản sao lưu...
                    </div>
                  ) : cloudBackups.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl">
                      Chưa có bản sao lưu nào trên Google Drive. Hãy tạo bản sao lưu đầu tiên!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {cloudBackups.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-colors"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-xs font-mono text-zinc-200 truncate">{b.name}</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {formatBackupDate(b.created_time)} • {formatFileSize(b.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBackupForRestore(b);
                              setShowRestoreConfirmModal(true);
                            }}
                            disabled={isRestoringGDrive}
                            className="px-3.5 py-1.5 text-xs font-medium text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                          >
                            Khôi phục
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-1.5 rounded-[2.5rem] bg-white/[0.02] border border-red-500/10 shadow-2xl mt-8">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-red-500/20 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-red-500/10">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="font-medium text-red-400">Vùng nguy hiểm</h3>
                <p className="text-xs text-red-500/60 mt-0.5">Xóa vĩnh viễn toàn bộ dữ liệu trong Vault này.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => {
                  setConfirmInput('');
                  setShowDeleteAllModal(true);
                }}
                disabled={status === 'loading'}
                className="w-full px-6 py-4 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 font-medium rounded-2xl transition-all border border-red-500/20 active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
              >
                <Trash2 size={18} /> {status === 'loading' ? 'Đang xử lý...' : 'Xóa toàn bộ mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0f0f0f] border border-red-500/20 rounded-3xl p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3 text-red-400 font-medium">
                <Trash2 size={20} />
                <span>Xác nhận xóa vĩnh viễn</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDeleteAllModal(false)}
                className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Hành động này sẽ xóa <strong className="text-red-400">toàn bộ mật khẩu</strong> trong Vault và không thể hoàn tác. Nhập <code className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono text-xs">CONFIRM</code> để tiếp tục:
            </p>

            <input 
              type="text" 
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Nhập CONFIRM"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 font-mono text-sm"
              autoFocus
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium rounded-xl transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={confirmInput !== 'CONFIRM' || status === 'loading'}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-red-500 text-white font-medium rounded-xl transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Đang xóa...' : 'Xóa tất cả'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Bypass Guide Modal */}
      <GoogleDriveGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onConfirm={handleConfirmGuide}
        isLoading={isConnectingGDrive}
      />

      {/* Restore Cloud Backup Confirmation Modal */}
      {showRestoreConfirmModal && selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0f0f0f] border border-purple-500/20 rounded-3xl p-6 shadow-2xl relative space-y-5 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3 text-purple-400 font-medium">
                <AlertTriangle size={20} />
                <span>Xác nhận khôi phục từ Cloud</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRestoreConfirmModal(false)}
                className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Bạn có chắc chắn muốn khôi phục bản sao lưu <strong className="font-mono text-xs text-purple-300">{selectedBackupForRestore.name}</strong>?
            </p>
            <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl leading-relaxed">
              Dữ liệu hiện tại trong máy sẽ được thay thế bằng bản sao lưu này. Vault sẽ tự động khóa để bảo mật; bạn sẽ cần đăng nhập lại bằng mật khẩu chủ của bản sao lưu đó.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirmModal(false)}
                disabled={isRestoringGDrive}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium rounded-xl transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmRestoreCloudBackup}
                disabled={isRestoringGDrive}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRestoringGDrive ? 'Đang khôi phục...' : 'Khôi phục ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
