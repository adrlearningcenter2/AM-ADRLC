import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRpcRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string | string[]>;
}

interface VercelRpcResponse extends ServerResponse {
  status?: (statusCode: number) => VercelRpcResponse;
  json?: (body: any) => VercelRpcResponse;
  send?: (body: any) => VercelRpcResponse;
}

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB limit
const REQUEST_TIMEOUT_MS = 45000; // 45 seconds for Apps Script processing

function sendJsonResponse(res: VercelRpcResponse, statusCode: number, data: unknown): void {
  const jsonString = JSON.stringify(data);
  const statusFn = res.status;
  const jsonFn = res.json;

  if (typeof statusFn === 'function' && typeof jsonFn === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    statusFn.call(res, statusCode);
    jsonFn.call(res, data);
    return;
  }

  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(jsonString),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(jsonString);
}

async function parseRequestBody(req: VercelRpcRequest): Promise<{ parsed: any; tooLarge?: boolean; error?: boolean }> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return { parsed: JSON.parse(req.body) };
      } catch {
        return { parsed: null, error: true };
      }
    }
    return { parsed: req.body };
  }

  return new Promise((resolve) => {
    let raw = '';
    let isAborted = false;

    req.on('data', (chunk) => {
      if (isAborted) return;
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_PAYLOAD_BYTES) {
        isAborted = true;
        resolve({ parsed: null, tooLarge: true });
      }
    });

    req.on('end', () => {
      if (isAborted) return;
      if (!raw || raw.trim() === '') {
        resolve({ parsed: {} });
        return;
      }
      try {
        resolve({ parsed: JSON.parse(raw) });
      } catch {
        resolve({ parsed: null, error: true });
      }
    });

    req.on('error', () => {
      resolve({ parsed: null, error: true });
    });
  });
}

export default async function handler(
  req: VercelRpcRequest,
  res: VercelRpcResponse
): Promise<void> {
  // 1. CORS Preflight & HTTP Method Validation
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (typeof res.status === 'function') {
      res.status(204).end();
    } else {
      res.writeHead(204);
      res.end();
    }
    return;
  }

  if (req.method !== 'POST') {
    sendJsonResponse(res, 405, {
      success: false,
      error: 'Metode HTTP tidak diizinkan. Hanya permintaan POST yang didukung.',
      code: 'METHOD_NOT_ALLOWED',
    });
    return;
  }

  // 2. Content-Length Header Check
  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    sendJsonResponse(res, 413, {
      success: false,
      error: 'Ukuran payload melebihi batas maksimum 10MB.',
      code: 'PAYLOAD_TOO_LARGE',
    });
    return;
  }

  try {
    // 3. Body Parsing & Format Validation
    const { parsed: body, tooLarge, error: jsonError } = await parseRequestBody(req);

    if (tooLarge) {
      sendJsonResponse(res, 413, {
        success: false,
        error: 'Ukuran payload melebihi batas maksimum 10MB.',
        code: 'PAYLOAD_TOO_LARGE',
      });
      return;
    }

    if (jsonError || !body || typeof body !== 'object' || Array.isArray(body)) {
      sendJsonResponse(res, 400, {
        success: false,
        error: 'Format body permintaan harus berupa JSON object yang valid.',
        code: 'INVALID_JSON_BODY',
      });
      return;
    }

    const { action, token, params } = body;

    // Validate action parameter
    if (!action || typeof action !== 'string' || !action.trim()) {
      sendJsonResponse(res, 400, {
        success: false,
        error: 'Parameter "action" wajib disertakan pada permintaan RPC.',
        code: 'MISSING_ACTION',
      });
      return;
    }

    // Validate params parameter (must be undefined, null, or a plain object)
    if (params !== undefined && params !== null) {
      if (typeof params !== 'object' || Array.isArray(params)) {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'Parameter "params" harus berupa objek biasa (plain object), bukan array atau null.',
          code: 'INVALID_PARAMS',
        });
        return;
      }
    }

    // 4. Server-Side Secret & Proxy Auth Validation (Fail-Closed)
    // NEVER accept proxy secret from client; read strictly from server environment variables.
    const proxySecret = process.env.ADR_PROXY_SECRET || process.env.GAS_PROXY_SECRET || '';
    const requireProxyAuth = process.env.REQUIRE_PROXY_AUTH === 'true';

    if (!requireProxyAuth) {
      sendJsonResponse(res, 503, {
        success: false,
        error: 'Autentikasi proxy belum diaktifkan (REQUIRE_PROXY_AUTH harus bernilai "true").',
        code: 'PROXY_AUTH_REQUIRED',
      });
      return;
    }

    if (!proxySecret) {
      sendJsonResponse(res, 403, {
        success: false,
        error: 'Akses ditolak: ADR_PROXY_SECRET belum dikonfigurasi pada environment server Vercel (fail-closed).',
        code: 'PROXY_AUTH_UNCONFIGURED',
      });
      return;
    }

    // 5. Target Endpoint Resolution
    // NEVER accept targetUrl, x-gas-target-url, or user-supplied URLs to prevent SSRF.
    // Strictly use GAS_WEB_APP_URL configured in server environment variables.
    const gasUrl = (process.env.GAS_WEB_APP_URL || '').trim();

    if (!gasUrl || !gasUrl.startsWith('https://script.google.com/')) {
      sendJsonResponse(res, 503, {
        success: false,
        code: 'BACKEND_NOT_CONFIGURED',
        message: 'GAS_NOT_CONFIGURED',
        error: 'Endpoint Google Apps Script (GAS_WEB_APP_URL) belum dikonfigurasi pada environment server Vercel.',
        action: action.trim(),
        safeMode: true,
      });
      return;
    }

    // 6. Forward Request Server-to-Server to Google Apps Script
    const forwardPayload = {
      action: action.trim(),
      token: token ? String(token).trim() : '',
      params: params || {},
      proxySecret,
    };

    const abortController = new AbortController();
    const timeoutTimer = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

    try {
      const gasResponse = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forwardPayload),
        signal: abortController.signal,
      });

      clearTimeout(timeoutTimer);

      if (!gasResponse.ok) {
        sendJsonResponse(res, gasResponse.status, {
          success: false,
          error: `Koneksi Google Apps Script gagal dengan status HTTP ${gasResponse.status}`,
          code: 'GAS_HTTP_ERROR',
          status: gasResponse.status,
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

        sendJsonResponse(res, 502, {
          success: false,
          error: diagnosticMsg,
          code: 'HTML_RESPONSE_RECEIVED',
          status: gasResponse.status,
        });
        return;
      }

      let gasJson: unknown;
      try {
        gasJson = await gasResponse.json();
      } catch {
        sendJsonResponse(res, 502, {
          success: false,
          error: 'Respons dari Google Apps Script tidak dapat dibaca sebagai format JSON yang valid.',
          code: 'INVALID_JSON_RESPONSE',
        });
        return;
      }

      sendJsonResponse(res, 200, gasJson);
    } catch (networkErr: any) {
      clearTimeout(timeoutTimer);
      const isTimeout = networkErr?.name === 'AbortError';
      sendJsonResponse(res, isTimeout ? 504 : 502, {
        success: false,
        error: isTimeout
          ? 'Permintaan ke Google Apps Script melebihi batas waktu 45 detik (Gateway Timeout).'
          : `Gagal menghubungi endpoint Google Apps Script: ${networkErr?.message || networkErr}`,
        code: isTimeout ? 'GATEWAY_TIMEOUT' : 'UPSTREAM_ERROR',
      });
    }
  } catch (internalErr: any) {
    sendJsonResponse(res, 500, {
      success: false,
      error: 'Terjadi kesalahan internal pada Serverless Function proxy.',
      code: 'INTERNAL_ERROR',
    });
  }
}
