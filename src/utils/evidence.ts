/**
 * Normalize Google Drive file IDs, historical V1/V2 records, and links
 * into secure preview URLs served via server-side authenticated proxy.
 */
export function resolveEvidenceUrl(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value || value === 'null' || value === 'undefined' || value === '-') return '';
  if (/^data:image\//i.test(value)) return value;
  if (/^blob:/i.test(value)) return value;

  // Safe mode or mock placeholders
  if (value.startsWith('SAFE-MODE') || value.startsWith('MOCK') || value.startsWith('SAFE_MODE')) {
    return `/api/photo/${encodeURIComponent(value)}`;
  }

  // Google Drive URL handling
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      if (host === 'drive.google.com' || host === 'docs.google.com') {
        const id = url.searchParams.get('id') || url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
        if (id) return `/api/photo/${encodeURIComponent(id)}`;
      }
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  // Pure alphanumeric Drive File ID
  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) {
    return `/api/photo/${encodeURIComponent(value)}`;
  }

  return '';
}

export function extractDriveFileId(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '';
  if (value.startsWith('SAFE-MODE') || value.startsWith('MOCK')) return value;
  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)/) || value.match(/[?&]id=([a-zA-Z0-9_-]+)/) || value.match(/^[a-zA-Z0-9_-]{15,}$/);
  return match ? (match[1] || match[0]) : '';
}

export function resolveEvidenceDriveLink(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '';
  if (value.startsWith('SAFE-MODE') || value.startsWith('MOCK')) return '';
  const id = extractDriveFileId(value);
  return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/view` : '';
}
