import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VaultScreen from '../VaultScreen';
import { vi } from 'vitest';

// Mock tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(true),
}));

describe('VaultScreen', () => {
  const mockOnUnlocked = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unlock screen by default', async () => {
    render(<VaultScreen onUnlocked={mockOnUnlocked} />);
    
    expect(await screen.findByText('Mở khóa Vault')).toBeInTheDocument();
    expect(screen.getByText('Hệ thống yêu cầu mật khẩu chủ để giải mã dữ liệu.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mật khẩu chủ')).toBeInTheDocument();
  });

  it('toggles to create screen when link is clicked', async () => {
    render(<VaultScreen onUnlocked={mockOnUnlocked} />);
    
    const createLink = await screen.findByText('Chưa có Vault? Tạo mới');
    await userEvent.click(createLink);
    
    expect(screen.getByText('Tạo Vault')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Xác nhận mật khẩu')).toBeInTheDocument();
  });

  it('shows error if password is less than 8 characters during creation', async () => {
    render(<VaultScreen onUnlocked={mockOnUnlocked} />);
    
    // Switch to create
    await userEvent.click(await screen.findByText('Chưa có Vault? Tạo mới'));
    
    // Input short password
    const passwordInput = screen.getByPlaceholderText('Mật khẩu chủ');
    const confirmInput = screen.getByPlaceholderText('Xác nhận mật khẩu');
    
    await userEvent.type(passwordInput, '1234567');
    await userEvent.type(confirmInput, '1234567');
    
    const submitBtn = screen.getAllByText('Khởi tạo')[1];
    await userEvent.click(submitBtn);
    
    expect(screen.getByText('Mật khẩu tối thiểu 8 ký tự.')).toBeInTheDocument();
  });

  it('shows error if passwords do not match during creation', async () => {
    render(<VaultScreen onUnlocked={mockOnUnlocked} />);
    
    await userEvent.click(await screen.findByText('Chưa có Vault? Tạo mới'));
    
    const passwordInput = screen.getByPlaceholderText('Mật khẩu chủ');
    const confirmInput = screen.getByPlaceholderText('Xác nhận mật khẩu');
    
    await userEvent.type(passwordInput, 'longenough1');
    await userEvent.type(confirmInput, 'longenough2');
    
    const submitBtn = screen.getAllByText('Khởi tạo')[1];
    await userEvent.click(submitBtn);
    
    expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
  });
});
