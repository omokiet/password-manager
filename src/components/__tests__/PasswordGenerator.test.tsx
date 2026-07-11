import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordGenerator from '../PasswordGenerator';
import { vi } from 'vitest';

describe('PasswordGenerator', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default length of 16', () => {
    render(<PasswordGenerator onSelect={mockOnSelect} onClose={mockOnClose} />);
    
    // Check if the range input exists and has value 16
    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toHaveValue('16');
    
    // Check if password input has a generated password of length 16
    const passwordInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(passwordInput.value.length).toBe(16);
  });

  it('updates password length when slider changes', async () => {
    render(<PasswordGenerator onSelect={mockOnSelect} onClose={mockOnClose} />);
    
    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '20' } });
    
    const passwordInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(passwordInput.value.length).toBe(20);
  });

  it('calls onSelect with the generated password and onClose when "Sử dụng" is clicked', async () => {
    render(<PasswordGenerator onSelect={mockOnSelect} onClose={mockOnClose} />);
    
    const passwordInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    const currentPassword = passwordInput.value;
    
    const useButton = screen.getByText('Sử dụng');
    await userEvent.click(useButton);
    
    expect(mockOnSelect).toHaveBeenCalledWith(currentPassword);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('generates an empty password and disables submit button if all options are unchecked', async () => {
    render(<PasswordGenerator onSelect={mockOnSelect} onClose={mockOnClose} />);
    
    const uppercaseCheckbox = screen.getByLabelText('Chữ hoa (A-Z)');
    const lowercaseCheckbox = screen.getByLabelText('Chữ thường (a-z)');
    const numberCheckbox = screen.getByLabelText('Số (0-9)');
    const symbolCheckbox = screen.getByLabelText('Ký tự đặc biệt (!@#$)');

    await userEvent.click(uppercaseCheckbox);
    await userEvent.click(lowercaseCheckbox);
    await userEvent.click(numberCheckbox);
    await userEvent.click(symbolCheckbox);
    
    const passwordInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(passwordInput.value).toBe('');
    
    const useButton = screen.getByText('Sử dụng');
    expect(useButton).toBeDisabled();
  });
});
