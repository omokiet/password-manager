import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { PasswordEntry } from '../types';
import { Plus, Search, LogOut, Copy, Trash2, KeyRound, Shield, Star, History, Eye, EyeOff, Settings, Activity } from 'lucide-react';
import PasswordGenerator from './PasswordGenerator';
import SettingsPanel from './SettingsPanel';
import HealthDashboard from './HealthDashboard';

interface Props {
  onLock: () => void;
}

const emptyEntry: PasswordEntry = {
  id: '',
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  category: 'General',
  created_at: 0,
  updated_at: 0,
  is_favorite: false,
  password_history: [],
};

export default function Dashboard({ onLock }: Props) {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [toast, setToast] = useState('');
  const [showHistoryIdx, setShowHistoryIdx] = useState<number | null>(null);
  const [viewHistory, setViewHistory] = useState<('vault' | 'settings' | 'health')[]>(['vault']);
  const viewMode = viewHistory[viewHistory.length - 1];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const navigateTo = (view: 'vault' | 'settings' | 'health') => {
    if (viewMode === view) return;
    if (view === 'vault') {
      setViewHistory(['vault']);
    } else {
      setViewHistory(prev => [...prev, view]);
    }
  };

  const goBack = () => {
    setViewHistory(prev => prev.length > 1 ? prev.slice(0, -1) : ['vault']);
  };

  const goHome = () => {
    setViewHistory(['vault']);
  };
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadEntries = async () => {
    try {
      const data: PasswordEntry[] = await invoke('get_all_entries');
      setEntries(data);
    } catch (e) {
      console.error('Failed to load entries:', e);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Auto-lock sau 5 phút không hoạt động
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 5 phút = 300000 ms
      timeoutId = setTimeout(() => {
        handleLock();
      }, 300000);
    };

    resetTimer();
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, []);

  const handleLock = async () => {
    try {
      await invoke('lock_vault');
      onLock();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    try {
      if (selectedEntry.id) {
        await invoke('update_entry', { entry: selectedEntry });
      } else {
        await invoke('add_entry', { entry: selectedEntry });
      }
      setIsEditing(false);
      loadEntries();
      showToast('Lưu thành công');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi lưu');
    }
  };

  // Keyboard Shortcut Copy Password (Ctrl+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (window.getSelection()?.toString()) return; // allow normal copy if text selected
        if (selectedEntry && !isEditing && viewMode === 'vault') {
          e.preventDefault();
          copyToClipboard(selectedEntry.password);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntry, isEditing, viewMode]);

  const handleDelete = async (id: string) => {
    try {
      await invoke('delete_entry', { id });
      setSelectedEntry(null);
      setIsEditing(false);
      setDeleteConfirmId(null);
      loadEntries();
      showToast('Đã xóa mục');
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Đã copy vào clipboard');
      setTimeout(() => {
        navigator.clipboard.readText().then(current => {
          if (current === text) {
            navigator.clipboard.writeText('');
          }
        }).catch(() => {
          showToast('Cảnh báo: OS chặn xóa clipboard');
        });
      }, 30000);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const categories = Array.from(new Set(entries.map(e => e.category).filter(Boolean)));
  const filtered = entries.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory ? e.category === selectedCategory : true;
    return matchSearch && matchCategory;
  }).sort((a, b) => {
    // is_favorite lên đầu
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    // sau đó theo thời gian tạo mới nhất
    return b.created_at - a.created_at;
  });

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

      {/* Left Sidebar */}
      <div className="w-[320px] md:w-[380px] shrink-0 border-r border-white/5 bg-white/[0.01] flex flex-col relative z-10">
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

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
          {filtered.map((entry, i) => (
            <div 
              key={entry.id}
              onClick={() => { setSelectedEntry(entry); setIsEditing(false); setShowHistoryIdx(null); goHome(); }}
              className={`px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 flex items-center gap-4 group animate-in fade-in slide-in-from-left-4
                ${selectedEntry?.id === entry.id && viewMode === 'vault'
                  ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                  : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'}
              `}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <div className={`w-10 h-10 rounded-[0.85rem] flex items-center justify-center text-sm font-semibold uppercase shrink-0 transition-colors
                ${selectedEntry?.id === entry.id && viewMode === 'vault' ? 'bg-white/10' : 'bg-white/5 group-hover:bg-white/10'}
              `}>
                {entry.title.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="font-medium text-sm truncate tracking-tight flex items-center gap-1.5">
                  {entry.title}
                  {entry.is_favorite && <Star size={10} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                </div>
                <div className="text-[11px] opacity-60 truncate mt-0.5 font-mono tracking-wider">{entry.username}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-xs text-zinc-600 mt-12 font-medium uppercase tracking-[0.2em]">
              Không tìm thấy dữ liệu
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-white/5 bg-gradient-to-t from-black/50 to-transparent">
          <button 
            onClick={() => { setSelectedEntry({ ...emptyEntry }); setIsEditing(true); goHome(); }}
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
        {viewMode === 'health' ? (
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

            <form onSubmit={handleSave} className="space-y-8">
              <div className="p-1.5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
                <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 space-y-6">
                  
                  {/* Field: Title */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Tiêu đề</label>
                    <input
                      type="text"
                      required
                      readOnly={!isEditing}
                      value={selectedEntry.title}
                      onChange={(e) => setSelectedEntry({ ...selectedEntry, title: e.target.value })}
                      className={`w-full bg-white/5 border ${isEditing ? 'border-white/10 focus:border-white/20' : 'border-transparent text-white'} rounded-2xl px-5 py-4 text-base focus:outline-none transition-colors`}
                    />
                  </div>
                  
                  {/* Field: Username */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Tên đăng nhập / Email</label>
                    <div className="relative group">
                      <input
                        type="text"
                        readOnly={!isEditing}
                        value={selectedEntry.username}
                        onChange={(e) => setSelectedEntry({ ...selectedEntry, username: e.target.value })}
                        className={`w-full bg-white/5 border ${isEditing ? 'border-white/10 focus:border-white/20' : 'border-transparent text-white'} rounded-2xl px-5 py-4 text-base focus:outline-none transition-colors pr-12`}
                      />
                      {!isEditing && (
                        <button 
                          type="button" 
                          onClick={() => copyToClipboard(selectedEntry.username)} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Field: Password */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Mật khẩu</label>
                    <div className="relative group">
                      <input
                        type={isEditing ? "text" : "password"}
                        readOnly={!isEditing}
                        value={selectedEntry.password}
                        onChange={(e) => setSelectedEntry({ ...selectedEntry, password: e.target.value })}
                        className={`w-full bg-white/5 border ${isEditing ? 'border-white/10 focus:border-white/20' : 'border-transparent text-white'} rounded-2xl px-5 py-4 text-base font-mono tracking-widest focus:outline-none transition-colors pr-24`}
                      />
                      {isEditing ? (
                        <button 
                          type="button" 
                          onClick={() => setShowGenerator(true)} 
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-medium tracking-wide flex items-center gap-1.5 transition-colors active:scale-95"
                        >
                          <KeyRound size={12} /> Auto
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => copyToClipboard(selectedEntry.password)} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Field: URL */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Địa chỉ Website</label>
                    <input
                      type="url"
                      readOnly={!isEditing}
                      value={selectedEntry.url}
                      onChange={(e) => setSelectedEntry({ ...selectedEntry, url: e.target.value })}
                      className={`w-full bg-white/5 border ${isEditing ? 'border-white/10 focus:border-white/20' : 'border-transparent text-zinc-300'} rounded-2xl px-5 py-4 text-base focus:outline-none transition-colors`}
                    />
                  </div>

                  {/* Field: Category */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Danh mục (Tab/Folder)</label>
                    <input
                      type="text"
                      readOnly={!isEditing}
                      value={selectedEntry.category}
                      onChange={(e) => setSelectedEntry({ ...selectedEntry, category: e.target.value })}
                      placeholder="Ví dụ: Game, Công việc, Cá nhân..."
                      className={`w-full bg-white/5 border ${isEditing ? 'border-white/10 focus:border-white/20' : 'border-transparent text-zinc-300'} rounded-2xl px-5 py-4 text-base focus:outline-none transition-colors`}
                    />
                  </div>

                  {!isEditing && selectedEntry.password_history && selectedEntry.password_history.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <label className="flex items-center gap-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-4 ml-1">
                        <History size={12} /> Lịch sử mật khẩu
                      </label>
                      <div className="space-y-2">
                        {selectedEntry.password_history.map((hist, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="font-mono text-sm tracking-widest text-zinc-300">
                              {showHistoryIdx === idx ? hist.old_password : '••••••••••••'}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-zinc-500 font-medium">
                                {new Date(hist.changed_at * 1000).toLocaleDateString()}
                              </span>
                              <button 
                                type="button"
                                onClick={() => setShowHistoryIdx(showHistoryIdx === idx ? null : idx)}
                                className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
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
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-6 animate-in fade-in slide-in-from-bottom-4">
                  <button 
                    type="button" 
                    onClick={() => { setIsEditing(false); if(!selectedEntry.id) setSelectedEntry(null); }} 
                    className="px-6 py-3.5 bg-transparent border border-white/10 hover:border-white/20 text-zinc-300 rounded-full font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3.5 bg-white hover:bg-zinc-100 text-black active:scale-[0.98] font-medium rounded-full transition-all"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </form>
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
