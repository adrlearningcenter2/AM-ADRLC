function isAppEntityId(id: string): boolean {
  return /^(UNT|CHK|INSP|FND|ROOM|USR|UNIT|ASSET|POINT)-/i.test(id);
}

/**
 * Normalize Google Drive file IDs, historical V1/V2 records, and links
 * into secure preview URLs served via server-side authenticated proxy.
 */
export function resolveEvidenceUrl(input?: string | null): string {
  let value = String(input || '').trim();
  if (!value || value === 'null' || value === 'undefined' || value === '-') return '';

  // Fix unencoded SVG data URIs for iOS Safari and Android Chrome compatibility
  if (value.startsWith('data:image/svg+xml;utf8,<svg') || value.startsWith('data:image/svg+xml;utf8,%3Csvg')) {
    const rawSvg = value.replace(/^data:image\/svg\+xml;utf8,/i, '');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(decodeURIComponent(rawSvg))}`;
  }

  if (/^data:image\//i.test(value)) return value;
  if (/^blob:/i.test(value)) return value;

  // Safe mode or mock placeholders
  if (value.startsWith('SAFE-MODE') || value.startsWith('MOCK') || value.startsWith('SAFE_MODE')) {
    return `/api/photo/${encodeURIComponent(value)}`;
  }

  // Reject internal entity identifiers (e.g. UNT-RT1-01, UNIT-0002, CHK-...)
  if (isAppEntityId(value)) {
    return '';
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
        if (id && !isAppEntityId(id)) return `/api/photo/${encodeURIComponent(id)}`;
      }
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  // Pure alphanumeric Drive File ID (typically 20+ chars, e.g. 1a2B3c4D...)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(value) && !isAppEntityId(value)) {
    return `/api/photo/${encodeURIComponent(value)}`;
  }

  return '';
}

export function extractDriveFileId(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '';
  if (value.startsWith('SAFE-MODE') || value.startsWith('MOCK') || value.startsWith('SAFE_MODE')) return value;
  if (isAppEntityId(value)) return '';

  // 1. Matches /api/photo/:fileId or /api/photo?id=:fileId
  const apiMatch = value.match(/\/api\/photo(?:\/([a-zA-Z0-9_-]+)|\?.*?(?:id|fileId)=([a-zA-Z0-9_-]+))/i);
  if (apiMatch) {
    const candidate = apiMatch[1] || apiMatch[2] || '';
    return isAppEntityId(candidate) ? '' : candidate;
  }

  // 2. Google Drive /d/ID or ?id=ID
  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)/) || value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    const candidate = match[1];
    return isAppEntityId(candidate) ? '' : candidate;
  }

  // 3. Direct alphanumeric File ID (typical Drive IDs are 20+ chars)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(value) && !isAppEntityId(value)) {
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
