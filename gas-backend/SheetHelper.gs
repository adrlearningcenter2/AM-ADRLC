/**
 * AM Digital ADR V2 - Sheet Helper Engine
 * 
 * SECURITY & INTEGRITY:
 * 1. Guarantees all read/write operations are performed strictly by HEADER NAME.
 * 2. Caches header mappings to avoid repeated spreadsheet range lookups.
 * 3. Enforces Safe Mode guard at the storage primitive level to prevent accidental writes.
 * 4. Never modifies historical rows outside the target operation.
 */

var SheetHelper = (function() {
  var _headerCache = {};

  function getSpreadsheet() {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  function getSheet(sheetName) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet "' + sheetName + '" tidak ditemukan pada Spreadsheet ID: ' + CONFIG.SPREADSHEET_ID);
    }
    return sheet;
  }

  /**
   * Returns a dictionary mapping Header Name -> 0-based column index.
   */
  function getHeaderMap(sheetName) {
    if (_headerCache[sheetName]) {
      return _headerCache[sheetName];
    }
    var sheet = getSheet(sheetName);
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) {
      throw new Error('Sheet "' + sheetName + '" tidak memiliki baris header.');
    }
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var map = {};
    for (var i = 0; i < headers.length; i++) {
      var headerName = String(headers[i] || '').trim();
      if (headerName) {
        map[headerName] = i;
      }
    }
    _headerCache[sheetName] = map;
    return map;
  }

  var HEADER_ALIASES = {
    'inspection_id': ['inspection_id', 'id_inspeksi', 'id inspeksi', 'ins_id', 'inspection id'],
    'week_key': ['week_key', 'week', 'minggu', 'periode', 'tanggal', 'week key', 'weekkey'],
    'asset_id': ['asset_id', 'unit_id', 'id unit', 'id_unit', 'unit', 'inventaris', 'id inventaris', 'asset id', 'unit id'],
    'room_id': ['room_id', 'room', 'ruangan', 'lokasi', 'room id', 'id ruangan', 'id_ruangan'],
    'checklist_id': ['checklist_id', 'point_id', 'id checklist', 'id_checklist', 'checklist id', 'poin pemeriksaan', 'poin', 'point id'],
    'answer': ['answer', 'jawaban', 'status_jawaban', 'hasil', 'kondisi'],
    'answers_json': ['answers_json', 'answers', 'jawaban_json', 'jawaban json', 'answersjson', 'hasil_json'],
    'checklist_snapshot': ['checklist_snapshot', 'checklist_snap', 'snapshot', 'snapshot_checklist'],
    'note': ['note', 'catatan', 'keterangan', 'notes'],
    'status': ['status', 'status_inspeksi', 'state'],
    'operator_nip': ['operator_nip', 'last_actor_nip', 'nip_operator', 'nip operator', 'operator', 'nip', 'last actor nip'],
    'completed_at': ['completed_at', 'created_at', 'updated_at', 'waktu_selesai', 'tanggal_selesai', 'timestamp', 'waktu'],
    'physical_qty': ['physical_qty', 'jumlah_fisik', 'qty_fisik', 'fisik', 'jumlah standar sementara', 'jumlah fisik'],
    'usable_qty': ['usable_qty', 'jumlah_layak', 'layak_pakai', 'qty_layak', 'layak', 'jumlah layak pakai'],
    'finding_id': ['finding_id', 'id_temuan', 'id temuan', 'fnd_id'],
    'description': ['description', 'deskripsi', 'deskripsi_masalah', 'keterangan_abnormal'],
    'priority': ['priority', 'prioritas'],
    'initial_photo_id': ['initial_photo_id', 'photo_id', 'foto_awal', 'photo_file_id', 'foto']
  };

  function cleanHeaderKey(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function resolveValueFromObject(dataObject, targetHeader) {
    if (!dataObject) return '';
    // 1. Direct key match
    if (dataObject[targetHeader] !== undefined && dataObject[targetHeader] !== null) {
      return dataObject[targetHeader];
    }
    var cleanTarget = cleanHeaderKey(targetHeader);
    
    // 2. Clean case-insensitive match on dataObject keys
    for (var k in dataObject) {
      if (dataObject.hasOwnProperty(k) && cleanHeaderKey(k) === cleanTarget) {
        if (dataObject[k] !== undefined && dataObject[k] !== null) {
          return dataObject[k];
        }
      }
    }

    // 3. Check alias dictionary
    for (var canonical in HEADER_ALIASES) {
      var aliases = HEADER_ALIASES[canonical];
      var matchesCanonical = (cleanTarget === cleanHeaderKey(canonical));
      if (!matchesCanonical) {
        for (var a = 0; a < aliases.length; a++) {
          if (cleanHeaderKey(aliases[a]) === cleanTarget) {
            matchesCanonical = true;
            break;
          }
        }
      }
      if (matchesCanonical) {
        // Try to find any key in dataObject that matches canonical or any alias
        if (dataObject[canonical] !== undefined && dataObject[canonical] !== null) {
          return dataObject[canonical];
        }
        for (var a2 = 0; a2 < aliases.length; a2++) {
          var aliasKey = aliases[a2];
          if (dataObject[aliasKey] !== undefined && dataObject[aliasKey] !== null) {
            return dataObject[aliasKey];
          }
        }
        for (var k2 in dataObject) {
          if (dataObject.hasOwnProperty(k2)) {
            var cK2 = cleanHeaderKey(k2);
            for (var a3 = 0; a3 < aliases.length; a3++) {
              if (cK2 === cleanHeaderKey(aliases[a3])) {
                return dataObject[k2];
              }
            }
          }
        }
      }
    }

    return '';
  }

  /**
   * Reads all data rows and returns an array of plain JavaScript objects { [header]: value }
   * Also populates canonical aliases so consumers can access fields via standard names.
   */
  function readAllRows(sheetName) {
    var sheet = getSheet(sheetName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol < 1) {
      return [];
    }

    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = values[0].map(function(h) { return String(h || '').trim(); });
    var rows = [];

    for (var r = 1; r < values.length; r++) {
      var rowObj = { _rowIndex: r + 1 }; // 1-based index in Sheet
      var hasData = false;
      for (var c = 0; c < headers.length; c++) {
        var hName = headers[c];
        var val = values[r][c];
        if (val !== '' && val !== null && val !== undefined) {
          hasData = true;
        }
        rowObj[hName] = val;

        // Populate canonical aliases for ease of lookup
        var cleanH = cleanHeaderKey(hName);
        for (var canonical in HEADER_ALIASES) {
          var aliases = HEADER_ALIASES[canonical];
          if (cleanH === cleanHeaderKey(canonical)) {
            if (rowObj[canonical] === undefined) rowObj[canonical] = val;
          } else {
            for (var a = 0; a < aliases.length; a++) {
              if (cleanH === cleanHeaderKey(aliases[a])) {
                if (rowObj[canonical] === undefined) rowObj[canonical] = val;
                if (rowObj[aliases[a]] === undefined) rowObj[aliases[a]] = val;
                break;
              }
            }
          }
        }
      }

      if (hasData) {
        rows.push(rowObj);
      }
    }
    return rows;
  }

  /**
   * Appends a single row object by matching properties to the Sheet's exact header order.
   * STRICT SAFE MODE ENFORCEMENT: Never writes to Google Sheets when CONFIG.SAFE_MODE is true.
   */
  function appendRowByHeader(sheetName, dataObject) {
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE_BLOCKED] appendRowByHeader blocked for sheet ' + sheetName + ': ' + JSON.stringify(dataObject));
      return { blocked: true, reason: 'SAFE_MODE_ACTIVE' };
    }

    var sheet = getSheet(sheetName);
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h || '').trim();
    });

    var rowArray = [];
    for (var i = 0; i < headers.length; i++) {
      var headerName = headers[i];
      var val = resolveValueFromObject(dataObject, headerName);
      if (val === undefined || val === null) {
        rowArray.push('');
      } else if (typeof val === 'object') {
        rowArray.push(JSON.stringify(val));
      } else {
        rowArray.push(val);
      }
    }

    sheet.appendRow(rowArray);
    return { success: true };
  }

  /**
   * Updates an existing row by row index and header names.
   * STRICT SAFE MODE ENFORCEMENT: Never updates Google Sheets when CONFIG.SAFE_MODE is true.
   */
  function updateRowByHeader(sheetName, rowIndex, updateFields) {
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE_BLOCKED] updateRowByHeader blocked for sheet ' + sheetName + ' row ' + rowIndex + ': ' + JSON.stringify(updateFields));
      return { blocked: true, reason: 'SAFE_MODE_ACTIVE' };
    }

    var sheet = getSheet(sheetName);
    var headerMap = getHeaderMap(sheetName);

    for (var headerName in updateFields) {
      if (updateFields.hasOwnProperty(headerName) && headerMap.hasOwnProperty(headerName)) {
        var colIdx = headerMap[headerName] + 1; // 1-based column
        var val = updateFields[headerName];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        sheet.getRange(rowIndex, colIdx).setValue(val);
      }
    }
    return { success: true };
  }

  /**
   * Finds the first row matching a key-value condition.
   */
  function findRow(sheetName, headerKey, targetValue) {
    var rows = readAllRows(sheetName);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][headerKey]).trim() === String(targetValue).trim()) {
        return rows[i];
      }
    }
    return null;
  }

  return {
    getSpreadsheet: getSpreadsheet,
    getSheet: getSheet,
    getHeaderMap: getHeaderMap,
    readAllRows: readAllRows,
    appendRowByHeader: appendRowByHeader,
    updateRowByHeader: updateRowByHeader,
    findRow: findRow
  };
})();
