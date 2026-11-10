import { Copy, Eye, EyeOff, Plus, Upload, X, History } from 'lucide-react';
import { useVault } from '../hooks/useVault';

interface Props {
  vault: ReturnType<typeof useVault>;
  isMobile?: boolean;
}

export default function EntryDetailForm({ vault, isMobile }: Props) {
  const {
    selectedEntry,
    setSelectedEntry,
    isEditing,
    setIsEditing,
    handleSave,
    copyToClipboard,
    setShowGenerator,
    showPassword,
    setShowPassword,
    showCustomPasswords,
    toggleCustomPassword,
    handleAddCustomField,
    handleUpdateCustomField,
    handleRemoveCustomField,
    handleImportFile,
    showHistoryIdx,
    setShowHistoryIdx,
  } = vault;

  if (!selectedEntry) return null;

  return (
    <form onSubmit={handleSave} className={isMobile ? "space-y-6" : "space-y-8"}>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Tiêu đề</label>
          {isEditing ? (
            <input 
              type="text" 
              required
              placeholder="e.g. GitHub, Google, Netflix"
              value={selectedEntry.title}
              onChange={(e) => setSelectedEntry({ ...selectedEntry, title: e.target.value })}
              className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all font-medium ${
                isMobile ? 'py-3.5 text-base' : 'py-4 text-lg'
              }`}
            />
          ) : (
            <div className="text-lg text-zinc-200 font-medium px-1">{selectedEntry.title}</div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Tên đăng nhập / Email</label>
          {isEditing ? (
            <input 
              type="text" 
              placeholder="username or email"
              value={selectedEntry.username}
              onChange={(e) => setSelectedEntry({ ...selectedEntry, username: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all font-mono text-sm"
            />
          ) : (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-sm text-zinc-300">{selectedEntry.username || '—'}</span>
              {selectedEntry.username && (
                <button 
                  type="button" 
                  onClick={() => copyToClipboard(selectedEntry.username)} 
                  className={`p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors ${
                    isMobile ? 'min-h-[44px] min-w-[44px] flex items-center justify-center' : ''
                  }`}
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2.5 ml-1">
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all font-mono text-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-sm tracking-wider text-zinc-300">
                {showPassword ? selectedEntry.password : '••••••••••••••••'}
              </span>
              <div className="flex gap-1">
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className={`p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors ${
                    isMobile ? 'min-h-[44px] min-w-[44px] flex items-center justify-center' : ''
                  }`}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button 
                  type="button" 
                  onClick={() => copyToClipboard(selectedEntry.password)} 
                  className={`p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors ${
                    isMobile ? 'min-h-[44px] min-w-[44px] flex items-center justify-center' : ''
                  }`}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Website URL</label>
          {isEditing ? (
            <input 
              type="url" 
              placeholder="https://example.com"
              value={selectedEntry.url}
              onChange={(e) => setSelectedEntry({ ...selectedEntry, url: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-sm"
            />
          ) : (
            <div className="text-sm text-zinc-400 px-1">
              {selectedEntry.url ? (
                <a href={selectedEntry.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                  {selectedEntry.url}
                </a>
              ) : '—'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Danh mục</label>
          {isEditing ? (
            <input 
              type="text" 
              placeholder="e.g. Work, Personal, Finance"
              value={selectedEntry.category}
              onChange={(e) => setSelectedEntry({ ...selectedEntry, category: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-sm"
            />
          ) : (
            <div className="text-sm text-zinc-400 px-1">{selectedEntry.category || 'General'}</div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Ghi chú</label>
          {isEditing ? (
            <textarea 
              rows={3}
              placeholder="Ghi chú thêm..."
              value={selectedEntry.notes}
              onChange={(e) => setSelectedEntry({ ...selectedEntry, notes: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-sm resize-none"
            />
          ) : (
            <div className="text-sm text-zinc-400 whitespace-pre-wrap px-1">{selectedEntry.notes || '—'}</div>
          )}
        </div>

        {/* Custom Fields */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] ml-1">Trường tùy biến</label>
          {selectedEntry.custom_fields && selectedEntry.custom_fields.map((field, idx) => (
            isEditing ? (
              <div key={field.id} className="flex gap-3 items-center">
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
              <div key={field.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
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
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold ml-1 mr-2">Thêm trường:</span>
              <button type="button" onClick={() => handleAddCustomField('Text')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-medium text-white transition-colors border border-white/5 flex items-center gap-1"><Plus size={12}/> Văn bản</button>
              <button type="button" onClick={() => handleAddCustomField('Password')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-medium text-white transition-colors border border-white/5 flex items-center gap-1"><Plus size={12}/> Mật khẩu</button>
            </div>
          )}

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
        <div className={`flex justify-end gap-3 pt-6 animate-in fade-in slide-in-from-bottom-4 ${isMobile ? 'flex-col sm:flex-row' : ''}`}>
          <button 
            type="button" 
            onClick={() => { setIsEditing(false); if (!selectedEntry.id) setSelectedEntry(null); }} 
            className={`bg-transparent border border-white/10 hover:border-white/20 text-zinc-300 rounded-full font-medium transition-colors ${
              isMobile ? 'py-3 px-5 text-sm order-2 sm:order-1' : 'px-6 py-3.5'
            }`}
          >
            Hủy
          </button>
          <button 
            type="submit" 
            className={`bg-white hover:bg-zinc-100 text-black active:scale-[0.98] font-medium rounded-full transition-all ${
              isMobile ? 'py-3.5 px-6 text-sm order-1 sm:order-2' : 'px-8 py-3.5'
            }`}
          >
            Lưu thay đổi
          </button>
        </div>
      )}
    </form>
  );
}
