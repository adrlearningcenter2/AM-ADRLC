/**
 * AM Digital ADR V2 - Server-Side Intermediary & Development Server
 * 
 * Functions:
 * 1. Secure API Proxy (/api/rpc): Forwards calls from React to Google Apps Script Web App.
 *    Keeps server secrets safe, eliminates browser CORS restrictions, and enforces rate limits.
 * 2. Static File Serving (Production) & Vite Middlewares (Development).
 * 3. Health & Diagnostic Endpoint (/api/health).
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// 1. Strict Request Body Size Limit (10MB max to prevent memory exhaustion)
app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------------
// In-Memory Sliding Rate Limiter
// ---------------------------------------------------------------------------
interface RateRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateRecord>();

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${clientIp}:${req.baseUrl || ''}${req.path}`;
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        success: false,
        error: 'Terlalu banyak permintaan (Rate limit exceeded). Harap tunggu beberapa saat sebelum mencoba kembali.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: retryAfterSec,
      });
      return;
    }

    next();
  };
}

// Periodic cleanup to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

// ---------------------------------------------------------------------------
// Health Check Endpoint (Public Service Availability - No Sensitive Leakage)
// ---------------------------------------------------------------------------
app.get(
  '/api/health',
  createRateLimiter(60, 60000), // Max 60 health checks / minute
  (_req: Request, res: Response) => {
    res.json({
      status: 'ONLINE',
      app: 'AM Digital ADR V2 Proxy',
      timestamp: new Date().toISOString(),
      gasConfigured: Boolean(process.env.GAS_WEB_APP_URL),
      safeMode: true,
      proxyAuthRequired: process.env.REQUIRE_PROXY_AUTH === 'true',
    });
  }
);

// ---------------------------------------------------------------------------
// Secure Proxy Endpoint (/api/rpc)
// ---------------------------------------------------------------------------
app.post(
  '/api/rpc',
  createRateLimiter(120, 60000), // Max 120 RPC requests / minute per client
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { action, token, params, targetUrl } = req.body;

      if (!action || typeof action !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Parameter "action" wajib disertakan pada permintaan RPC.',
          code: 'MISSING_ACTION',
        });
        return;
      }

      // Validate params: must be a plain object, not an array, not null
      if (params !== undefined && params !== null) {
        if (typeof params !== 'object' || Array.isArray(params)) {
          res.status(400).json({
            success: false,
            error: 'Parameter "params" harus berupa objek biasa (plain object), bukan array atau null.',
            code: 'INVALID_PARAMS',
          });
          return;
        }
      }

      const headerToken = req.headers.authorization
        ? req.headers.authorization.replace(/^Bearer\s+/i, '').trim()
        : (((req.headers['x-adr-token'] || req.headers['x-auth-token']) as string)?.trim() || '');

      const effectiveToken = (token && String(token).trim()) || headerToken || '';

      const clientSecret =
        (((req.headers['x-proxy-secret'] || req.headers['x-adr-secret']) as string)?.trim() ||
        (req.body.proxySecret ? String(req.body.proxySecret).trim() : ''));

      // Fail-closed server-to-server shared secret (ZERO hardcoded fallback secrets in source code)
      const proxySecret = clientSecret || process.env.ADR_PROXY_SECRET || process.env.GAS_PROXY_SECRET || '';
      const requireProxyAuth = process.env.REQUIRE_PROXY_AUTH === 'true';
      if (!requireProxyAuth) { res.status(503).json({success:false,code:'PROXY_AUTH_REQUIRED',error:'Autentikasi proxy belum diaktifkan.'}); return; }

      if (requireProxyAuth && !proxySecret) {
        res.status(403).json({
          success: false,
          error: 'Akses ditolak: ADR_PROXY_SECRET belum dikonfigurasi pada server environment atau request headers (fail-closed).',
          code: 'PROXY_AUTH_UNCONFIGURED',
        });
        return;
      }

      const headerTargetUrl = (((req.headers['x-gas-target-url'] || req.headers['x-gas-url']) as string)?.trim() || '');
      const rawGasUrl =
        (typeof targetUrl === 'string' && targetUrl.trim()) ||
        headerTargetUrl ||
        process.env.GAS_WEB_APP_URL || '';

      // Normalize Google Apps Script Web App URL
      let gasUrl = rawGasUrl.trim();
      if (gasUrl.includes('script.google.com/macros/s/')) {
        // Replace /edit with /exec
        gasUrl = gasUrl.replace(/\/edit(\?.*)?$/, '/exec$1');
        // Ensure /exec suffix
        if (!gasUrl.includes('/exec')) {
          gasUrl = gasUrl.replace(/\/+$/, '') + '/exec';
        }
      }

      // If Google Apps Script Web App URL is configured, securely proxy request
      if (gasUrl && gasUrl.startsWith('https://script.google.com/')) {
        const payload = {
          action: action.trim(),
          token: effectiveToken,
          params: params || {},
          proxySecret,
        };

        const forwardHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        if (effectiveToken) {
          forwardHeaders['Authorization'] = `Bearer ${effectiveToken}`;
          forwardHeaders['X-ADR-Token'] = effectiveToken;
        }
        if (proxySecret) {
          forwardHeaders['X-Proxy-Secret'] = proxySecret;
          forwardHeaders['X-ADR-Secret'] = proxySecret;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000); // 45s for GAS file uploads

        try {
          const gasResponse = await fetch(gasUrl, {
            method: 'POST',
            headers: forwardHeaders,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!gasResponse.ok) {
            res.status(gasResponse.status).json({
              success: false,
              error: `Koneksi Google Apps Script gagal dengan status HTTP ${gasResponse.status}`,
              code: 'GAS_HTTP_ERROR',
            });
            return;
          }

          const contentType = gasResponse.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            const htmlText = await gasResponse.text();
            let diagnosticMsg = 'Endpoint Google Apps Script mengembalikan halaman web HTML, bukan output JSON API.';
            if (
              htmlText.includes('doPost') ||
              htmlText.includes('找不到以下指令碼函式') ||
              htmlText.includes('Script function not found')
            ) {
              diagnosticMsg =
                'Endpoint Google Apps Script belum memiliki fungsi doPost (Web App masih versi V1 lama atau file gas-backend/Code.gs belum di-deploy). Harap salin file dari folder gas-backend/ ke Google Apps Script di spreadsheet Anda, lalu lakukan "New deployment" sebagai Web App dengan akses "Anyone".';
            } else if (htmlText.includes('sandboxFrame') || htmlText.includes('AM Digital ADR')) {
              diagnosticMsg =
                'Endpoint saat ini masih menjalankan antarmuka V1 (HtmlService). Harap deploy kode backend V2 (gas-backend/Code.gs) sebagai versi Web App baru dengan akses "Anyone".';
            } else if (htmlText.includes('accounts.google.com') || htmlText.includes('Sign in')) {
              diagnosticMsg =
                'Endpoint memerlukan login akun Google. Pastikan setelan deployment Web App: "Execute as: Me" dan "Who has access: Anyone".';
            } else if (
              htmlText.includes('很抱歉，目前無法開啟這個檔案') ||
              htmlText.includes('Sorry, unable to open the file') ||
              htmlText.includes('404')
            ) {
              diagnosticMsg =
                'File Google Apps Script tidak dapat dibuka atau URL tidak valid (404). Periksa kembali URL deployment Web App.';
            }
            res.status(502).json({
              success: false,
              error: diagnosticMsg,
              code: 'HTML_RESPONSE_RECEIVED',
              status: gasResponse.status,
            });
            return;
          }

          const gasJson = await gasResponse.json();
          res.json(gasJson);
          return;
        } catch (gasErr: any) {
          clearTimeout(timeout);
          res.status(502).json({
            success: false,
            error: `Gagal menghubungi endpoint Google Apps Script: ${gasErr.message || gasErr}`,
            code: 'GATEWAY_TIMEOUT',
          });
          return;
        }
      }

      // Fallback info when GAS_WEB_APP_URL is not yet defined in .env
      res.status(503).json({
        success: false,
        code: 'BACKEND_NOT_CONFIGURED',
        message: 'GAS_NOT_CONFIGURED',
        note: 'Endpoint server-side /api/rpc aktif. Konfigurasikan GAS_WEB_APP_URL pada environment server atau menu pengaturan frontend untuk menghubungkan Google Apps Script produksi.',
        action,
        safeMode: true,
      });
    } catch (err: any) {
      console.error('API Proxy Error:', err);
      res.status(500).json({
        success: false,
        error: 'Terjadi kesalahan internal pada server proxy.',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Vite Dev Middleware or Production Static Serving
// ---------------------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AM Digital ADR V2] Server aktif di port ${PORT}`);
  });
}

startServer();
