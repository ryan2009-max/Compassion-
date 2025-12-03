import { describe, it, expect } from 'vitest';
import { shouldShowFilesDiv } from '@/pages/admin/AdminDashboard';

describe('Uploaded Files visibility', () => {
  it('hides files for Health Records when role is admin', () => {
    expect(shouldShowFilesDiv('Health Records', 'admin')).toBe(false);
  });

  it('shows files for Health Records when role is super-admin', () => {
    expect(shouldShowFilesDiv('Health Records', 'super-admin')).toBe(true);
  });

  it('shows files for non-health categories regardless of role', () => {
    expect(shouldShowFilesDiv('Background Information', 'admin')).toBe(true);
    expect(shouldShowFilesDiv('Background Information', 'super-admin')).toBe(true);
  });
});
