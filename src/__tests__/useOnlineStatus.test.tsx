import { describe, it, expect } from 'vitest';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { render } from '@testing-library/react';

function Probe() {
  const online = useOnlineStatus();
  return <div data-testid="status">{online ? 'online' : 'offline'}</div>;
}

describe('useOnlineStatus', () => {
  it('tracks online/offline events', async () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('status').textContent).toMatch(/online|offline/);

    window.dispatchEvent(new Event('offline'));
    expect(getByTestId('status').textContent).toBe('offline');

    window.dispatchEvent(new Event('online'));
    expect(getByTestId('status').textContent).toBe('online');
  });
});
