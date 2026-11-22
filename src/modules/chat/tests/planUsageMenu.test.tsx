import { describe, expect, it } from 'vitest';

import { formatPlanReset } from '@/modules/chat/composer/PlanUsageMenu';

describe('formatPlanReset', () => {
  const now = new Date(2026, 10, 23, 10, 0);

  it('shows only the clock for a reset later today', () => {
    expect(formatPlanReset(new Date(2026, 10, 23, 6, 5).toISOString(), now)).toBe('06:05');
  });

  it('adds the weekday for a reset on another day', () => {
    const text = formatPlanReset(new Date(2026, 10, 29, 9, 0).toISOString(), now);
    expect(text.endsWith(' 09:00')).toBe(true);
    expect(text.length).toBeGreaterThan(6);
  });

  it('returns nothing for a bad date', () => {
    expect(formatPlanReset('not a date', now)).toBe('');
  });
});
