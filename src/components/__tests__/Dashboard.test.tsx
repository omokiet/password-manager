import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../Dashboard';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((command) => {
    if (command === 'get_all_entries') {
      return Promise.resolve([]);
    }
    return Promise.resolve();
  })
}));

describe('Dashboard Component', () => {
  it('renders Vault by default', async () => {
    render(<Dashboard onLock={() => {}} />);
    const vaultElements = await screen.findAllByText(/Vault/i);
    expect(vaultElements.length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to Settings when Settings button is clicked', async () => {
    render(<Dashboard onLock={() => {}} />);
    const settingsButton = await screen.findByTitle('Cài đặt');
    fireEvent.click(settingsButton);
    expect(await screen.findByText(/Đổi mật khẩu chủ/i)).toBeInTheDocument();
  });

  it('navigates back to Vault from Settings', async () => {
    render(<Dashboard onLock={() => {}} />);
    const settingsBtn = await screen.findByTitle('Cài đặt');
    fireEvent.click(settingsBtn);
    
    // In settings, there should be a back button
    // The Back button in SettingsPanel calls onBack()
    const backButton = await screen.findByTitle('Quay lại') || screen.getAllByRole('button')[0]; 
    fireEvent.click(backButton);
    
    // We should be back in Vault
    const elements = await screen.findAllByText(/Vault/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders mobile navigation bar', async () => {
    render(<Dashboard onLock={() => {}} />);
    expect(await screen.findByRole('navigation', { name: 'Mobile Navigation' })).toBeInTheDocument();
  });
});
