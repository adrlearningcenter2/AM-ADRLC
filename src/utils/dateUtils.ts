/**
 * Date and Week utilities aligned with ADR Learning Center business rules (Asia/Jakarta timezone).
 * Period runs Monday to Sunday. week_key is the Monday of the current week (YYYY-MM-DD).
 */

export function getCurrentWeekKey(): string {
  // Use Asia/Jakarta time calculation
  const now = new Date();
  const jakartaTimeString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const localDate = new Date(jakartaTimeString);

  // Compute Monday
  const day = (localDate.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  localDate.setDate(localDate.getDate() - day);

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const date = String(localDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
}

export function formatIndonesianDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatWeekLabel(weekKey: string): string {
  if (!weekKey) return '-';
  try {
    const monday = new Date(`${weekKey}T00:00:00`);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const f = (d: Date) =>
      new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);

    return `${f(monday)} – ${f(sunday)}`;
  } catch {
    return weekKey;
  }
}

export function getWeekKeysList(count: number = 8): string[] {
  const current = getCurrentWeekKey();
  const list: string[] = [current];
  const d = new Date(`${current}T00:00:00`);

  for (let i = 1; i < count; i++) {
    d.setDate(d.getDate() - 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    list.push(`${year}-${month}-${date}`);
  }

  return list;
}

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const past = new Date(dateStr.replace(' ', 'T')).getTime();
    const diffMin = Math.round((Date.now() - past) / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return formatIndonesianDate(dateStr);
  } catch {
    return dateStr;
  }
}
