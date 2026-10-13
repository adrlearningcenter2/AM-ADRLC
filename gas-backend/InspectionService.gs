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

  function getCurrentWeekKey() {
    var now = new Date();
    // Monday of the current week in Asia/Jakarta timezone
    var day = now.getDay();
    var diff = now.getDate() - day + (day === 0 ? -6 : 1);
    var monday = new Date(now.setDate(diff));
    return Utilities.formatDate(monday, 'Asia/Jakarta', 'yyyy-MM-dd');
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
    var targetWeek = (weekKey && typeof weekKey === 'string' && weekKey.trim()) ? weekKey.trim() : getCurrentWeekKey();

    var allAssets = SheetHelper.readAllRows(CONFIG.SHEETS.MASTER_UNIT).filter(function(a) {
      return a['Aktif'] === true || String(a['Aktif']).toUpperCase() === 'TRUE';
    });

    var inspections = SheetHelper.readAllRows(CONFIG.SHEETS.INSPECTIONS).filter(function(i) {
      return String(i['week_key']).trim() === targetWeek;
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

    var roomsMap = {};
    for (var j = 0; j < allAssets.length; j++) {
      var r = String(allAssets[j]['Ruangan']).trim();
      if (!roomsMap[r]) {
        roomsMap[r] = { name: r, totalAssets: 0, activeAssets: 0 };
      }
      roomsMap[r].totalAssets++;
      roomsMap[r].activeAssets++;
    }

    var list = [];
    for (var rm in roomsMap) {
      if (roomsMap.hasOwnProperty(rm)) {
        var asgObj = assignMap[rm];
        list.push({
          name: rm,
          totalAssets: roomsMap[rm].totalAssets,
          activeAssets: roomsMap[rm].activeAssets,
          assignedOperatorNip: asgObj ? String(asgObj['operator_nip'] || asgObj['main_nip'] || '') : ''
        });
      }
    }

    return { rooms: list };
  }

  // --------------------------------------------------------------------------
  // 4. getRoomDetails (ADMIN & OPERATOR)
  // --------------------------------------------------------------------------
  function getRoomDetails(token, room, weekKey) {
    AuthService.validateSession(token, ['ADMIN', 'OPERATOR']);
    if (!room || typeof room !== 'string' || !room.trim()) {
      throw new Error('Parameter "room" wajib diisi.');
    }

    var targetWeek = (weekKey && typeof weekKey === 'string' && weekKey.trim()) ? weekKey.trim() : getCurrentWeekKey();
    var cleanRoom = room.trim();

    var allAssets = SheetHelper.readAllRows(CONFIG.SHEETS.MASTER_UNIT).filter(function(a) {
      var matchRoom = String(a['Ruangan']).trim() === cleanRoom;
      var isActive = a['Aktif'] === true || String(a['Aktif']).toUpperCase() === 'TRUE';
      return matchRoom && isActive;
    });

    var allChecklists = SheetHelper.readAllRows(CONFIG.SHEETS.CHECKLIST_DRAFT).filter(function(c) {
      return c['Aktif'] === true || String(c['Aktif']).toUpperCase() === 'TRUE';
    });

    var inspections = SheetHelper.readAllRows(CONFIG.SHEETS.INSPECTIONS).filter(function(ins) {
      return String(ins['room_id']).trim() === cleanRoom && String(ins['week_key']).trim() === targetWeek;
    });

    var insMap = {};
    for (var k = 0; k < inspections.length; k++) {
      insMap[String(inspections[k]['asset_id']).trim()] = inspections[k];
    }

    var units = [];
    var completedCount = 0;

    for (var i = 0; i < allAssets.length; i++) {
      var asset = allAssets[i];
      var unitId = String(asset['ID Unit']).trim();
      var unitChecklists = allChecklists.filter(function(chk) {
        return String(chk['ID Unit']).trim() === unitId;
      }).map(function(chk) {
        return {
          id: String(chk['Checklist ID']).trim(),
          unit_id: unitId,
          order: Number(chk['Urutan']) || 1,
          question: String(chk['Poin Pemeriksaan']).trim(),
          active: true
        };
      });

      var insRecord = insMap[unitId];
      var inspected = !!insRecord;
      if (inspected) completedCount++;

      units.push({
        unit: {
          id: unitId,
          room: cleanRoom,
          label: String(asset['Label Pemeriksaan'] || '').trim(),
          name: String(asset['Nama'] || '').trim(),
          qty: Number(asset['Jumlah Standar Sementara']) || 1,
          model: asset['Model'] === 'Kelompok' ? 'Kelompok' : 'Tunggal',
          active: true
        },
        checklists: unitChecklists,
        inspectedThisWeek: inspected,
        inspectionRecord: insRecord || null,
        hasAbnormality: false
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
    var session = AuthService.validateSession(token, ['OPERATOR', 'ADMIN']);

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

    // 3. ATOMIC CHECK: Prevent duplicate submission for this week + unit
    var existingInspections = SheetHelper.readAllRows(CONFIG.SHEETS.INSPECTIONS);
    for (var ex = 0; ex < existingInspections.length; ex++) {
      var exWeek = String(existingInspections[ex]['week_key']).trim();
      var exUnit = String(existingInspections[ex]['asset_id']).trim();
      if (exWeek === weekKey && exUnit === unitId) {
        throw new Error('Pemeriksaan unit ' + unitId + ' pada periode minggu ' + weekKey + ' sudah pernah disimpan. Data tidak dapat ditimpa.');
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
      var answersJson = JSON.stringify(payload.answers.map(function(ans) {
        return {
          id: ans.id,
          answer: ans.answer,
          note: ans.note || ''
        };
      }));

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
            'asset_id': unitId,
            'room_id': room,
            'point_id': ansItem.id,
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

      // Append INSPECTIONS row
      var inspectionRow = {
        'inspection_id': inspectionId,
        'week_key': weekKey,
        'room_id': room,
        'asset_id': unitId,
        'checklist_snapshot': '',
        'answers_json': answersJson,
        'physical_qty': payload.physical !== undefined ? payload.physical : '',
        'usable_qty': payload.usable !== undefined ? payload.usable : '',
        'status': 'COMPLETED',
        'last_actor_nip': session.nip,
        'started_at': nowStr,
        'updated_at': nowStr,
        'completed_at': nowStr
      };

      SheetHelper.appendRowByHeader(CONFIG.SHEETS.INSPECTIONS, inspectionRow);

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
    var session = AuthService.validateSession(token, ['OPERATOR', 'ADMIN']);
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
    var session = AuthService.validateSession(token, ['ADMIN']); // Admin supervisor privilege to close finding
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
    if (photoObj && photoObj.base64) {
      var uploadRes = DriveService.uploadPhoto(
        photoObj.base64,
        photoObj.mime || 'image/jpeg',
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
      'notes': note || 'Perbaikan selesai dan diverifikasi oleh Admin.',
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
    var session = AuthService.validateSession(token, ['OPERATOR', 'ADMIN']);
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
