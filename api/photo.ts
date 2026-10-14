import type { IncomingMessage, ServerResponse } from 'http';

interface VercelPhotoRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
}

interface VercelPhotoResponse extends ServerResponse {
  status?: (statusCode: number) => VercelPhotoResponse;
  send?: (body: any) => VercelPhotoResponse;
}

function createSvgNotice(title: string, subtitle: string, detail?: string): string {
  const safeTitle = (title || '').replace(/[<>&"]/g, '');
  const safeSubtitle = (subtitle || '').replace(/[<>&"]/g, '');
  const safeDetail = (detail || '').replace(/[<>&"]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#1c1917" rx="16"/>
    <rect x="20" y="20" width="560" height="360" fill="none" stroke="#44403c" stroke-width="2" stroke-dasharray="6,6" rx="12"/>
    <circle cx="300" cy="140" r="44" fill="#292524" stroke="#78716c" stroke-width="2"/>
    <path d="M282 135h36M300 117v36" fill="none" stroke="#a8a29e" stroke-width="3" stroke-linecap="round"/>
    <text x="300" y="220" text-anchor="middle" fill="#f5f5f4" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold">${safeTitle}</text>
    <text x="300" y="250" text-anchor="middle" fill="#d6d3d1" font-family="system-ui, -apple-system, sans-serif" font-size="14">${safeSubtitle}</text>
    ${safeDetail ? `<text x="300" y="280" text-anchor="middle" fill="#a8a29e" font-family="system-ui, -apple-system, sans-serif" font-size="12">${safeDetail}</text>` : ''}
    <text x="300" y="340" text-anchor="middle" fill="#78716c" font-family="system-ui, -apple-system, sans-serif" font-size="11">AM Digital ADR V2 · ADR Learning Center</text>
  </svg>`;
}

export default async function handler(
  req: VercelPhotoRequest,
  res: VercelPhotoResponse
): Promise<void> {
  const sendSvg = (title: string, subtitle: string, detail?: string, statusCode = 200) => {
    const svg = createSvgNotice(title, subtitle, detail);
    res.writeHead(statusCode, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(svg);
  };

  try {
    // 1. Extract file ID from query or URL
    const urlObj = new URL(req.url || '/', 'http://localhost');
    const queryId = req.query?.fileId || req.query?.id || urlObj.searchParams.get('fileId') || urlObj.searchParams.get('id') || '';
    let rawId = String(queryId).trim();

    if (!rawId) {
      // Path extraction e.g. /api/photo/FILE_ID
      const match = (req.url || '').match(/\/api\/photo(?:\/([a-zA-Z0-9_-]+))/);
      if (match) rawId = match[1];
    }

    const cleanId = decodeURIComponent(rawId).trim();

    if (!cleanId || cleanId === 'null' || cleanId === 'undefined' || cleanId === '-') {
      sendSvg('Foto Tidak Dilampirkan', 'Tidak ada file bukti foto untuk temuan ini.');
      return;
    }

    // 2. Handle Base64 Data URL directly
    if (cleanId.startsWith('data:image/')) {
      const matches = cleanId.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.writeHead(200, {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(buffer);
        return;
      }
    }

    // 3. Handle Safe Mode or Mock File ID
    if (cleanId.startsWith('SAFE-MODE') || cleanId.startsWith('MOCK') || cleanId.startsWith('SAFE_MODE')) {
      sendSvg('Dokumentasi Mode Simulasi', 'Foto tercatat dalam Safe Mode backend', `ID: ${cleanId}`);
      return;
    }

    // 4. Extract pure Google Drive File ID if given a full URL
    let fileId = cleanId;
    const driveMatch = fileId.match(/\/d\/([a-zA-Z0-9_-]+)/) || fileId.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      fileId = driveMatch[1];
    }

    // 5. Try public Google Drive thumbnail endpoint
    try {
      const thumbUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
      const googleRes = await fetch(thumbUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      const cType = googleRes.headers.get('content-type') || '';
      if (googleRes.ok && cType.startsWith('image/')) {
        const arrayBuffer = await googleRes.arrayBuffer();
        res.writeHead(200, {
          'Content-Type': cType,
          'Cache-Control': 'public, max-age=3600',
        });
        res.end(Buffer.from(arrayBuffer));
        return;
      }
    } catch {
      // Continue to next fallback
    }

    // 6. Try Google Drive lh3 CDN endpoint
    try {
      const lh3Url = `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`;
      const lh3Res = await fetch(lh3Url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      const lh3Type = lh3Res.headers.get('content-type') || '';
      if (lh3Res.ok && lh3Type.startsWith('image/')) {
        const arrayBuffer = await lh3Res.arrayBuffer();
        res.writeHead(200, {
          'Content-Type': lh3Type,
          'Cache-Control': 'public, max-age=3600',
        });
        res.end(Buffer.from(arrayBuffer));
        return;
      }
    } catch {
      // Continue to GAS
    }

    // 7. Authenticated Google Apps Script Fallback (for private files)
    const gasUrl = process.env.GAS_WEB_APP_URL || '';
    const proxySecret = process.env.ADR_PROXY_SECRET || process.env.GAS_PROXY_SECRET || '';

    if (gasUrl && gasUrl.startsWith('https://script.google.com/')) {
      try {
        const gasRes = await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Proxy-Secret': proxySecret,
          },
          body: JSON.stringify({
            action: 'getPhoto',
            params: { fileId },
            proxySecret,
          }),
        });

        if (gasRes.ok) {
          const text = await gasRes.text();
          try {
            const json = JSON.parse(text);
            if (json && json.success && json.base64 && typeof json.base64 === 'string') {
              const parts = json.base64.split('base64,');
              const mime = json.mimeType || (json.base64.match(/^data:([^;]+);/)?.[1] || 'image/jpeg');
              const buffer = Buffer.from(parts[parts.length - 1], 'base64');
              res.writeHead(200, {
                'Content-Type': mime,
                'Cache-Control': 'public, max-age=86400',
              });
              res.end(buffer);
              return;
            }
          } catch {
            // Not JSON
          }
        }
      } catch {
        // Fallback
      }
    }

    // 8. Always return clean SVG notice with HTTP 200 OK so mobile browsers (iOS Safari/Android) render it cleanly
    sendSvg('Foto Tersimpan di Google Drive', 'Akses privat atau file memerlukan izin login akun Google', `ID: ${fileId}`, 200);
  } catch (err) {
    sendSvg('Foto Tidak Dapat Dimuat', 'Terjadi kendala saat membaca file gambar', '', 200);
  }
}
