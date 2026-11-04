import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HealthDashboard from '../HealthDashboard';
import { PasswordEntry } from '../../types';

describe('HealthDashboard Component', () => {
  it('correctly calculates old entries using seconds timestamp', () => {
    const currentSeconds = Math.floor(Date.now() / 1000);
    const ninetyOneDaysInSeconds = 91 * 24 * 60 * 60;

    const entries: PasswordEntry[] = [
      {
        id: '1',
        title: 'Recent Entry',
        username: 'user1',
        password: 'StrongPassword123!',
        url: '',
        notes: '',
        category: 'Work',
        created_at: currentSeconds,
        updated_at: currentSeconds, // vừa cập nhật
      },
      {
        id: '2',
        title: 'Old Entry',
        username: 'user2',
        password: 'AnotherStrongPwd456!',
        url: '',
        notes: '',
        category: 'Personal',
        created_at: currentSeconds - ninetyOneDaysInSeconds,
        updated_at: currentSeconds - ninetyOneDaysInSeconds, // > 90 ngày
      },
    ];

    render(
      <HealthDashboard
        entries={entries}
        onBack={() => {}}
        onHome={() => {}}
      />
    );

    // Old entries counter should only be 1, not 2
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Cũ (>90 ngày)')).toBeInTheDocument();
  });

  it('awards 100% score when all entries are fresh, strong, and unique', () => {
    const currentSeconds = Math.floor(Date.now() / 1000);
    const entries: PasswordEntry[] = [
      {
        id: '1',
        title: 'Entry 1',
        username: 'user1',
        password: 'SuperStrongPassword123!',
        url: '',
        notes: '',
        category: 'Work',
        created_at: currentSeconds,
        updated_at: currentSeconds,
      },
    ];

    render(
      <HealthDashboard
        entries={entries}
        onBack={() => {}}
        onHome={() => {}}
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Tuyệt vời!')).toBeInTheDocument();
  });
});

