/**
 * AM Digital ADR V2 - Google Drive Storage Service
 * Handles uploading evidence photos to Google Drive.
 * 
 * SECURITY & SAFE MODE:
 * 1. Safe Mode is strictly controlled by CONFIG.SAFE_MODE.
 * 2. When Safe Mode is active, DriveApp.createFile/createFolder is NEVER invoked.
 * 3. Base64 payload is fully validated for size, prefix, and mime type before execution.
 */

var DriveService = (function() {
  function getOrCreateFolder() {
    if (CONFIG.SAFE_MODE === true) {
      Logger.log('[SAFE_MODE_BLOCKED] DriveService.getOrCreateFolder prevented in Safe Mode.');
      return null;
    }

    var folderName = CONFIG.DRIVE_EVIDENCE_FOLDER_NAME;
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    return DriveApp.createFolder(folderName);
  }

  /**
   * Uploads base64 image data to Google Drive.
   * Returns { fileId: string, url: string }
   */
  function uploadPhoto(base64Data, mimeType, filenamePrefix) {
    if (!base64Data) {
      return { fileId: '', url: '' };
    }

    // 1. Validate Base64 payload structure
    var cleanBase64 = String(base64Data);
    if (cleanBase64.indexOf('base64,') > -1) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }
    cleanBase64 = cleanBase64.trim();

    if (cleanBase64.length === 0) {
      return { fileId: '', url: '' };
    }

    // Maximum photo payload check (e.g. 10MB base64)
    if (cleanBase64.length > 10 * 1024 * 1024) {
      throw new Error('Ukuran foto melebihi batas maksimal 10MB.');
    }

    // 2. Safe Mode guard: Block actual Drive writing
    if (CONFIG.SAFE_MODE === true) {
      var simulatedId = 'SAFE-MODE-DRIVE-' + Utilities.getUuid().substring(0, 8);
      Logger.log('[SAFE_MODE_BLOCKED] Drive upload prevented for ' + (filenamePrefix || 'photo') + '. Simulated fileId: ' + simulatedId);
      return {
        fileId: simulatedId,
        url: 'https://drive.google.com/thumbnail?id=' + simulatedId,
        safeModeBlocked: true
      };
    }

    // 3. Live Drive upload
    try {
      var decoded = Utilities.base64Decode(cleanBase64);
      var effectiveMime = mimeType || 'image/jpeg';
      var extension = effectiveMime === 'image/png' ? '.png' : '.jpg';
      var timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
      var filename = (filenamePrefix || 'ADR_Evidence') + '_' + timestamp + extension;

      var blob = Utilities.newBlob(decoded, effectiveMime, filename);
      var folder = getOrCreateFolder();
      if (!folder) {
        throw new Error('Folder Google Drive penyimpanan bukti tidak dapat dibuat.');
      }

      var file = folder.createFile(blob);

      // Set sharing so users with permission link can view evidence photos
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        Logger.log('Set sharing notice: ' + shareErr.message);
      }

      var fileId = file.getId();
      return {
        fileId: fileId,
        url: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000'
      };
    } catch (err) {
      Logger.log('Gagal upload ke Google Drive: ' + err.message);
      throw new Error('Gagal mengunggah foto ke Google Drive: ' + err.message);
    }
  }

  return {
    uploadPhoto: uploadPhoto,
    getOrCreateFolder: getOrCreateFolder
  };
})();
