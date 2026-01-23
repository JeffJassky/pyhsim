import { describe, expect, it } from 'vitest';
import { minuteToLabel, toMinuteISO, rangeMinutes, snapMinute, toMinute } from '@/utils/time';

describe('time utils', () => {
  it('converts hour + minute to absolute minute', () => {
    expect(toMinute(1, 30)).toBe(90);
  });

  it('formats labels as 12h', () => {
    expect(minuteToLabel(0 as any)).toBe('12:00 AM');
    expect(minuteToLabel((9 * 60 + 5) as any)).toBe('9:05 AM');
  });

  it('snaps to grid', () => {
    expect(snapMinute(63 as any, 15)).toBe(60);
  });

  it('produces day grid', () => {
    expect(rangeMinutes(60).length).toBe(24);
  });

  it('builds ISO strings from minute offsets', () => {
    const iso = toMinuteISO(60 as any);
    const local = new Date(iso);
    expect(local.getHours() * 60 + local.getMinutes()).toBe(60);
  });
});
