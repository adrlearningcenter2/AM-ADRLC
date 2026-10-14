/**
 * AM Digital ADR V2 - Web App Entry Point & Router
 * Google Apps Script HTTP Endpoint (doPost & doGet)
 * 
 * FINAL SECURITY HARDENING:
 * 1. PROXY AUTHENTICATION (FAIL-CLOSED):
 *    - When REQUIRE_PROXY_AUTH is true, ADR_PROXY_SECRET must exist in Script Properties.
 *    - If missing or mismatched, all POST requests are rejected immediately.
 *    - Zero fallback secrets in source code.
 * 2. SAFE MODE CENTRAL WRITE GUARD:
 *    - Governed exclusively by CONFIG.SAFE_MODE (boolean).
 *    - Mutations (saveInspection, markCoordinated, addFollowup, closeFinding, submitRequest, decideRequest)
 *      are validated but blocked from modifying Google Sheets, Google Drive, or Audit sheet.
 *    - When blocked, returns success:false and code:WRITE_BLOCKED_BY_SAFE_MODE.
 * 3. SANITIZED ERROR HANDLING & AUDITING:
 *    - Raw internal stack traces and class names are logged strictly in server Logger.log.
 *    - Response contains structured error code, user-friendly message, and unique errorId.
 * 4. STRICT PARAMETER & ROLE VALIDATION:
 *    - params must be a plain object (not null, not array).
 *    - Authentication tokens are validated for all non-public endpoints.
 *    - checkDatabase is strictly authenticated and restricted to ADMIN role.
 *    - Audit trail retrieval is capped at max 100 records.
 */

// Actions that mutate state
var MUTATION_ACTIONS = [
  'saveInspection',
  'markCoordinated',
  'addFollowup',
  'closeFinding',
  'submitRequest',
  'decideRequest'
];

// Public actions that do not require an active session token
var PUBLIC_ACTIONS = [
  'ping',
  'health',
  'login'
];

/**
 * Public Health Check Endpoint (GET)
 * Minimal high-level service status; strictly zero exposure of internal spreadsheet IDs or credentials.
 */
function doGet(e) {
  var response = {
    success: true,
    data: {
      status: 'ONLINE',
      app: 'AM Digital ADR V2 API Gateway',
      safeMode: !!CONFIG.SAFE_MODE,
      version: '2.0.0',
      serverTime: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')
    }
  };
  return createJsonResponse(response);
}

/**
 * JSON-RPC Router Endpoint (POST)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      var emptyErr = new Error('Permintaan tidak valid: Payload POST kosong.');
      emptyErr.code = 'EMPTY_PAYLOAD';
      throw emptyErr;
    }

    var body = null;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      var jsonErr = new Error('Format JSON payload tidak valid.');
      jsonErr.code = 'INVALID_JSON';
      throw jsonErr;
    }

    var action = String(body.action || '').trim();
    if (!action) {
      var actErr = new Error('Parameter "action" wajib disertakan.');
      actErr.code = 'MISSING_ACTION';
      throw actErr;
    }

    // 1. STRICT VALIDATION: Params must be a plain object, not array, not null
    if (body.params !== undefined && body.params !== null) {
      if (typeof body.params !== 'object' || Array.isArray(body.params)) {
        var paramErr = new Error('Parameter "params" harus berupa JSON object yang valid, bukan array atau null.');
        paramErr.code = 'INVALID_PARAMS';
        throw paramErr;
      }
    }
    var params = (body.params && typeof body.params === 'object' && !Array.isArray(body.params)) ? body.params : {};

    var token = String(body.token || '').trim();

    // 2. PROXY AUTHENTICATION (FAIL-CLOSED)
    // When enabled, requires matching shared secret between proxy and GAS from Script Properties
    if (CONFIG.REQUIRE_PROXY_AUTH === true) {
      var configuredSecret = PropertiesService.getScriptProperties().getProperty('ADR_PROXY_SECRET');
      if (!configuredSecret || !configuredSecret.trim()) {
        var unconfErr = new Error('Akses ditolak: ADR_PROXY_SECRET belum dikonfigurasi pada Script Properties (fail-closed).');
        unconfErr.code = 'PROXY_AUTH_UNCONFIGURED';
        throw unconfErr;
      }
      var incomingSecret = String(body.proxySecret || (e.parameter && e.parameter.proxySecret) || '').trim();
      if (incomingSecret !== configuredSecret.trim()) {
        var matchErr = new Error('Akses ditolak: Kredensial server-to-server tidak valid.');
        matchErr.code = 'PROXY_AUTH_FAILED';
        throw matchErr;
      }
    }

    // 3. TOKEN VALIDATION FOR AUTHENTICATED ENDPOINTS
    if (PUBLIC_ACTIONS.indexOf(action) === -1) {
      if (!token) {
        var tokErr = new Error('Akses ditolak: Token autentikasi wajib disertakan.');
        tokErr.code = 'UNAUTHORIZED';
        throw tokErr;
      }
    }

    // 4. CENTRALIZED WRITE GUARD LOGGING
    var isMutation = MUTATION_ACTIONS.indexOf(action) !== -1;
    if (isMutation && CONFIG.SAFE_MODE === true) {
      Logger.log('[CENTRAL_WRITE_GUARD] Action "' + action + '" invoked under Safe Mode. Verifying validation before write suppression.');
    }

    var resultData = null;

    switch (action) {
      // ----------------------------------------------------------------------
      // PUBLIC & DIAGNOSTIC ENDPOINTS
      // ----------------------------------------------------------------------
      case 'ping':
      case 'health':
        resultData = {
          status: 'ONLINE',
          app: 'AM Digital ADR V2 API Gateway',
          safeMode: !!CONFIG.SAFE_MODE,
          serverTime: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')
        };
        break;

      // ----------------------------------------------------------------------
      // AUTHENTICATED DATABASE CONNECTIVITY CHECK (ADMIN ONLY)
      // ----------------------------------------------------------------------
      case 'checkDatabase':
        // Strictly read-only verification of SpreadsheetApp and required sheets
        AuthService.validateSession(token, ['ADMIN']);
        resultData = InspectionService.checkDatabaseConnectivity(token);
        break;

      // ----------------------------------------------------------------------
      // AUTHENTICATION
      // ----------------------------------------------------------------------
      case 'login':
        resultData = AuthService.login(params.nip, params.password);
        break;

      case 'logout':
        resultData = AuthService.logout(token);
        break;

      // ----------------------------------------------------------------------
      // OVERVIEW & ROOM INSPECTIONS
      // ----------------------------------------------------------------------
      case 'getOverview':
        resultData = InspectionService.getOverview(token, params.weekKey);
        break;

      case 'getRooms':
        resultData = InspectionService.getRooms(token);
        break;

      case 'getRoomDetails':
        resultData = InspectionService.getRoomDetails(token, params.room, params.weekKey);
        break;

      case 'getInspections':
        resultData = InspectionService.getInspections(token, params);
        break;

      case 'saveInspection':
        resultData = InspectionService.saveInspection(token, params.payload || params);
        break;

      // ----------------------------------------------------------------------
      // FINDINGS & FOLLOWUPS
      // ----------------------------------------------------------------------
      case 'getFindings':
        resultData = InspectionService.getFindings(token, params);
        break;

      case 'markCoordinated':
        resultData = InspectionService.markCoordinated(token, params.findingId, params.note, params.picNip);
        break;

      case 'getFollowups':
        resultData = InspectionService.getFollowups(token, params.findingId);
        break;

      case 'addFollowup':
        resultData = InspectionService.addFollowup(token, params.findingId, params.note);
        break;

      case 'closeFinding':
        resultData = InspectionService.closeFinding(token, params.findingId, params.note, params.photo);
        break;

      // ----------------------------------------------------------------------
      // REQUESTS (DISPENSATIONS & APPROVALS)
      // ----------------------------------------------------------------------
      case 'getRequests':
        resultData = InspectionService.getRequests(token, params);
        break;

      case 'submitRequest':
        resultData = InspectionService.submitRequest(token, params.payload || params);
        break;

      case 'decideRequest':
        resultData = InspectionService.decideRequest(token, params.requestId, params.decision, params.reviewNote);
        break;

      // ----------------------------------------------------------------------
      // MANAGEMENT REPORTS & AUDIT TRAIL
      // ----------------------------------------------------------------------
      case 'getReports':
        resultData = InspectionService.getReports(token, params.month, params.year);
        break;

      case 'getAuditTrail':
        AuthService.validateSession(token, ['ADMIN']);
        var requestedLimit = Number(params.limit) || 50;
        var safeLimit = Math.min(Math.max(1, requestedLimit), 100);
        resultData = { logs: AuditService.getLogs(safeLimit) };
        break;

      default:
        var unkErr = new Error('Aksi API "' + action + '" tidak dikenali.');
        unkErr.code = 'ACTION_NOT_FOUND';
        throw unkErr;
    }

    // 5. CENTRALIZED SAFE MODE RESPONSE ENFORCEMENT
    // If Safe Mode blocked the mutation, ALWAYS return success: false and code: WRITE_BLOCKED_BY_SAFE_MODE
    var isSafeModeBlocked = (isMutation && CONFIG.SAFE_MODE === true) || (resultData && resultData.code === 'WRITE_BLOCKED_BY_SAFE_MODE');

    if (isSafeModeBlocked) {
      return createJsonResponse({
        success: false,
        code: 'WRITE_BLOCKED_BY_SAFE_MODE',
        error: (resultData && resultData.message) || 'Operasi penulisan diblokir karena Safe Mode backend aktif (database produksi terlindungi).',
        safeMode: true,
        data: resultData,
        timestamp: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')
      });
    }

    return createJsonResponse({
      success: true,
      safeMode: !!CONFIG.SAFE_MODE,
      code: 'OK',
      data: resultData,
      timestamp: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')
    });

  } catch (err) {
    // Generate unique Error ID for correlation with server logs
    var errorId = 'ERR-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMddHHmmss') + '-' + Utilities.getUuid().substring(0, 6);

    // Log full error stack ONLY to Google Apps Script internal execution logger
    Logger.log('[SERVER_ERROR][' + errorId + '] ' + (err.stack || err.toString()));

    var structuredCode = err.code || 'API_ERROR';
    var rawMessage = err.message || 'Terjadi kesalahan pada pemrosesan server.';
    
    // Mask internal mechanics, class names, or code paths from frontend exposure
    var userFriendlyMessage = 'Terjadi kesalahan saat memproses permintaan.';
    if (structuredCode === 'PROXY_AUTH_UNCONFIGURED' || structuredCode === 'PROXY_AUTH_FAILED') {
      userFriendlyMessage = rawMessage;
    } else if (structuredCode === 'UNAUTHORIZED' || structuredCode === 'SESSION_EXPIRED' || structuredCode === 'AUTH_LOCKED') {
      userFriendlyMessage = rawMessage;
    } else if (structuredCode === 'INVALID_PARAMS' || structuredCode === 'MISSING_ACTION' || structuredCode === 'EMPTY_PAYLOAD') {
      userFriendlyMessage = rawMessage;
    } else if (structuredCode === 'WRITE_BLOCKED_BY_SAFE_MODE') {
      userFriendlyMessage = rawMessage;
    } else if (rawMessage.indexOf('Validasi') !== -1 ||
               rawMessage.indexOf('wajib') !== -1 ||
               rawMessage.indexOf('tidak ditemukan') !== -1 ||
               rawMessage.indexOf('Akses ditolak') !== -1 ||
               rawMessage.indexOf('NIP atau password') !== -1) {
      userFriendlyMessage = rawMessage.replace(/at\s+[\w\.\/]+:\d+/gi, '').replace(/\b(?:SpreadsheetApp|DriveApp|eval|ScriptProperties)\b/gi, 'Sistem').trim();
    }

    return createJsonResponse({
      success: false,
      code: structuredCode,
      error: userFriendlyMessage,
      errorId: errorId,
      safeMode: !!CONFIG.SAFE_MODE,
      timestamp: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')
    });
  }
}

/**
 * Standard JSON HTTP response builder.
 */
function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
