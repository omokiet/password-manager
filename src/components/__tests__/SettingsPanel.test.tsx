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
    expect(mockInvoke).not.toHaveBeenCalled();
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
});
