import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPanel from '../SettingsPanel';

const mockInvoke = vi.fn();
const mockSave = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: (...args: any[]) => mockSave(...args),
}));

describe('SettingsPanel Component', () => {
  const mockOnBack = vi.fn();
  const mockOnHome = vi.fn();
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings panel elements properly', () => {
    render(<SettingsPanel onBack={mockOnBack} onHome={mockOnHome} showToast={mockShowToast} />);
    expect(screen.getByText('Cài đặt')).toBeInTheDocument();
    expect(screen.getByText('Đổi mật khẩu chủ')).toBeInTheDocument();
    expect(screen.getByText('Sao lưu & Khôi phục')).toBeInTheDocument();
    expect(screen.getByText('Vùng nguy hiểm')).toBeInTheDocument();
  });

  it('validates new password length under 8 characters', async () => {
    const { container } = render(
      <SettingsPanel onBack={mockOnBack} onHome={mockOnHome} showToast={mockShowToast} />
    );
    const passwordInputs = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
    
    await userEvent.type(passwordInputs[0], 'oldpass123');
    await userEvent.type(passwordInputs[1], 'short');

    const submitBtn = screen.getByRole('button', { name: /đổi mật khẩu/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Mật khẩu mới phải từ 8 ký tự trở lên')).toBeInTheDocument();
    expect(mockInvoke).not.toHaveBeenCalledWith('change_master_password', expect.anything());
  });

  it('handles export backup successfully with user selected path', async () => {
    mockSave.mockResolvedValue('C:\\backups\\my_vault.vaultbak');
    mockInvoke.mockResolvedValue(undefined);

    render(<SettingsPanel onBack={mockOnBack} onHome={mockOnHome} showToast={mockShowToast} />);
    
    const exportBtn = screen.getByRole('button', { name: /chọn nơi lưu & tạo bản sao lưu/i });
    await userEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockInvoke).toHaveBeenCalledWith('export_backup', {
        targetPath: 'C:\\backups\\my_vault.vaultbak',
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('C:\\backups\\my_vault.vaultbak')
      );
    });
  });

  it('aborts export if user cancels the save dialog', async () => {
    mockSave.mockResolvedValue(null);

    render(<SettingsPanel onBack={mockOnBack} onHome={mockOnHome} showToast={mockShowToast} />);
    
    const exportBtn = screen.getByRole('button', { name: /chọn nơi lưu & tạo bản sao lưu/i });
    await userEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockInvoke).not.toHaveBeenCalledWith('export_backup', expect.anything());
    });
  });

  it('shows in-app confirmation modal and deletes all entries only when CONFIRM is typed', async () => {
    mockInvoke.mockResolvedValue(undefined);

    render(<SettingsPanel onBack={mockOnBack} onHome={mockOnHome} showToast={mockShowToast} />);

    const openDeleteBtn = screen.getByRole('button', { name: /xóa toàn bộ mật khẩu/i });
    await userEvent.click(openDeleteBtn);

    expect(screen.getByText('Xác nhận xóa vĩnh viễn')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /xóa tất cả/i });
    expect(deleteBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('Nhập CONFIRM');
    await userEvent.type(input, 'WRONG');
    expect(deleteBtn).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, 'CONFIRM');
    expect(deleteBtn).toBeEnabled();

    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('delete_all_entries');
      expect(mockShowToast).toHaveBeenCalledWith('Đã xóa toàn bộ mật khẩu!');
    });
  });

  it('renders Google Drive section and opens guide modal when clicking connect', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'gdrive_get_status') {
        return Promise.resolve({ is_connected: false });
      }
      return Promise.resolve();
    });

    render(<SettingsPanel onBack={mockOnBack} onHome={mockOnHome} showToast={mockShowToast} />);

    expect(await screen.findByText('Sao lưu Đám mây (Google Drive)')).toBeInTheDocument();
    expect(screen.getByText('Chưa kết nối')).toBeInTheDocument();

    const connectBtn = screen.getByRole('button', { name: /kết nối google drive/i });
    await userEvent.click(connectBtn);

    expect(screen.getByText('Hướng dẫn xác thực Google Drive')).toBeInTheDocument();
    expect(screen.getByText(/Ứng dụng chưa xác minh/i)).toBeInTheDocument();
  });

  it('triggers cloud backup when connected and updates list', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'gdrive_get_status') {
        return Promise.resolve({ is_connected: true, connected_at: 1700000000 });
      }
      if (cmd === 'gdrive_list_backups') {
        return Promise.resolve([
          {
            id: 'cloud_file_1',
            name: 'vault_backup_20261110_120000.vaultbak',
            size: 45056,
            created_time: '2026-11-10T12:00:00.000Z',
          },
        ]);
      }
      if (cmd === 'gdrive_upload_backup') {
        return Promise.resolve('new_file_id');
      }
      return Promise.resolve();
    });

    render(<SettingsPanel onBack={mockOnBack} onHome={mockOnHome} showToast={mockShowToast} />);

    expect(await screen.findByText('Đã kết nối')).toBeInTheDocument();
    expect(await screen.findByText('vault_backup_20261110_120000.vaultbak')).toBeInTheDocument();

    const backupBtn = screen.getByRole('button', { name: /sao lưu ngay lên google drive/i });
    await userEvent.click(backupBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('gdrive_upload_backup');
      expect(mockShowToast).toHaveBeenCalledWith('Đã sao lưu lên Google Drive thành công!');
    });
  });
});
