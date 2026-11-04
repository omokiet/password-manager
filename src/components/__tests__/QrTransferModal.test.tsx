import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QrTransferModal from '../QrTransferModal';

describe('QrTransferModal Component', () => {
  const mockEntry = {
    id: 'test-1',
    title: 'Test Entry',
    username: 'user1',
    password: 'password123',
    url: 'https://test.com',
    notes: 'sample note',
    category: 'General',
    created_at: 1000,
    updated_at: 1000,
    is_favorite: false,
    password_history: [],
    custom_fields: [],
  };

  it('renders export mode with PIN and QR code', async () => {
    render(<QrTransferModal mode="export" entry={mockEntry} onClose={() => {}} />);
    expect(screen.getByText(/Chia sẻ mã QR mã hóa/i)).toBeInTheDocument();
    expect(screen.getByText(/Mã PIN một lần:/i)).toBeInTheDocument();
  });

  it('renders import mode with camera and upload options', () => {
    render(<QrTransferModal mode="import" onClose={() => {}} />);
    expect(screen.getByText(/Quét mã QR để nhận/i)).toBeInTheDocument();
    expect(screen.getByText(/Mở Camera để quét/i)).toBeInTheDocument();
    expect(screen.getByText(/Chọn ảnh QR từ thiết bị/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<QrTransferModal mode="import" onClose={handleClose} />);
    const closeBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});

