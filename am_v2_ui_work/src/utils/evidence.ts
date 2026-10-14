/** Normalize Google Drive file IDs and links into image preview URLs. */
export function resolveEvidenceUrl(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '';
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(value)) return value;
  if (/^blob:/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      if (host === 'drive.google.com' || host === 'docs.google.com') {
        const id = url.searchParams.get('id') || url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
        if (id) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`;
      }
      return url.protocol === 'https:' ? url.href : '';
    } catch { return ''; }
  }
  if (/^[a-zA-Z0-9_-]{15,}$/.test(value)) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(value)}&sz=w1600`;
  }
  return '';
}

export function resolveEvidenceDriveLink(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '';
  const id = value.match(/^[a-zA-Z0-9_-]{15,}$/)?.[0] || value.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] || (value.includes('drive.google.com') ? new URL(value).searchParams.get('id') : null);
  return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/view` : '';
}
