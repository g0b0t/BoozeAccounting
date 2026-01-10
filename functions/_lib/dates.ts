export function formatDateKey(timestamp: number, offsetMinutes: number): string {
  const date = new Date(timestamp + offsetMinutes * 60 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function oneYearAgo(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const original = new Date(Date.UTC(year, month - 1, day));
  const targetYear = year - 1;
  const candidate = new Date(Date.UTC(targetYear, month - 1, day));
  if (candidate.getUTCMonth() !== month - 1) {
    return `${targetYear}-${String(month).padStart(2, '0')}-28`;
  }
  return `${candidate.getUTCFullYear()}-${String(candidate.getUTCMonth() + 1).padStart(2, '0')}-${String(candidate.getUTCDate()).padStart(2, '0')}`;
}
