/**
 * AM Digital ADR V2 - Backend Configuration
 * Google Apps Script Environment
 * 
 * SECURITY PRINCIPLES:
 * 1. Safe Mode is explicitly and strictly controlled by backend configuration (SAFE_MODE).
 * 2. Client-provided testMode flags are NEVER trusted for mutation authorization.
 * 3. Server-to-server communication with Node.js proxy is authenticated via shared secret
 *    stored exclusively in Script Properties (ADR_PROXY_SECRET). Zero hardcoded fallback secrets in source code.
 * 4. Production Google Sheets & Drive IDs remain intact and unmodified.
 */

var CONFIG = {
  // Target Spreadsheet ID (Production Database V1)
  SPREADSHEET_ID: '1R0sNA6dVgrI59HFAJUwqPhr2EbxMuyiXyguOosAX6gY',
  
  // Google Drive folder name for abnormal evidence photos
  DRIVE_EVIDENCE_FOLDER_NAME: 'AM_Digital_ADR_Evidence',
  
  // Sheet Names (Strictly matching production headers)
  SHEETS: {
    USERS: 'USERS',
    MASTER_UNIT: 'MASTER_UNIT_REVIEW',
    CHECKLIST_DRAFT: 'CHECKLIST_DRAFT',
    INSPECTIONS: 'INSPECTIONS',
    FINDINGS: 'FINDINGS',
    FOLLOWUPS: 'FOLLOWUPS',
    ASSIGNMENTS: 'ASSIGNMENTS',
    REQUESTS: 'REQUESTS',
    AUDIT: 'AUDIT'
  },
  
  // Session duration (seconds) - 12 hours (43200s)
  SESSION_TTL: 43200,
  
  // SAFE MODE (MUTATION CONTROL)
  // When false: Mutation operations (Sheets append/update, Drive file uploads,
  // Audit log writes) are fully ACTIVE and written to Google Sheets & Drive.
  SAFE_MODE: false,
  
  // SERVER-TO-SERVER AUTHENTICATION (Proxy <-> GAS)
  // Fail-closed enforcement: When true, ADR_PROXY_SECRET MUST be defined in
  // Apps Script Script Properties. Never fall back to plaintext secrets in source code.
  REQUIRE_PROXY_AUTH: true,
  
  // BRUTE-FORCE PROTECTION
  // Maximum failed login attempts within the tracking window before temporary lockout.
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_SECONDS: 900 // 15 minutes lockout
};
