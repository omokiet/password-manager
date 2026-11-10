import { Shield, Plus, Search, LogOut, Copy, Trash2, KeyRound, Star, Settings, Activity, HelpCircle, QrCode } from 'lucide-react';
import { useVault } from '../shared/hooks/useVault';
import EntryDetailForm from '../shared/components/EntryDetailForm';
import PasswordGenerator from '../components/PasswordGenerator';
import SettingsPanel from '../components/SettingsPanel';
import HealthDashboard from '../components/HealthDashboard';
import UserGuide from '../components/UserGuide';
import QrTransferModal from '../components/QrTransferModal';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  onLock: () => void;
}

export default function DesktopDashboard({ onLock }: Props) {
  const vault = useVault({ onLock });
  const {
    entries,
    search,
    setSearch,
    selectedEntry,
    setSelectedEntry,
    isEditing,
    setIsEditing,
    showGenerator,
    setShowGenerator,
    toast,
    showToast,
    qrModalConfig,
    setQrModalConfig,
    viewMode,
    navigateTo,
    goBack,
    goHome,
    selectedCategory,
    setSelectedCategory,
    deleteConfirmId,
    setDeleteConfirmId,
    categories,
    filtered,
    loadEntries,
    handleLock,
    handleDelete,
    copyToClipboard,
    handleAddNew,
  } = vault;

  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden text-zinc-200">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] bg-[#111]/90 backdrop-blur-xl border border-white/10 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-right-8 fade-in duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          {toast}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl mx-4">
            <h3 className="text-xl font-medium text-white mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-zinc-400 mb-6">Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generator Modal */}
      {showGenerator && (
        <PasswordGenerator 
          onClose={() => setShowGenerator(false)} 
          onSelect={(pwd) => {
            if (selectedEntry) setSelectedEntry({ ...selectedEntry, password: pwd });
          }} 
        />
      )}

      {/* QR Transfer Modal */}
      {qrModalConfig?.isOpen && (
        <QrTransferModal
          mode={qrModalConfig.mode}
          entry={qrModalConfig.entry}
          onClose={() => setQrModalConfig(null)}
          onImportEntry={async (imported) => {
            await invoke('add_entry', { 
              entry: {
                ...imported,
                id: '',
                is_favorite: false,
                password_history: [],
                custom_fields: [],
                created_at: 0,
                updated_at: 0,
              } 
            });
            await loadEntries();
          }}
        />
      )}

      {/* Left Sidebar */}
      <div className="w-[380px] shrink-0 border-r border-white/5 bg-white/[0.01] flex flex-col relative z-10">
        <div className="px-6 py-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Shield size={14} className="text-white" strokeWidth={1.5} />
            </div>
            <h1 className="font-medium text-white tracking-tight">Vault</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigateTo('health')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border active:scale-95 ${viewMode === 'health' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent hover:bg-white/10 text-zinc-400 hover:text-white hover:border-white/10'}`}
              title="Độ mạnh Mật khẩu"
            >
              <Activity size={14} strokeWidth={2} />
            </button>
            <button 
              onClick={() => navigateTo('settings')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border active:scale-95 ${viewMode === 'settings' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent hover:bg-white/10 text-zinc-400 hover:text-white hover:border-white/10'}`}
              title="Cài đặt"
            >
              <Settings size={14} strokeWidth={2} />
            </button>
            <button 
              onClick={() => navigateTo('guide')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border active:scale-95 ${viewMode === 'guide' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent hover:bg-white/10 text-zinc-400 hover:text-white hover:border-white/10'}`}
              title="Hướng dẫn sử dụng"
            >
              <HelpCircle size={14} strokeWidth={2} />
            </button>
            <button 
              onClick={() => setQrModalConfig({ isOpen: true, mode: 'import' })}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10 active:scale-95"
              title="Quét mã QR"
            >
              <QrCode size={14} strokeWidth={2} />
            </button>
            <button 
              onClick={handleLock} 
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10 active:scale-95" 
              title="Khóa Vault"
            >
              <LogOut size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto custom-scrollbar pb-1">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${!selectedCategory ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${selectedCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm font-medium">
              Không tìm thấy mục nào.
            </div>
          ) : (
            filtered.map((entry) => (
              <div 
                key={entry.id}
                onClick={() => { setSelectedEntry(entry); setIsEditing(false); }}
                className={`group px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between border ${selectedEntry?.id === entry.id ? 'bg-white/10 border-white/10 shadow-lg backdrop-blur-md' : 'border-transparent hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedEntry?.id === entry.id ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10'}`}>
                    <KeyRound size={14} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-medium text-sm truncate ${selectedEntry?.id === entry.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                        {entry.title}
                      </h3>
                      {entry.is_favorite && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{entry.username || 'Không có tên đăng nhập'}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(entry.password); }}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-all shrink-0 active:scale-95"
                  title="Sao chép Mật khẩu"
                >
                  <Copy size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Entry Button */}
        <div className="p-6">
          <button 
            onClick={handleAddNew}
            className="w-full group relative flex items-center justify-center bg-white text-black font-medium rounded-full py-3.5 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] hover:bg-zinc-100"
          >
            <span className="transform translate-x-0 group-hover:-translate-x-3 transition-transform duration-500">
              Mật khẩu mới
            </span>
            <div className="absolute right-1.5 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-500">
              <Plus size={16} strokeWidth={2} />
            </div>
          </button>
        </div>
      </div>

      {/* Main Detail Area */}
      <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar bg-black/20">
        {viewMode === 'guide' ? (
          <UserGuide onBack={goBack} onHome={goHome} />
        ) : viewMode === 'health' ? (
          <HealthDashboard entries={entries} onBack={goBack} onHome={goHome} onEdit={(entry) => { setSelectedEntry(entry); setIsEditing(true); goHome(); }} />
        ) : viewMode === 'settings' ? (
          <SettingsPanel onBack={goBack} onHome={goHome} showToast={showToast} />
        ) : selectedEntry ? (
          <div className="max-w-3xl w-full mx-auto px-10 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <div className="flex justify-between items-start mb-16">
              <div>
                <div className="inline-block rounded-full px-3 py-1 mb-4 text-[9px] uppercase tracking-[0.25em] font-medium bg-white/5 text-zinc-400 border border-white/10">
                  {selectedEntry.category || 'General'}
                </div>
                <h2 className="text-5xl font-medium text-white tracking-tight leading-tight flex items-center gap-4">
                  {isEditing ? (selectedEntry.id ? 'Chỉnh sửa' : 'Thêm mới') : selectedEntry.title}
                  {isEditing ? (
                    <button type="button" onClick={() => setSelectedEntry({...selectedEntry, is_favorite: !selectedEntry.is_favorite})} className={`mt-2 p-2 rounded-full border transition-all ${selectedEntry.is_favorite ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}>
                      <Star size={24} className={selectedEntry.is_favorite ? "fill-yellow-500" : ""} />
                    </button>
                  ) : selectedEntry.is_favorite && (
                    <Star size={32} className="text-yellow-500 fill-yellow-500 mt-2" />
                  )}
                </h2>
              </div>
              
              {!isEditing && (
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setQrModalConfig({ isOpen: true, mode: 'export', entry: selectedEntry })}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-colors border border-white/10 active:scale-95"
                    title="Chia sẻ qua mã QR"
                  >
                    <QrCode size={16} />
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium transition-colors border border-white/10 active:scale-95 text-white"
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(selectedEntry.id)} 
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-full transition-colors border border-white/10 active:scale-95"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <EntryDetailForm vault={vault} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 animate-in fade-in duration-1000">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-6">
              <Shield size={24} className="opacity-40" strokeWidth={1} />
            </div>
            <p className="text-sm font-medium tracking-wide">Chọn một mục hoặc tạo mới.</p>
          </div>
        )}
      </div>
    </div>
  );
}
