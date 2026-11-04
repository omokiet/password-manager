import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PrivacyOverlay from '../PrivacyOverlay';

describe('PrivacyOverlay Component', () => {
  it('renders overlay when isVisible is true', () => {
    render(<PrivacyOverlay isVisible={true} />);
    expect(screen.getByTestId('privacy-overlay')).toBeInTheDocument();
    expect(screen.getByText('Vault Protected')).toBeInTheDocument();
  });

  it('does not render overlay when isVisible is false', () => {
    render(<PrivacyOverlay isVisible={false} />);
    expect(screen.queryByTestId('privacy-overlay')).not.toBeInTheDocument();
  });
});
