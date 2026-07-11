export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  created_at: number;
  updated_at: number;
  is_favorite: boolean;
  password_history: PasswordHistoryEntry[];
}

export interface PasswordHistoryEntry {
  old_password: string;
  changed_at: number;
}
