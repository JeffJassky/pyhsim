import type { Minute } from '@/types';

export const MINUTES_IN_DAY = 24 * 60;

export const toMinute = (hour: number, minute: number = 0): Minute => (hour * 60 + minute) as Minute;

export const minuteToLabel = (minute: Minute) => {
  const totalHours = Math.floor(minute / 60);
  const hours12 = ((totalHours + 11) % 12) + 1;
  const meridiem = totalHours >= 12 ? 'PM' : 'AM';
  const minutes = Math.floor(minute % 60)
    .toString()
    .padStart(2, '0');
  return `${hours12}:${minutes} ${meridiem}`;
};

export const snapMinute = (minute: Minute, step: number): Minute =>
  (Math.round(minute / step) * step) as Minute;

export const rangeMinutes = (step: number, durationMinutes: number = MINUTES_IN_DAY): Minute[] => {
  const arr: Minute[] = [];
  for (let i = 0 as Minute; i < durationMinutes; i = (i + step) as Minute) {
    arr.push(i);
  }
  return arr;
};

export const minuteToISO = (minute: Minute, day = new Date()): string => {
  const date = new Date(day);
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};
