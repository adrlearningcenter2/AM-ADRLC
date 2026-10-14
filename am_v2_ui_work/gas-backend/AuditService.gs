/**
 * AM Digital ADR V2 - Audit Trail Service
 * Records system actions into the AUDIT sheet.
 * 
 * SECURITY & SAFE MODE:
 * 1. Controlled by CONFIG.SAFE_MODE.
 * 2. When Safe Mode is active, AUDIT sheet is never modified.
 * 3. Log retrieval is strictly capped at maximum 100 records.
 */

var AuditService = (function() {
  function log(action, actorNip, detail) {
    try {
      var auditId = 'AUD-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMddHHmmss') + '-' + Utilities.getUuid().substring(0, 4);
      var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

      var rowData = {
        'audit_id': auditId,
        'timestamp': nowStr,
        'actor_nip': actorNip || 'SYSTEM',
        'action': action,
        'entity': (detail && detail.entity) ? detail.entity : 'SYSTEM',
        'entity_id': (detail && detail.entityId) ? detail.entityId : '',
        'before_json': (detail && detail.before) ? JSON.stringify(detail.before) : '',
        'after_json': (detail && detail.after) ? JSON.stringify(detail.after) : (typeof detail === 'object' ? JSON.stringify(detail) : String(detail || ''))
      };

      if (CONFIG.SAFE_MODE === true) {
        Logger.log('[SAFE_MODE_AUDIT] ' + action + ' by ' + (actorNip || 'SYSTEM') + ': ' + JSON.stringify(rowData));
        return;
      }

      SheetHelper.appendRowByHeader(CONFIG.SHEETS.AUDIT, rowData);
    } catch (e) {
      Logger.log('Gagal mencatat audit log: ' + e.message);
    }
  }

  function getLogs(limit) {
    // Strictly cap audit trail retrieval to maximum 100 entries to prevent memory exhaustion
    var safeLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
    var rows = SheetHelper.readAllRows(CONFIG.SHEETS.AUDIT);
    rows.reverse(); // newest first
    return rows.slice(0, safeLimit);
  }

  return {
    log: log,
    getLogs: getLogs
  };
})();
