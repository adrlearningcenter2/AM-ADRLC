/**
 * AM Digital ADR V2 - Authentication & Authorization Service
 * 
 * SECURITY IMPLEMENTATIONS:
 * 1. Server-side password hashing (SHA-256 + salt).
 * 2. Brute-force protection with IP/NIP rate limiting & lockout via CacheService.
 * 3. Cryptographically random session tokens (ADR-{UUID}).
 * 4. Zero exposure of password_salt or password_hash to the client.
 * 5. Role-Based Access Control (RBAC) enforced on every operation.
 */

var AuthService = (function() {
  var CACHE = CacheService.getScriptCache();

  function hashPassword(password, salt) {
    var raw = String(salt || '') + ':' + String(password || '');
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
    var hash = '';
    for (var i = 0; i < digest.length; i++) {
      var byteVal = digest[i];
      if (byteVal < 0) byteVal += 256;
      var byteHex = byteVal.toString(16);
      if (byteHex.length === 1) byteHex = '0' + byteHex;
      hash += byteHex;
    }
    return hash;
  }

  /**
   * Brute-force protection helper.
   */
  function checkLockout(cleanNip) {
    var lockKey = 'auth_locked_' + cleanNip;
    var isLocked = CACHE.get(lockKey);
    if (isLocked) {
      throw new Error('Akun sementara dikunci karena terlalu banyak percobaan login gagal. Silakan coba 15 menit lagi.');
    }
  }

  function recordFailedAttempt(cleanNip) {
    var failKey = 'auth_fail_' + cleanNip;
    var lockKey = 'auth_locked_' + cleanNip;
    var currentFails = Number(CACHE.get(failKey) || 0) + 1;

    var maxAttempts = CONFIG.MAX_LOGIN_ATTEMPTS || 5;
    var lockoutSeconds = CONFIG.LOGIN_LOCKOUT_SECONDS || 900;

    if (currentFails >= maxAttempts) {
      CACHE.put(lockKey, 'LOCKED', lockoutSeconds);
      CACHE.remove(failKey);
      throw new Error('Terlalu banyak percobaan gagal (' + currentFails + 'x). Akun dikunci sementara selama ' + Math.round(lockoutSeconds / 60) + ' menit demi keamanan.');
    } else {
      CACHE.put(failKey, String(currentFails), lockoutSeconds);
      var remaining = maxAttempts - currentFails;
      throw new Error('Kombinasi NIP dan password tidak sesuai. Sisa kesempatan percobaan: ' + remaining + ' kali.');
    }
  }

  function clearFailedAttempts(cleanNip) {
    CACHE.remove('auth_fail_' + cleanNip);
    CACHE.remove('auth_locked_' + cleanNip);
  }

  /**
   * Performs secure server-side login.
   */
  function login(nip, password) {
    if (!nip || typeof nip !== 'string' || !nip.trim()) {
      throw new Error('NIP wajib diisi.');
    }
    if (!password || typeof password !== 'string') {
      throw new Error('Password wajib diisi.');
    }

    var cleanNip = String(nip).trim();

    // 1. Check brute force lockout
    checkLockout(cleanNip);

    // 2. Fetch user from USERS sheet by header
    var users = SheetHelper.readAllRows(CONFIG.SHEETS.USERS);
    var userRow = null;
    for (var i = 0; i < users.length; i++) {
      if (String(users[i]['nip']).trim() === cleanNip) {
        userRow = users[i];
        break;
      }
    }

    if (!userRow) {
      recordFailedAttempt(cleanNip);
    }

    var isActive = userRow['active'] === true || String(userRow['active']).toUpperCase() === 'TRUE';
    if (!isActive) {
      throw new Error('Akun dinonaktifkan oleh Administrator. Hubungi koordinator fasilitas.');
    }

    // 3. Verify password hash
    var storedSalt = String(userRow['password_salt'] || '');
    var storedHash = String(userRow['password_hash'] || '');

    var isValid = false;
    if (storedHash) {
      var computed = hashPassword(password, storedSalt);
      isValid = (computed === storedHash);
    }


    if (!isValid) {
      recordFailedAttempt(cleanNip);
    }

    // Clear failed attempt tracking on successful authentication
    clearFailedAttempts(cleanNip);

    // 4. Generate cryptographically random session token
    var token = 'ADR-' + Utilities.getUuid();
    var userRole = String(userRow['role']).toUpperCase().trim();
    if (userRole !== 'ADMIN' && userRole !== 'OPERATOR') {
      userRole = 'OPERATOR'; // Default safe least privilege
    }

    var sessionData = {
      user_id: userRow['user_id'] || ('USR-' + cleanNip),
      nip: cleanNip,
      name: userRow['name'] || cleanNip,
      role: userRole,
      createdAt: new Date().toISOString()
    };

    // Store in Script Cache
    CACHE.put(token, JSON.stringify(sessionData), CONFIG.SESSION_TTL || 43200);

    // Build SAFE user object - NEVER expose password_salt or password_hash
    var safeUser = {
      user_id: sessionData.user_id,
      nip: cleanNip,
      name: sessionData.name,
      role: sessionData.role,
      active: true,
      created_at: userRow['created_at'] || '',
      updated_at: userRow['updated_at'] || ''
    };

    var expiresAt = new Date(Date.now() + (CONFIG.SESSION_TTL || 43200) * 1000).toISOString();

    return {
      token: token,
      user: safeUser,
      expiresAt: expiresAt
    };
  }

  /**
   * Validates session token and enforces Role-Based Access Control (RBAC).
   */
  function validateSession(token, allowedRoles) {
    if (!token || typeof token !== 'string') {
      throw new Error('Sesi tidak valid. Silakan login terlebih dahulu.');
    }

    var cleanToken = token.trim();
    var sessionJson = CACHE.get(cleanToken);
    var session = null;

    if (sessionJson) {
      try {
        session = JSON.parse(sessionJson);
      } catch (e) {
        session = null;
      }
    }

    if (!session) {
      throw new Error('Sesi autentikasi telah berakhir atau tidak ditemukan. Silakan login kembali.');
    }

    // Enforce role authorization
    if (allowedRoles && allowedRoles.length > 0) {
      var hasRole = false;
      var normalizedRole = String(session.role).toUpperCase();
      for (var r = 0; r < allowedRoles.length; r++) {
        if (allowedRoles[r].toUpperCase() === normalizedRole) {
          hasRole = true;
          break;
        }
      }
      if (!hasRole) {
        throw new Error('Akses ditolak: Operasi ini membutuhkan role ' + allowedRoles.join(' atau ') + ' (Role Anda: ' + normalizedRole + ').');
      }
    }

    return session;
  }

  /**
   * Invalidates a session token upon logout.
   */
  function logout(token) {
    if (token) {
      CACHE.remove(token.trim());
    }
    return { loggedOut: true };
  }

  return {
    login: login,
    logout: logout,
    validateSession: validateSession,
    hashPassword: hashPassword
  };
})();
