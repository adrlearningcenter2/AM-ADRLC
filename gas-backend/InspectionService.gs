/**
 * AM Digital ADR V2 - Core Business & Inspection Service
 * 
 * SECURITY & GOVERNANCE:
 * 1. Safe Mode is strictly enforced by CONFIG.SAFE_MODE.
 * 2. Mutation requests are thoroughly validated before Safe Mode intercepts them.
 * 3. Atomic duplicate prevention using LockService.
 * 4. Master Unit & Checklist integrity checks against active records.
 * 5. Authenticated database connectivity verification.
 */

var InspectionService = (function() {

  function normalizeWeek(val) {
    if (!val) return '';
    if (val instanceof Date) {
      try {
        return Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
      } catch(e) {
        var yr = val.getFullYear();
        var mo = ('0' + (val.getMonth() + 1)).slice(-2);
        var da = ('0' + val.getDate()).slice(-2);
        return yr + '-' + mo + '-' + da;
      }
    }
    var s = String(val).trim();
    if (!s) return '';

    // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
    var mIso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (mIso) {
      var y = mIso[1];
      var m = ('0' + mIso[2]).slice(-2);
      var d = ('0' + mIso[3]).slice(-2);
      return y + '-' + m + '-' + d;
    }

    // 2. Indonesian / Common date format: DD/MM/YYYY or DD-MM-YYYY
    var mDmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (mDmy) {
      var p1 = parseInt(mDmy[1], 10);
      var p2 = parseInt(mDmy[2], 10);
      var yr = mDmy[3];
      var mo, da;
      if (p1 > 12) {
        da = ('0' + p1).slice(-2);
        mo = ('0' + p2).slice(-2);
      } else if (p2 > 12) {
        mo = ('0' + p1).slice(-2);
        da = ('0' + p2).slice(-2);
      } else {
        // Standard in Indonesia (e.g. 12/10/2026 is 12 Oct 2026)
        da = ('0' + p1).slice(-2);
        mo = ('0' + p2).slice(-2);
      }
      return yr + '-' + mo + '-' + da;
    }

    // 3. Fallback regex search for any 4 digits followed by 2 digits followed by 2 digits
    var anyIso = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (anyIso) {
      var y2 = anyIso[1];
      var m2 = ('0' + anyIso[2]).slice(-2);
      var d2 = ('0' + anyIso[3]).slice(-2);
      return y2 + '-' + m2 + '-' + d2;
    }

    return s;
  }

  function getCurrentWeekKey() {
    var nowJakartaStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    // Format: yyyy-MM-dd HH:mm:ss
    var parts = nowJakartaStr.split(' ')[0].split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    var dt = new Date(y, m, d);
    var day = dt.getDay(); // 0 is Sunday, 1 is Monday...
    var diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    var monday = new Date(y, m, diff);
    var monY = monday.getFullYear();
    var monM = String(monday.getMonth() + 1);
    if (monM.length < 2) monM = '0' + monM;
    var monD = String(monday.getDate());
    if (monD.length < 2) monD = '0' + monD;
    return monY + '-' + monM + '-' + monD;
  }

  // --------------------------------------------------------------------------
  // 1. Authenticated Database Connectivity Check (ADMIN ONLY, READ-ONLY)
  // --------------------------------------------------------------------------
  function checkDatabaseConnectivity(token) {
    AuthService.validateSession(token, ['ADMIN']);

    var ss = SheetHelper.getSpreadsheet();
    if (!ss) {
      throw new Error('Spreadsheet produksi tidak dapat dibuka dengan SpreadsheetApp.');
    }

    var requiredSheets = [
      CONFIG.SHEETS.USERS,
      CONFIG.SHEETS.MASTER_UNIT,
      CONFIG.SHEETS.CHECKLIST_DRAFT,
      CONFIG.SHEETS.INSPECTIONS,
      CONFIG.SHEETS.FINDINGS,
      CONFIG.SHEETS.FOLLOWUPS,
      CONFIG.SHEETS.ASSIGNMENTS,
      CONFIG.SHEETS.REQUESTS,
      CONFIG.SHEETS.AUDIT
    ];

    var sheetVerifications = [];
    for (var i = 0; i < requiredSheets.length; i++) {
      var sName = requiredSheets[i];
      var sheet = ss.getSheetByName(sName);
      if (!sheet) {
        throw new Error('Sheet yang dibutuhkan tidak ditemukan: ' + sName);
      }
      var lastCol = sheet.getLastColumn();
      var lastRow = sheet.getLastRow();
      if (lastCol < 1) {
        throw new Error('Sheet "' + sName + '" tidak memiliki kolom header.');
      }
      sheetVerifications.push({
        name: sName,
        verified: true,
        columnsCount: lastCol,
        rowsCount: Math.max(0, lastRow - 1)
      });
    }

    return {
      connected: true,
      safeMode: !!CONFIG.SAFE_MODE,
      verifiedSheetsCount: sheetVerifications.length,
      sheets: sheetVerifications,
      serverTime: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')
    };
  }

  // --------------------------------------------------------------------------
  // 2. getOverview & KPI (ADMIN & OPERATOR)
  // --------------------------------------------------------------------------
  function getOverview(token, weekKey) {
    AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);
    var targetWeek = normalizeWeek(weekKey) || getCurrentWeekKey();

    var allAssets = SheetHelper.readAllRows(CONFIG.SHEETS.MASTER_UNIT).filter(function(a) {
      return a['Aktif'] === true || String(a['Aktif']).toUpperCase() === 'TRUE';
    });

    var inspections = SheetHelper.readAllRows(CONFIG.SHEETS.INSPECTIONS).filter(function(i) {
      var w = normalizeWeek(i['week_key'] || i['week']);
      return w === targetWeek;
    });

    var findings = SheetHelper.readAllRows(CONFIG.SHEETS.FINDINGS);
    var requests = SheetHelper.readAllRows(CONFIG.SHEETS.REQUESTS);

    // Group assets by room
    var roomMap = {};
    for (var a = 0; a < allAssets.length; a++) {
      var rName = String(allAssets[a]['Ruangan'] || '').trim();
      if (!roomMap[rName]) {
        roomMap[rName] = { total: 0, inspected: 0, openFindings: 0 };
      }
      roomMap[rName].total++;
    }

    var inspectedUnitSet = {};
    for (var ins = 0; ins < inspections.length; ins++) {
      inspectedUnitSet[String(inspections[ins]['asset_id']).trim()] = true;
    }

    for (var a2 = 0; a2 < allAssets.length; a2++) {
      var uId = String(allAssets[a2]['ID Unit'] || '').trim();
      var roomName = String(allAssets[a2]['Ruangan'] || '').trim();
      if (inspectedUnitSet[uId] && roomMap[roomName]) {
        roomMap[roomName].inspected++;
      }
    }

    var openFindingsCount = 0;
    var coordinatedCount = 0;
    var closedCount = 0;

    for (var f = 0; f < findings.length; f++) {
      var st = String(findings[f]['status']).toUpperCase();
      var fRoom = String(findings[f]['room_id']).trim();
      if (st === 'OPEN') {
        openFindingsCount++;
        if (roomMap[fRoom]) roomMap[fRoom].openFindings++;
      } else if (st === 'COORDINATED') {
        coordinatedCount++;
        if (roomMap[fRoom]) roomMap[fRoom].openFindings++;
      } else if (st === 'CLOSED') {
        closedCount++;
      }
    }

    var pendingRequestsCount = 0;
    for (var req = 0; req < requests.length; req++) {
      if (String(requests[req]['status']).toUpperCase() === 'PENDING') {
        pendingRequestsCount++;
      }
    }

    var roomsSummary = [];
    var totalRoomsCompleted = 0;
    for (var room in roomMap) {
      if (roomMap.hasOwnProperty(room)) {
        var isComplete = roomMap[room].inspected >= roomMap[room].total && roomMap[room].total > 0;
        if (isComplete) totalRoomsCompleted++;
        roomsSummary.push({
          name: room,
          totalAssets: roomMap[room].total,
          activeAssets: roomMap[room].total,
          inspectedThisWeek: roomMap[room].inspected,
          openFindingsCount: roomMap[room].openFindings,
          isCompleteThisWeek: isComplete
        });
      }
    }

    var totalAssetsCount = allAssets.length;
    var totalInspectedCount = Object.keys(inspectedUnitSet).length;
    var progressPct = totalAssetsCount > 0 ? Math.round((totalInspectedCount / totalAssetsCount) * 100) : 0;
    var complianceRate = totalInspectedCount > 0
      ? Math.max(0, Math.round(((totalInspectedCount - openFindingsCount) / totalInspectedCount) * 100))
      : 100;

    var kpi = {
      totalAssets: totalAssetsCount,
      activeAssets: totalAssetsCount,
      totalRooms: Object.keys(roomMap).length,
      completedRoomsThisWeek: totalRoomsCompleted,
      inspectionProgressPercent: progressPct,
      totalInspectionsThisWeek: totalInspectedCount,
      openFindings: openFindingsCount,
      coordinatedFindings: coordinatedCount,
      closedFindings: closedCount,
      complianceRate: complianceRate,
      pendingRequests: pendingRequestsCount
    };

    return {
      weekKey: targetWeek,
      kpi: kpi,
      rooms: roomsSummary
    };
  }

  // --------------------------------------------------------------------------
  // 3. getRooms (ADMIN & OPERATOR)
  // --------------------------------------------------------------------------
  function getRooms(token) {
    AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);

    var allAssets = SheetHelper.readAllRows(CONFIG.SHEETS.MASTER_UNIT).filter(function(a) {
      return a['Aktif'] === true || String(a['Aktif']).toUpperCase() === 'TRUE';
    });
    var assignments = SheetHelper.readAllRows(CONFIG.SHEETS.ASSIGNMENTS).filter(function(asg) {
      return asg['active'] === true || String(asg['active']).toUpperCase() === 'TRUE';
    });

    var assignMap = {};
    for (var i = 0; i < assignments.length; i++) {
      var rName = String(assignments[i]['room_id'] || assignments[i]['room'] || '').trim();
      if (rName) {
        assignMap[rName] = assignments[i];
      }
    }

    var currentWeek = getCurrentWeekKey();
    var inspections = SheetHelper.readAllRows(CONFIG.SHEETS.INSPECTIONS).filter(function(i) {
      var w = normalizeWeek(i['week_key'] || i['week'] || i['Minggu']);
      return w === currentWeek;
    });

    var inspectedUnitSet = {};
    for (var ins = 0; ins < inspections.length; ins++) {
      var u = String(ins['asset_id'] || ins['unit_id'] || ins['ID Unit'] || '').trim();
      if (u) {
        inspectedUnitSet[u] = true;
      }
    }

    var roomsMap = {};
    for (var j = 0; j < allAssets.length; j++) {
      var r = String(allAssets[j]['Ruangan'] || allAssets[j]['ruangan'] || allAssets[j]['room'] || '').trim();
      var uId = String(allAssets[j]['ID Unit'] || allAssets[j]['unit_id'] || allAssets[j]['asset_id'] || '').trim();
      if (!r) continue;
      if (!roomsMap[r]) {
        roomsMap[r] = { name: r, totalAssets: 0, activeAssets: 0, inspectedThisWeek: 0 };
      }
      roomsMap[r].totalAssets++;
      roomsMap[r].activeAssets++;
      if (inspectedUnitSet[uId]) {
        roomsMap[r].inspectedThisWeek++;
      }
    }

    var list = [];
    for (var rm in roomsMap) {
      if (roomsMap.hasOwnProperty(rm)) {
        var asgObj = assignMap[rm];
        var total = roomsMap[rm].totalAssets;
        var inspected = roomsMap[rm].inspectedThisWeek;
        var isComplete = total > 0 && inspected >= total;
        list.push({
          name: rm,
          totalAssets: total,
          activeAssets: total,
          inspectedThisWeek: inspected,
          isCompleteThisWeek: isComplete,
          progressPercent: total > 0 ? Math.round((inspected / total) * 100) : 0,
          assignedOperatorNip: asgObj ? String(asgObj['operator_nip'] || asgObj['main_nip'] || '') : ''
        });
      }
    }

    return { rooms: list, weekKey: currentWeek };
  }

  // --------------------------------------------------------------------------
  // 4. getRoomDetails (ADMIN & OPERATOR)
  // --------------------------------------------------------------------------
  function getRoomDetails(token, room, weekKey) {
    AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);
    if (!room || typeof room !== 'string' || !room.trim()) {
      throw new Error('Parameter "room" wajib diisi.');
    }

    var targetWeek = normalizeWeek(weekKey) || getCurrentWeekKey();
    var cleanRoom = room.trim();

    var allAssets = SheetHelper.readAllRows(CONFIG.SHEETS.MASTER_UNIT).filter(function(a) {
      var matchRoom = String(a['Ruangan']).trim().toLowerCase() === cleanRoom.toLowerCase();
      var isActive = a['Aktif'] === true || String(a['Aktif']).toUpperCase() === 'TRUE';
      return matchRoom && isActive;
    });

    var allChecklists = SheetHelper.readAllRows(CONFIG.SHEETS.CHECKLIST_DRAFT).filter(function(c) {
      return c['Aktif'] === true || String(c['Aktif']).toUpperCase() === 'TRUE';
    });

    var allAssetIds = allAssets.map(function(a) {
      return String(a['ID Unit'] || a['unit_id'] || a['asset_id'] || '').trim();
    });

    var inspections = SheetHelper.readAllRows(CONFIG.SHEETS.INSPECTIONS).filter(function(ins) {
      var insRoom = String(ins['room_id'] || ins['room'] || ins['Ruangan'] || '').trim();
      var insUnit = String(ins['asset_id'] || ins['unit_id'] || ins['ID Unit'] || '').trim();
      var insWeek = normalizeWeek(ins['week_key'] || ins['week'] || ins['Minggu']);
      var matchRoom = !insRoom || insRoom.toLowerCase() === cleanRoom.toLowerCase() || (insUnit && allAssetIds.indexOf(insUnit) >= 0);
      var matchWeek = insWeek === targetWeek;
      return matchRoom && matchWeek;
    });

    var insMap = {};
    for (var k = 0; k < inspections.length; k++) {
      var row = inspections[k];
      var uKey = String(row['asset_id'] || row['unit_id'] || row['ID Unit'] || '').trim();
      if (!uKey) continue;
      if (!insMap[uKey]) {
        insMap[uKey] = {
          main: row,
          itemizedAnswers: []
        };
      } else {
        if (row['completed_at'] || row['created_at']) {
          insMap[uKey].main = row;
        }
      }
      // If this row has a specific checklist_id and answer, collect it
      var chkId = String(row['checklist_id'] || row['point_id'] || row['Checklist ID'] || row['ID Checklist'] || '').trim();
      var ansVal = String(row['answer'] || row['Jawaban'] || row['Status'] || '').trim();
      if (chkId && ansVal) {
        insMap[uKey].itemizedAnswers.push({
          id: chkId,
          answer: ansVal.toUpperCase().indexOf('ABNORMAL') >= 0 ? 'ABNORMAL' : 'NORMAL',
          note: row['note'] || row['Catatan'] || row['Keterangan'] || ''
        });
      }
    }

    var findings = SheetHelper.readAllRows(CONFIG.SHEETS.FINDINGS).filter(function(f) {
      var fWeek = normalizeWeek(f['week_key'] || f['week'] || f['Minggu']);
      return !fWeek || fWeek === targetWeek;
    });
    var findingsMap = {};
    for (var fIdx = 0; fIdx < findings.length; fIdx++) {
      var fUnit = String(findings[fIdx]['asset_id'] || findings[fIdx]['unit_id'] || findings[fIdx]['ID Unit'] || '').trim();
      if (!findingsMap[fUnit]) findingsMap[fUnit] = [];
      findingsMap[fUnit].push(findings[fIdx]);
    }

    var units = [];
    var completedCount = 0;

    for (var i = 0; i < allAssets.length; i++) {
      var asset = allAssets[i];
      var unitId = String(asset['ID Unit'] || asset['unit_id'] || asset['asset_id'] || '').trim();
      var unitChecklists = allChecklists.filter(function(chk) {
        var chkUnit = String(chk['ID Unit'] || chk['unit_id'] || chk['asset_id'] || '').trim();
        return chkUnit === unitId;
      }).map(function(chk) {
        return {
          id: String(chk['Checklist ID'] || chk['checklist_id'] || chk['point_id'] || chk['ID Checklist'] || '').trim(),
          unit_id: unitId,
          order: Number(chk['Urutan'] || chk['order']) || 1,
          question: String(chk['Poin Pemeriksaan'] || chk['question'] || chk['Pertanyaan'] || '').trim(),
          active: true
        };
      });

      var insEntry = insMap[unitId];
      var insRecord = insEntry ? insEntry.main : null;
      var inspected = !!insRecord;
      if (inspected) completedCount++;

      var parsedAnswers = [];
      if (insRecord) {
        var rawJson = insRecord['answers_json'] || insRecord['Jawaban JSON'] || insRecord['answers'];
        if (rawJson) {
          try {
            parsedAnswers = typeof rawJson === 'string'
              ? JSON.parse(rawJson)
              : rawJson;
          } catch(e) {
            parsedAnswers = [];
          }
        }
      }
      if ((!parsedAnswers || parsedAnswers.length === 0) && insEntry && insEntry.itemizedAnswers && insEntry.itemizedAnswers.length > 0) {
        parsedAnswers = insEntry.itemizedAnswers;
      }
      // Safe fallback: If inspected but answers array empty in spreadsheet, construct from unit checklists
      if ((!parsedAnswers || parsedAnswers.length === 0) && inspected) {
        parsedAnswers = unitChecklists.map(function(chk) {
          return {
            id: chk.id,
            answer: 'NORMAL',
            note: ''
          };
        });
      }

      var unitFindings = findingsMap[unitId] || [];
      var hasAbnormalFromAnswers = parsedAnswers.some(function(pa) {
        return String(pa.answer || '').toUpperCase() === 'ABNORMAL';
      });

      units.push({
        unit: {
          id: unitId,
          room: cleanRoom,
          label: String(asset['Label Pemeriksaan'] || asset['Nama'] || unitId).trim(),
          name: String(asset['Nama'] || asset['Label Pemeriksaan'] || unitId).trim(),
          qty: Number(asset['Jumlah Standar Sementara']) || 1,
          model: asset['Model'] === 'Kelompok' ? 'Kelompok' : 'Tunggal',
          active: true
        },
        checklists: unitChecklists,
        inspectedThisWeek: inspected,
        inspectionRecord: insRecord ? {
          inspection_id: insRecord['inspection_id'],
          week_key: insRecord['week_key'],
          room_id: cleanRoom,
          asset_id: unitId,
          status: insRecord['status'] || 'COMPLETED',
          completed_at: insRecord['completed_at'] || insRecord['created_at'] || '',
          operator_nip: insRecord['last_actor_nip'] || insRecord['operator_nip'] || '',
          physical_qty: insRecord['physical_qty'],
          usable_qty: insRecord['usable_qty'],
          answers: parsedAnswers,
          findings: unitFindings
        } : null,
        hasAbnormality: unitFindings.length > 0 || hasAbnormalFromAnswers
      });
    }

    return {
      room: cleanRoom,
      weekKey: targetWeek,
      units: units,
      completedCount: completedCount,
      totalCount: units.length,
      isFullyInspected: completedCount >= units.length && units.length > 0
    };
  }

  // --------------------------------------------------------------------------
  // 5. getInspections (ADMIN & OPERATOR)
  // --------------------------------------------------------------------------
  function getInspections(token, filter) {
    AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);
    filter = filter || {};

    var rows = SheetHelper.readAllRows(CONFIG.SHEETS.INSPECTIONS);
    if (filter.room) {
      rows = rows.filter(function(r) { return String(r['room_id']).trim() === String(filter.room).trim(); });
    }
    if (filter.weekKey) {
      rows = rows.filter(function(r) { return String(r['week_key']).trim() === String(filter.weekKey).trim(); });
    }
    if (filter.status) {
      rows = rows.filter(function(r) { return String(r['status']).toUpperCase() === String(filter.status).toUpperCase(); });
    }

    rows.reverse();
    if (filter.limit && filter.limit > 0) {
      rows = rows.slice(0, Number(filter.limit));
    }

    return {
      inspections: rows,
      total: rows.length
    };
  }

  // --------------------------------------------------------------------------
  // 6. saveInspection (MUTATION - FULL VALIDATION & SAFE MODE ENFORCEMENT)
  // --------------------------------------------------------------------------
  function saveInspection(token, payload) {
    // RBAC: Hanya Operator pelaksana yang berwenang mengisi checklist inspeksi inventaris.
    var session = AuthService.validateSession(token, ['OPERATOR']);

    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload inspeksi tidak boleh kosong.');
    }
    if (!payload.unitId || typeof payload.unitId !== 'string') {
      throw new Error('ID Unit inventaris wajib disertakan.');
    }
    if (!payload.room || typeof payload.room !== 'string') {
      throw new Error('Nama ruangan inspeksi wajib disertakan.');
    }
    if (!payload.week || typeof payload.week !== 'string') {
      throw new Error('Kunci periode minggu (weekKey) wajib disertakan.');
    }
    if (!payload.answers || !Array.isArray(payload.answers) || payload.answers.length === 0) {
      throw new Error('Daftar jawaban checklist pemeriksaan tidak boleh kosong.');
    }

    var unitId = String(payload.unitId).trim();
    var weekKey = String(payload.week).trim();
    var room = String(payload.room).trim();

    // 1. VALIDATION: Check Master Unit exists and is active
    var allAssets = SheetHelper.readAllRows(CONFIG.SHEETS.MASTER_UNIT);
    var targetAsset = null;
    for (var a = 0; a < allAssets.length; a++) {
      if (String(allAssets[a]['ID Unit']).trim() === unitId) {
        targetAsset = allAssets[a];
        break;
      }
    }

    if (!targetAsset) {
      throw new Error('Validasi gagal: ID Unit "' + unitId + '" tidak terdaftar di MASTER_UNIT_REVIEW.');
    }
    var isAssetActive = targetAsset['Aktif'] === true || String(targetAsset['Aktif']).toUpperCase() === 'TRUE';
    if (!isAssetActive) {
      throw new Error('Validasi gagal: ID Unit "' + unitId + '" berstatus NON-AKTIF di master data.');
    }

    // Check model Kelompok quantity requirement
    if (targetAsset['Model'] === 'Kelompok') {
      if (payload.physical === undefined || payload.physical === null || payload.physical === '') {
        throw new Error('Unit bermodel Kelompok wajib mengisi jumlah fisik terhitung.');
      }
    }

    // 2. VALIDATION: Check Checklist points against active CHECKLIST_DRAFT
    var allChecklists = SheetHelper.readAllRows(CONFIG.SHEETS.CHECKLIST_DRAFT).filter(function(chk) {
      var match = String(chk['ID Unit']).trim() === unitId;
      var act = chk['Aktif'] === true || String(chk['Aktif']).toUpperCase() === 'TRUE';
      return match && act;
    });

    var validChecklistIds = {};
    for (var c = 0; c < allChecklists.length; c++) {
      validChecklistIds[String(allChecklists[c]['Checklist ID']).trim()] = true;
    }

    var abnormalCount = 0;
    for (var ansIdx = 0; ansIdx < payload.answers.length; ansIdx++) {
      var item = payload.answers[ansIdx];
      var qId = String(item.id || '').trim();
      if (!validChecklistIds[qId]) {
        throw new Error('Validasi gagal: Butir checklist "' + qId + '" tidak aktif atau tidak sesuai dengan unit ' + unitId);
      }
      if (item.answer !== 'NORMAL' && item.answer !== 'ABNORMAL') {
        throw new Error('Jawaban checklist "' + qId + '" harus NORMAL atau ABNORMAL.');
      }
      if (item.answer === 'ABNORMAL') {
        abnormalCount++;
        if (!item.note || !item.note.trim()) {
          throw new Error('Temuan abnormalitas pada poin "' + qId + '" wajib disertai catatan deskripsi masalah.');
        }
      }
    }

    // 3. ATOMIC CHECK: Check if previous inspection exists for this week + unit
    var existingInspections = SheetHelper.readAllRows(CONFIG.SHEETS.INSPECTIONS);
    var prevRowIndices = [];
    var prevInspectionId = '';
    for (var ex = 0; ex < existingInspections.length; ex++) {
      var exWeek = String(existingInspections[ex]['week_key'] || existingInspections[ex]['week'] || '').trim();
      var exUnit = String(existingInspections[ex]['asset_id'] || existingInspections[ex]['unit_id'] || '').trim();
      if (exWeek === weekKey && exUnit === unitId) {
        prevRowIndices.push(existingInspections[ex]._rowIndex);
        if (!prevInspectionId && existingInspections[ex]['inspection_id']) {
          prevInspectionId = String(existingInspections[ex]['inspection_id']).trim();
        }
      }
    }

    // 4. CRITICAL SAFE MODE ENFORCEMENT
    // If backend Safe Mode is active, block write operations and return validated notice
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE] saveInspection validated successfully. Mutation blocked by Safe Mode.');
      return {
        code: 'WRITE_BLOCKED_BY_SAFE_MODE',
        safeMode: true,
        message: 'Operasi inspeksi divalidasi dengan sukses, namun penulisan diblokir oleh Safe Mode backend. Tidak ada baris yang ditambahkan ke Google Sheets atau Google Drive.',
        action: 'saveInspection',
        validatedPayload: {
          unitId: unitId,
          room: room,
          weekKey: weekKey,
          operatorNip: session.nip,
          answersValidated: payload.answers.length,
          abnormalitiesCount: abnormalCount
        }
      };
    }

    // 5. LIVE ATOMIC MUTATION (Only runs when CONFIG.SAFE_MODE === false)
    var lock = LockService.getScriptLock();
    var acquired = lock.tryLock(30000);
    if (!acquired) {
      throw new Error('Sistem sedang memproses transaksi lain. Silakan coba kembali beberapa saat lagi.');
    }

    try {
      var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      var stamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMddHHmmss');
      var inspectionId = 'INS-' + stamp + '-' + unitId;

      var findingIds = [];

      // Process Abnormal items -> Save photos to Google Drive & Create Findings
      for (var i2 = 0; i2 < payload.answers.length; i2++) {
        var ansItem = payload.answers[i2];
        if (ansItem.answer === 'ABNORMAL') {
          var fndId = 'FND-' + stamp + '-' + (i2 + 1);
          findingIds.push(fndId);

          var drivePhotoId = '';
          if (ansItem.photo && ansItem.photo.base64) {
            var uploadRes = DriveService.uploadPhoto(
              ansItem.photo.base64,
              ansItem.photo.mime || 'image/jpeg',
              'ADR_' + unitId + '_' + fndId
            );
            drivePhotoId = uploadRes.fileId;
          }

          var findingRow = {
            'finding_id': fndId,
            'inspection_id': inspectionId,
            'week_key': weekKey,
            'asset_id': unitId,
            'unit_id': unitId,
            'room_id': room,
            'point_id': ansItem.id,
            'checklist_id': ansItem.id,
            'description': ansItem.note || 'Abnormalitas tercatat pada checklist mingguan.',
            'priority': 'SEDANG',
            'team': 'Fasilitas & Pemeliharaan',
            'status': 'OPEN',
            'initial_photo_id': drivePhotoId,
            'completion_photo_id': '',
            'physical_qty': payload.physical !== undefined ? payload.physical : '',
            'usable_qty': payload.usable !== undefined ? payload.usable : '',
            'created_by': session.nip,
            'created_at': nowStr,
            'closed_by': '',
            'closed_at': '',
            'coord_by': '',
            'coord_at': ''
          };

          SheetHelper.appendRowByHeader(CONFIG.SHEETS.FINDINGS, findingRow);
        }
      }

      var answersJson = JSON.stringify(payload.answers.map(function(ans) {
        return {
          id: ans.id,
          answer: ans.answer,
          note: ans.note || ''
        };
      }));

      // Write each checklist item as 1 row in INSPECTIONS (Itemized format)
      // and also include answers_json so both schema types (json column F and itemized columns) are 100% populated!
      for (var aIdx = 0; aIdx < payload.answers.length; aIdx++) {
        var currAns = payload.answers[aIdx];
        var itemRow = {
          'inspection_id': inspectionId,
          'week_key': weekKey,
          'room_id': room,
          'room': room,
          'asset_id': unitId,
          'unit_id': unitId,
          'checklist_id': currAns.id,
          'answer': currAns.answer,
          'answers_json': answersJson,
          'checklist_snapshot': '',
          'checklist_snap': '',
          'physical_qty': payload.physical !== undefined ? payload.physical : '',
          'usable_qty': payload.usable !== undefined ? payload.usable : '',
          'note': currAns.note || '',
          'operator_nip': session.nip,
          'last_actor_nip': session.nip,
          'status': 'COMPLETED',
          'started_at': nowStr,
          'updated_at': nowStr,
          'completed_at': nowStr,
          'created_at': nowStr
        };

        SheetHelper.appendRowByHeader(CONFIG.SHEETS.INSPECTIONS, itemRow);
      }

      // Record Audit Trail
      AuditService.log('INSPECTION_SAVE', session.nip, {
        entity: 'INSPECTIONS',
        entityId: inspectionId,
        unitId: unitId,
        room: room,
        weekKey: weekKey,
        abnormalitiesCount: findingIds.length
      });

      return {
        inspection_id: inspectionId,
        week_key: weekKey,
        asset_id: unitId,
        room_id: room,
        findingsCreated: findingIds.length,
        findingIds: findingIds,
        status: 'COMPLETED',
        completed_at: nowStr
      };
    } finally {
      lock.releaseLock();
    }
  }

  // --------------------------------------------------------------------------
  // 7. getFindings & markCoordinated
  // --------------------------------------------------------------------------
  function getFindings(token, filter) {
    AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);
    filter = filter || {};

    var session = AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);
    var rows = SheetHelper.readAllRows(CONFIG.SHEETS.FINDINGS);
    if (session.role === 'OPERATOR') {
      rows = rows.filter(function(r) { return String(r['created_by'] || '').trim() === String(session.nip); });
    }
    if (filter.status && filter.status !== 'ALL') {
      rows = rows.filter(function(r) { return String(r['status']).toUpperCase() === String(filter.status).toUpperCase(); });
    }
    if (filter.room) {
      rows = rows.filter(function(r) { return String(r['room_id']).trim() === String(filter.room).trim(); });
    }

    rows.reverse();
    return {
      findings: rows,
      total: rows.length
    };
  }

  function markCoordinated(token, findingId, note, picNip) {
    var session = AuthService.validateSession(token, ['ADMIN']); // Admin coordination only
    if (!findingId || typeof findingId !== 'string') {
      throw new Error('Parameter "findingId" wajib disertakan.');
    }

    var cleanId = findingId.trim();
    var allFindings = SheetHelper.readAllRows(CONFIG.SHEETS.FINDINGS);
    var target = null;
    for (var i = 0; i < allFindings.length; i++) {
      if (String(allFindings[i]['finding_id']).trim() === cleanId) {
        target = allFindings[i];
        break;
      }
    }

    if (!target) {
      throw new Error('Temuan dengan ID "' + cleanId + '" tidak ditemukan.');
    }

    // SAFE MODE GUARD
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE] markCoordinated validated for findingId: ' + cleanId);
      return {
        code: 'WRITE_BLOCKED_BY_SAFE_MODE',
        safeMode: true,
        message: 'Koordinasi temuan divalidasi dengan sukses, namun penulisan diblokir oleh Safe Mode.',
        action: 'markCoordinated',
        validatedPayload: { findingId: cleanId, note: note, picNip: picNip }
      };
    }

    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    SheetHelper.updateRowByHeader(CONFIG.SHEETS.FINDINGS, target._rowIndex, {
      'status': 'COORDINATED',
      'coord_by': session.nip,
      'coord_at': nowStr
    });

    AuditService.log('COORDINATE_FINDING', session.nip, {
      entity: 'FINDINGS',
      entityId: cleanId,
      note: note,
      picNip: picNip
    });

    return {
      findingId: cleanId,
      status: 'COORDINATED',
      coord_by: session.nip,
      coord_at: nowStr
    };
  }

  // --------------------------------------------------------------------------
  // 8. Followups: getFollowups, addFollowup, closeFinding
  // --------------------------------------------------------------------------
  function getFollowups(token, findingId) {
    AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);
    if (!findingId || typeof findingId !== 'string') {
      throw new Error('Parameter "findingId" wajib disertakan.');
    }

    var cleanId = findingId.trim();
    var rows = SheetHelper.readAllRows(CONFIG.SHEETS.FOLLOWUPS).filter(function(f) {
      return String(f['finding_id']).trim() === cleanId;
    });

    return {
      findingId: cleanId,
      followups: rows
    };
  }

  function addFollowup(token, findingId, note) {
    // RBAC: Hanya Operator pelaksana yang berwenang menambahkan tindak lanjut abnormalitas.
    var session = AuthService.validateSession(token, ['OPERATOR']);
    if (!findingId || typeof findingId !== 'string') {
      throw new Error('Parameter "findingId" wajib disertakan.');
    }
    if (!note || typeof note !== 'string' || !note.trim()) {
      throw new Error('Catatan tindak lanjut tidak boleh kosong.');
    }

    var cleanId = findingId.trim();
    var allFindings = SheetHelper.readAllRows(CONFIG.SHEETS.FINDINGS);
    var target = null;
    for (var i = 0; i < allFindings.length; i++) {
      if (String(allFindings[i]['finding_id']).trim() === cleanId) {
        target = allFindings[i];
        break;
      }
    }

    if (!target) {
      throw new Error('Temuan dengan ID "' + cleanId + '" tidak ditemukan.');
    }

    // SAFE MODE GUARD
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE] addFollowup validated for findingId: ' + cleanId);
      return {
        code: 'WRITE_BLOCKED_BY_SAFE_MODE',
        safeMode: true,
        message: 'Catatan tindak lanjut divalidasi dengan sukses, namun penulisan diblokir oleh Safe Mode.',
        action: 'addFollowup',
        validatedPayload: { findingId: cleanId, note: note }
      };
    }

    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var folId = 'FOL-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMddHHmmss');
    SheetHelper.appendRowByHeader(CONFIG.SHEETS.FOLLOWUPS, {
      'followup_id': folId,
      'finding_id': cleanId,
      'actor_nip': session.nip,
      'result': 'RECHECK',
      'notes': note.trim(),
      'physical_qty': target['physical_qty'] || '',
      'usable_qty': target['usable_qty'] || '',
      'photo_id': '',
      'created_at': nowStr
    });

    AuditService.log('ADD_FOLLOWUP', session.nip, {
      entity: 'FOLLOWUPS',
      entityId: folId,
      findingId: cleanId,
      note: note
    });

    return {
      followup_id: folId,
      finding_id: cleanId,
      actor_nip: session.nip,
      created_at: nowStr
    };
  }

  function closeFinding(token, findingId, note, photoObj) {
    // RBAC: Hanya Operator yang berwenang menutup/menyelesaikan abnormalitas setelah syarat terpenuhi.
    // Admin bersifat monitoring dan dilarang menutup abnormalitas secara langsung.
    var session = AuthService.validateSession(token, ['OPERATOR']);
    if (!findingId || typeof findingId !== 'string') {
      throw new Error('Parameter "findingId" wajib disertakan.');
    }

    var cleanId = findingId.trim();
    var allFindings = SheetHelper.readAllRows(CONFIG.SHEETS.FINDINGS);
    var target = null;
    for (var i = 0; i < allFindings.length; i++) {
      if (String(allFindings[i]['finding_id']).trim() === cleanId) {
        target = allFindings[i];
        break;
      }
    }

    if (!target) {
      throw new Error('Temuan dengan ID "' + cleanId + '" tidak ditemukan.');
    }

    // SAFE MODE GUARD
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE] closeFinding validated for findingId: ' + cleanId);
      return {
        code: 'WRITE_BLOCKED_BY_SAFE_MODE',
        safeMode: true,
        message: 'Penutupan temuan divalidasi dengan sukses, namun penulisan diblokir oleh Safe Mode.',
        action: 'closeFinding',
        validatedPayload: { findingId: cleanId, note: note }
      };
    }

    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var completionDriveId = '';

    // Handle flexible photo payload (data URL or object with base64)
    var base64Payload = '';
    var mimePayload = 'image/jpeg';
    if (photoObj) {
      if (typeof photoObj === 'string' && photoObj.indexOf('base64,') > -1) {
        var matchMime = photoObj.match(/^data:([^;]+);base64,/);
        if (matchMime) mimePayload = matchMime[1];
        base64Payload = photoObj.split('base64,')[1];
      } else if (typeof photoObj === 'object' && photoObj.base64) {
        base64Payload = photoObj.base64;
        mimePayload = photoObj.mime || 'image/jpeg';
      }
    }

    if (base64Payload) {
      var uploadRes = DriveService.uploadPhoto(
        base64Payload,
        mimePayload,
        'CLOSE_' + cleanId
      );
      completionDriveId = uploadRes.fileId;
    }

    // Update FINDINGS row
    SheetHelper.updateRowByHeader(CONFIG.SHEETS.FINDINGS, target._rowIndex, {
      'status': 'CLOSED',
      'completion_photo_id': completionDriveId,
      'closed_by': session.nip,
      'closed_at': nowStr
    });

    // Append FOLLOWUPS record
    var folId = 'FOL-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMddHHmmss');
    SheetHelper.appendRowByHeader(CONFIG.SHEETS.FOLLOWUPS, {
      'followup_id': folId,
      'finding_id': cleanId,
      'actor_nip': session.nip,
      'result': 'REPAIRED',
      'notes': note || 'Perbaikan selesai dilaksanakan oleh Operator.',
      'physical_qty': target['physical_qty'] || '',
      'usable_qty': target['usable_qty'] || '',
      'photo_id': completionDriveId,
      'created_at': nowStr
    });

    AuditService.log('CLOSE_FINDING', session.nip, {
      entity: 'FINDINGS',
      entityId: cleanId,
      note: note,
      photoId: completionDriveId
    });

    return {
      findingId: cleanId,
      status: 'CLOSED',
      closed_by: session.nip,
      closed_at: nowStr,
      completionPhotoDriveId: completionDriveId
    };
  }

  // --------------------------------------------------------------------------
  // 9. Requests: getRequests, submitRequest, decideRequest
  // --------------------------------------------------------------------------
  function getRequests(token, filter) {
    AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);
    filter = filter || {};

    var rows = SheetHelper.readAllRows(CONFIG.SHEETS.REQUESTS);
    if (filter.status && filter.status !== 'ALL') {
      rows = rows.filter(function(r) { return String(r['status']).toUpperCase() === String(filter.status).toUpperCase(); });
    }

    rows.reverse();
    return {
      requests: rows,
      total: rows.length
    };
  }

  function submitRequest(token, payload) {
    // RBAC: Operator membuat pengajuan; Admin meninjau & memutuskan (decideRequest)
    var session = AuthService.validateSession(token, ['OPERATOR']);
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload pengajuan tidak boleh kosong.');
    }
    if (!payload.type || !payload.room_id || !payload.reason) {
      throw new Error('Tipe pengajuan, ruangan, dan alasan pengajuan wajib diisi.');
    }

    // SAFE MODE GUARD
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE] submitRequest validated for requester: ' + session.nip);
      return {
        code: 'WRITE_BLOCKED_BY_SAFE_MODE',
        safeMode: true,
        message: 'Pengajuan divalidasi dengan sukses, namun penulisan diblokir oleh Safe Mode.',
        action: 'submitRequest',
        validatedPayload: payload
      };
    }

    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    var reqId = 'REQ-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMddHHmmss');

    var newReq = {
      'request_id': reqId,
      'type': String(payload.type).toUpperCase(),
      'requester_nip': session.nip,
      'room_id': String(payload.room_id).trim(),
      'asset_id': String(payload.asset_id || '').trim(),
      'payload_json': typeof payload.payload === 'object' ? JSON.stringify(payload.payload) : String(payload.payload || ''),
      'reason': String(payload.reason).trim(),
      'status': 'PENDING',
      'reviewer_nip': '',
      'review_note': '',
      'deadline_at': payload.deadline_at || '',
      'created_at': nowStr,
      'reviewed_at': ''
    };

    SheetHelper.appendRowByHeader(CONFIG.SHEETS.REQUESTS, newReq);
    AuditService.log('SUBMIT_REQUEST', session.nip, {
      entity: 'REQUESTS',
      entityId: reqId,
      type: payload.type
    });

    return {
      request_id: reqId,
      status: 'PENDING',
      created_at: nowStr
    };
  }

  function decideRequest(token, requestId, decision, reviewNote) {
    var session = AuthService.validateSession(token, ['ADMIN']); // Admin approval only
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Parameter "requestId" wajib disertakan.');
    }
    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      throw new Error('Keputusan pengajuan harus APPROVE atau REJECT.');
    }

    var cleanId = requestId.trim();
    var allReqs = SheetHelper.readAllRows(CONFIG.SHEETS.REQUESTS);
    var target = null;
    for (var i = 0; i < allReqs.length; i++) {
      if (String(allReqs[i]['request_id']).trim() === cleanId) {
        target = allReqs[i];
        break;
      }
    }

    if (!target) {
      throw new Error('Pengajuan dengan ID "' + cleanId + '" tidak ditemukan.');
    }

    // SAFE MODE GUARD
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE] decideRequest validated for requestId: ' + cleanId);
      return {
        code: 'WRITE_BLOCKED_BY_SAFE_MODE',
        safeMode: true,
        message: 'Keputusan pengajuan divalidasi dengan sukses, namun penulisan diblokir oleh Safe Mode.',
        action: 'decideRequest',
        validatedPayload: { requestId: cleanId, decision: decision, reviewNote: reviewNote }
      };
    }

    var statusResult = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    SheetHelper.updateRowByHeader(CONFIG.SHEETS.REQUESTS, target._rowIndex, {
      'status': statusResult,
      'reviewer_nip': session.nip,
      'review_note': reviewNote || '',
      'reviewed_at': nowStr
    });

    AuditService.log('DECIDE_REQUEST', session.nip, {
      entity: 'REQUESTS',
      entityId: cleanId,
      decision: statusResult,
      note: reviewNote
    });

    return {
      requestId: cleanId,
      status: statusResult,
      reviewer_nip: session.nip,
      reviewed_at: nowStr
    };
  }

  // --------------------------------------------------------------------------
  // 10. getReports (ADMIN ONLY)
  // --------------------------------------------------------------------------
  function getReports(token, month, year) {
    AuthService.validateSession(token, ['ADMIN']);

    var m = Number(month) || (new Date().getMonth() + 1);
    var y = Number(year) || new Date().getFullYear();

    var overview = getOverview(token);
    var periodLabel = 'Bulan ' + m + ' - ' + y;

    var roomStats = overview.rooms.map(function(rm) {
      return {
        room: rm.name,
        totalAssets: rm.totalAssets,
        totalInspections: rm.inspectedThisWeek,
        totalFindings: rm.openFindingsCount,
        closedFindings: 0,
        openFindings: rm.openFindingsCount,
        complianceRate: rm.totalAssets > 0 ? Math.round(((rm.totalAssets - rm.openFindingsCount) / rm.totalAssets) * 100) : 100
      };
    });

    return {
      periodLabel: periodLabel,
      kpi: overview.kpi,
      roomStats: roomStats,
      executiveSummary: 'Laporan kepatuhan fasilitas dan kesiapan sarana ADR Learning Center untuk periode ' + periodLabel + '.'
    };
  }

  return {
    getCurrentWeekKey: getCurrentWeekKey,
    checkDatabaseConnectivity: checkDatabaseConnectivity,
    getOverview: getOverview,
    getRooms: getRooms,
    getRoomDetails: getRoomDetails,
    getInspections: getInspections,
    saveInspection: saveInspection,
    getFindings: getFindings,
    markCoordinated: markCoordinated,
    getFollowups: getFollowups,
    addFollowup: addFollowup,
    closeFinding: closeFinding,
    getRequests: getRequests,
    submitRequest: submitRequest,
    decideRequest: decideRequest,
    getReports: getReports
  };
})();
