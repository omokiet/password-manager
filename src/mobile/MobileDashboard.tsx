import { Shield, Plus, Search, LogOut, Copy, Trash2, KeyRound, Star, History, Eye, EyeOff, Upload, X, QrCode, ArrowLeft } from 'lucide-react';
import { useVault } from '../shared/hooks/useVault';
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
    showHistoryIdx,
    setShowHistoryIdx,
    showPassword,
    setShowPassword,
    showCustomPasswords,
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
    handleSave,
    handleDelete,
    copyToClipboard,
    handleAddCustomField,
    handleUpdateCustomField,
    handleRemoveCustomField,
    handleImportFile,
    toggleCustomPassword,
    handleAddNew,
  } = useVault({ onLock });

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

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2 ml-1">Tiêu đề</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. GitHub, Google"
                    value={selectedEntry.title}
                    onChange={(e) => setSelectedEntry({ ...selectedEntry, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-medium text-base"
                  />
                ) : (
                  <div className="text-base text-zinc-200 font-medium px-1">{selectedEntry.title}</div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2 ml-1">Tên đăng nhập / Email</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    placeholder="username or email"
                    value={selectedEntry.username}
                    onChange={(e) => setSelectedEntry({ ...selectedEntry, username: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 font-mono text-sm"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="font-mono text-sm text-zinc-300 truncate">{selectedEntry.username || '—'}</span>
                    {selectedEntry.username && (
                      <button type="button" onClick={() => copyToClipboard(selectedEntry.username)} className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg">
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">Mật khẩu</label>
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={() => setShowGenerator(true)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Tạo mật khẩu mạnh
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      value={selectedEntry.password}
                      onChange={(e) => setSelectedEntry({ ...selectedEntry, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-mono text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="font-mono text-sm tracking-wider text-zinc-300">
                      {showPassword ? selectedEntry.password : '••••••••••••••••'}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button type="button" onClick={() => copyToClipboard(selectedEntry.password)} className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2 ml-1">Website URL</label>
                {isEditing ? (
                  <input 
                    type="url" 
                    placeholder="https://example.com"
                    value={selectedEntry.url}
                    onChange={(e) => setSelectedEntry({ ...selectedEntry, url: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 text-sm"
                  />
                ) : (
                  <div className="text-sm text-zinc-400 px-1 truncate">
                    {selectedEntry.url ? (
                      <a href={selectedEntry.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                        {selectedEntry.url}
                      </a>
                    ) : '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2 ml-1">Danh mục</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    placeholder="e.g. Work, Personal"
                    value={selectedEntry.category}
                    onChange={(e) => setSelectedEntry({ ...selectedEntry, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 text-sm"
                  />
                ) : (
                  <div className="text-sm text-zinc-400 px-1">{selectedEntry.category || 'General'}</div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2 ml-1">Ghi chú</label>
                {isEditing ? (
                  <textarea 
                    rows={3}
                    placeholder="Ghi chú thêm..."
                    value={selectedEntry.notes}
                    onChange={(e) => setSelectedEntry({ ...selectedEntry, notes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 text-sm resize-none"
                  />
                ) : (
                  <div className="text-sm text-zinc-400 whitespace-pre-wrap px-1">{selectedEntry.notes || '—'}</div>
                )}
              </div>

              {/* Custom Fields */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] ml-1">Trường tùy biến</label>
                {selectedEntry.custom_fields && selectedEntry.custom_fields.map((field, idx) => (
                  isEditing ? (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input 
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateCustomField(idx, { label: e.target.value })}
                        className="w-1/3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        placeholder="Tên trường"
                      />
                      <input 
                        type={field.field_type === 'Password' ? 'password' : 'text'}
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(idx, { value: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        placeholder="Giá trị"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCustomField(idx)} 
                        className="p-2 text-zinc-500 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div key={field.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{field.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-zinc-300">
                          {field.field_type === 'Password' ? (showCustomPasswords[field.id] ? field.value : '••••••••') : field.value}
                        </span>
                        {field.field_type === 'Password' && (
                          <button type="button" onClick={() => toggleCustomPassword(field.id)} className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg">
                            {showCustomPasswords[field.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                        <button type="button" onClick={() => copyToClipboard(field.value)} className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg">
                          <Copy size={13} />
                        </button>
                        {field.field_type === 'Text' && (
                          <button type="button" onClick={() => handleImportFile(idx)} className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg flex items-center gap-1 text-[11px]">
                            <Upload size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                ))}

                {isEditing && (
                  <div className="pt-2 flex gap-2 items-center flex-wrap">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold ml-1 mr-2">Thêm:</span>
                    <button type="button" onClick={() => handleAddCustomField('Text')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-medium text-white transition-colors border border-white/5 flex items-center gap-1 min-h-[36px]"><Plus size={12}/> Văn bản</button>
                    <button type="button" onClick={() => handleAddCustomField('Password')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-medium text-white transition-colors border border-white/5 flex items-center gap-1 min-h-[36px]"><Plus size={12}/> Mật khẩu</button>
                  </div>
                )}

                {!isEditing && selectedEntry.password_history && selectedEntry.password_history.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <label className="flex items-center gap-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-3 ml-1">
                      <History size={12} /> Lịch sử mật khẩu
                    </label>
                    <div className="space-y-2">
                      {selectedEntry.password_history.map((hist, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="font-mono text-xs tracking-widest text-zinc-300">
                            {showHistoryIdx === idx ? hist.old_password : '••••••••••••'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-medium">
                              {new Date(hist.changed_at * 1000).toLocaleDateString()}
                            </span>
                            <button 
                              type="button"
                              onClick={() => setShowHistoryIdx(showHistoryIdx === idx ? null : idx)}
                              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white"
                            >
                              {showHistoryIdx === idx ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => { setIsEditing(false); if (!selectedEntry.id) setSelectedEntry(null); }} 
                    className="px-5 py-3 bg-transparent border border-white/10 text-zinc-300 rounded-full font-medium text-sm min-h-[44px]"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-white text-black active:scale-[0.98] font-medium rounded-full text-sm min-h-[44px]"
                  >
                    Lưu
                  </button>
                </div>
              )}
            </form>
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
