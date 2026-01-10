import type { DrinkEntry } from '@shared/types';

export interface PendingEntry extends DrinkEntry {
  timezone_offset_minutes?: number;
}

const KEY = 'booze_pending_entries';

export function getPendingEntries(): PendingEntry[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw) as PendingEntry[];
}

export function addPendingEntry(entry: PendingEntry) {
  const list = getPendingEntries();
  list.push(entry);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearPendingEntries() {
  localStorage.removeItem(KEY);
}

export function setPendingEntries(entries: PendingEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}
