import { Shield, Plus, Search, LogOut, Copy, Trash2, KeyRound, Star, QrCode, ArrowLeft } from 'lucide-react';
import { useVault } from '../shared/hooks/useVault';
import EntryDetailForm from '../shared/components/EntryDetailForm';
import PasswordGenerator from '../components/PasswordGenerator';
import SettingsPanel from '../components/SettingsPanel';
import HealthDashboard from '../components/HealthDashboard';
import UserGuide from '../components/UserGuide';
import QrTransferModal from '../components/QrTransferModal';
import MobileBottomNav from './MobileBottomNav';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  onLock: () => void;
}

export default function MobileDashboard({ onLock }: Props) {
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
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden text-zinc-200">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-16 left-4 right-4 z-[100] bg-[#111]/95 backdrop-blur-xl border border-white/10 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          {toast}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-medium text-white mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-zinc-400 mb-6">Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors min-h-[44px]"
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

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        {viewMode === 'guide' ? (
          <UserGuide onBack={goBack} onHome={goHome} />
        ) : viewMode === 'health' ? (
          <HealthDashboard entries={entries} onBack={goBack} onHome={goHome} onEdit={(entry) => { setSelectedEntry(entry); setIsEditing(true); goHome(); }} />
        ) : viewMode === 'settings' ? (
          <SettingsPanel onBack={goBack} onHome={goHome} showToast={showToast} />
        ) : selectedEntry ? (
          /* Mobile Detail / Edit View */
          <div className="w-full px-5 py-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              type="button" 
              onClick={() => { setSelectedEntry(null); setIsEditing(false); }}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 py-2 px-3.5 -ml-2 rounded-full bg-white/5 w-fit active:scale-95 transition-all min-h-[44px]"
            >
              <ArrowLeft size={16} /> Quay lại danh sách
            </button>

            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="inline-block rounded-full px-3 py-1 mb-2 text-[9px] uppercase tracking-[0.25em] font-medium bg-white/5 text-zinc-400 border border-white/10">
                  {selectedEntry.category || 'General'}
                </div>
                <h2 className="text-3xl font-medium text-white tracking-tight leading-tight flex items-center gap-3">
                  {isEditing ? (selectedEntry.id ? 'Chỉnh sửa' : 'Thêm mới') : selectedEntry.title}
                  {isEditing ? (
                    <button type="button" onClick={() => setSelectedEntry({...selectedEntry, is_favorite: !selectedEntry.is_favorite})} className={`p-2 rounded-full border transition-all ${selectedEntry.is_favorite ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}>
                      <Star size={18} className={selectedEntry.is_favorite ? "fill-yellow-500" : ""} />
                    </button>
                  ) : selectedEntry.is_favorite && (
                    <Star size={24} className="text-yellow-500 fill-yellow-500" />
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
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-medium transition-colors border border-white/10 active:scale-95 text-white min-h-[44px]"
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

            <EntryDetailForm vault={vault} isMobile />
          </div>
        ) : (
          /* Mobile Entries List View */
          <div className="flex-1 flex flex-col p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Shield size={14} className="text-white" strokeWidth={1.5} />
                </div>
                <h1 className="font-medium text-white tracking-tight">Vault</h1>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setQrModalConfig({ isOpen: true, mode: 'import' })}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 active:scale-95"
                  title="Quét mã QR"
                >
                  <QrCode size={15} strokeWidth={2} />
                </button>
                <button 
                  onClick={handleLock} 
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 active:scale-95" 
                  title="Khóa Vault"
                >
                  <LogOut size={15} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative group mb-3">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white" />
              <input 
                type="text" 
                placeholder="Tìm kiếm mục..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1 custom-scrollbar">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full min-h-[32px] ${!selectedCategory ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full min-h-[32px] ${selectedCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pb-16">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-zinc-600 text-sm font-medium">
                  Không tìm thấy mục nào.
                </div>
              ) : (
                filtered.map((entry) => (
                  <div 
                    key={entry.id}
                    onClick={() => { setSelectedEntry(entry); setIsEditing(false); }}
                    className="px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between active:scale-[0.99] transition-all min-h-[56px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/5 text-zinc-400 flex items-center justify-center shrink-0">
                        <KeyRound size={14} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-medium text-sm text-zinc-200 truncate">{entry.title}</h3>
                          {entry.is_favorite && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{entry.username || '—'}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(entry.password); }}
                      className="p-2 text-zinc-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center active:bg-white/10"
                      title="Sao chép Mật khẩu"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Floating Action Button (FAB) for New Entry */}
            <button 
              onClick={handleAddNew}
              className="fixed bottom-16 right-5 w-12 h-12 rounded-full bg-white text-black shadow-2xl flex items-center justify-center active:scale-95 transition-all z-20"
              title="Thêm mục mới"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeView={viewMode}
        hasSelectedEntry={Boolean(selectedEntry)}
        onNavigate={(view) => {
          navigateTo(view);
          setSelectedEntry(null);
        }}
        onOpenGenerator={() => setShowGenerator(true)}
      />
    </div>
  );
}
