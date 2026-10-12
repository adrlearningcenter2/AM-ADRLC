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

  /**
   * Reads all data rows and returns an array of plain JavaScript objects { [header]: value }
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
        var val = values[r][c];
        if (val !== '' && val !== null && val !== undefined) {
          hasData = true;
        }
        rowObj[headers[c]] = val;
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
      var key = headers[i];
      var val = dataObject[key];
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
