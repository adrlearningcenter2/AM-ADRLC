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

  // Already an /api/photo URL
  if (value.startsWith('/api/photo')) {
    return value;
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
  if (value.startsWith('SAFE-MODE') || value.startsWith('MOCK') || value.startsWith('SAFE_MODE')) return value;

  // 1. Matches /api/photo/:fileId or /api/photo?id=:fileId
  const apiMatch = value.match(/\/api\/photo(?:\/([a-zA-Z0-9_-]+)|\?.*?(?:id|fileId)=([a-zA-Z0-9_-]+))/i);
  if (apiMatch) {
    return apiMatch[1] || apiMatch[2] || '';
  }

  // 2. Google Drive /d/ID or ?id=ID
  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)/) || value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  // 3. Direct alphanumeric File ID
  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) {
    return value;
  }

  return '';
}

export function resolveEvidenceDriveLink(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '';
  if (value.startsWith('SAFE-MODE') || value.startsWith('MOCK') || value.startsWith('SAFE_MODE')) return '';
  const id = extractDriveFileId(value);
  return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/view?usp=sharing` : '';
}

export function resolveEvidenceDrivePreview(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '';
  if (value.startsWith('SAFE-MODE') || value.startsWith('MOCK') || value.startsWith('SAFE_MODE')) return '';
  const id = extractDriveFileId(value);
  return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : '';
}

export function getPhotoCandidateUrls(input?: string | null): string[] {
  const value = String(input || '').trim();
  if (!value) return [];
  if (/^data:image\//i.test(value) || /^blob:/i.test(value)) return [value];

  const driveId = extractDriveFileId(value);
  if (!driveId || driveId.startsWith('SAFE-MODE') || driveId.startsWith('MOCK') || driveId.startsWith('SAFE_MODE')) {
    return [resolveEvidenceUrl(value)];
  }

  // Return candidates in priority order:
  return [
    `/api/photo/${encodeURIComponent(driveId)}`,
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w1200`,
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(driveId)}`,
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(driveId)}`
  ];
}
