import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { PasswordEntry, CustomField, CustomFieldType } from '../../types';

export const emptyEntry: PasswordEntry = {
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
  custom_fields: [],
};

interface UseVaultOptions {
  onLock: () => void;
}

export function useVault({ onLock }: UseVaultOptions) {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [toast, setToast] = useState('');
  const [showHistoryIdx, setShowHistoryIdx] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCustomPasswords, setShowCustomPasswords] = useState<Record<string, boolean>>({});
  const [qrModalConfig, setQrModalConfig] = useState<{ isOpen: boolean; mode: 'export' | 'import'; entry?: PasswordEntry | null } | null>(null);
  const [viewHistory, setViewHistory] = useState<('vault' | 'settings' | 'health' | 'guide')[]>(['vault']);
  const viewMode = viewHistory[viewHistory.length - 1];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const navigateTo = (view: 'vault' | 'settings' | 'health' | 'guide') => {
    if (viewMode === view) return;
    if (view === 'vault') {
      setViewHistory(['vault']);
    } else {
      setViewHistory(prev => [...prev, view]);
    }
  };

  const goBack = () => {
    setViewHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : ['vault']));
  };

  const goHome = () => {
    setViewHistory(['vault']);
  };

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

  // Auto-lock sau 5 phút không tương tác chuột/bàn phím
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
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
      await loadEntries();
      showToast('Lưu thành công');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi lưu');
    }
  };

  // Keyboard shortcut Ctrl+C / Cmd+C sao chép password nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (window.getSelection()?.toString()) return;
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
      await loadEntries();
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

  const handleAddCustomField = (type: CustomFieldType) => {
    if (!selectedEntry) return;
    const newField: CustomField = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      label: 'Trường mới',
      value: '',
      field_type: type,
    };
    setSelectedEntry({
      ...selectedEntry,
      custom_fields: [...(selectedEntry.custom_fields || []), newField],
    });
  };

  const handleUpdateCustomField = (index: number, updates: Partial<CustomField>) => {
    if (!selectedEntry || !selectedEntry.custom_fields) return;
    const newFields = [...selectedEntry.custom_fields];
    newFields[index] = { ...newFields[index], ...updates };
    setSelectedEntry({ ...selectedEntry, custom_fields: newFields });
  };

  const handleRemoveCustomField = (index: number) => {
    if (!selectedEntry || !selectedEntry.custom_fields) return;
    const newFields = [...selectedEntry.custom_fields];
    newFields.splice(index, 1);
    setSelectedEntry({ ...selectedEntry, custom_fields: newFields });
  };

  const handleImportFile = async (index: number) => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Tệp văn bản',
          extensions: ['txt', 'md', 'csv', 'pem', 'json'],
        }],
      });
      if (selected && typeof selected === 'string') {
        const contents = await invoke<string>('read_file_content', { filePath: selected });
        if (contents.length > 10240) {
          showToast('File quá lớn (giới hạn 10KB)');
          return;
        }
        handleUpdateCustomField(index, { value: contents });
        showToast('Đã import file');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi đọc file');
    }
  };

  const toggleCustomPassword = (id: string) => {
    setShowCustomPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddNew = () => {
    setSelectedEntry({ ...emptyEntry, category: selectedCategory || 'General' });
    setIsEditing(true);
  };

  const categories = Array.from(new Set(entries.map(e => e.category).filter(Boolean)));
  const filtered = entries
    .filter(e => {
      const matchSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.custom_fields && e.custom_fields.some(f => f.value.toLowerCase().includes(search.toLowerCase())));
      const matchCategory = selectedCategory ? e.category === selectedCategory : true;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return b.created_at - a.created_at;
    });

  return {
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
  };
}
