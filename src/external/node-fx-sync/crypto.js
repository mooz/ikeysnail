module.exports = function (HKDF, crypto) {
  if (!HKDF) HKDF = require('hkdf');
  if (!crypto) crypto = require('crypto');


// useful source: https://github.com/mozilla-services/ios-sync-client/blob/master/Sources/NetworkAndStorage/CryptoUtils.m
  function decryptWBO(keyBundle, wbo) {
    if (!wbo.payload) {
      throw new Error("No payload: nothing to decrypt?");
    }
    var payload = JSON.parse(wbo.payload);
    if (!payload.ciphertext) {
      throw new Error("No ciphertext: nothing to decrypt?");
    }

    if (!keyBundle) {
      throw new Error("A key bundle must be supplied to decrypt.");
    }

    // Authenticate the encrypted blob with the expected HMAC
    var computedHMAC = crypto.createHmac('sha256', keyBundle.hmacKey)
      .update(payload.ciphertext)
      .digest('hex');

    if (computedHMAC != payload.hmac) {
      throw new Error('Incorrect HMAC. Got ' + computedHMAC + '. Expected ' + payload.hmac + '.');
    }

    var iv = Buffer.from(payload.IV, 'base64').slice(0, 16);
    var decipher = crypto.createDecipheriv('aes-256-cbc', keyBundle.encKey, iv)
    var plaintext = decipher.update(payload.ciphertext, 'base64', 'utf8')
    plaintext += decipher.final('utf8');

    var result = JSON.parse(plaintext);

    // Verify that the encrypted id matches the requested record's id.
    if (result.id !== wbo.id) {
      throw new Error("Record id mismatch: " + result.id + " !== " + wbo.id);
    }

    return result;
  }

  function deriveKeys(syncKey) {
    return hkdf(syncKey, "oldsync", undefined, 2 * 32)
      .then(function (bundle) {
        return {
          encKey: bundle.slice(0, 32),
          hmacKey: bundle.slice(32, 64)
        };
      });
  }

  function decryptCollectionKeys(keyBundle, wbo) {
    var decrypted = decryptWBO(keyBundle, wbo);
    return {
      default: {
        encKey: Buffer.from(decrypted.default[0], 'base64'),
        hmacKey: Buffer.from(decrypted.default[1], 'base64')
      }
    };
  }

  function kw(name) {
    return 'identity.mozilla.com/picl/v1/' + name
  }

  function hkdf(km, info, salt, len) {
    return new Promise((resolve, reject) => {
      let df = new HKDF('sha256', salt, km);
      df.derive(kw(info), len, function (key) {
        resolve(key);
      })
    });
  }

  function computeClientState(bytes) {
    var sha = crypto.createHash('sha256');
    return sha.update(bytes).digest().slice(0, 16).toString('hex');
  };

  return {
    decryptWBO: decryptWBO,
    deriveKeys: deriveKeys,
    decryptCollectionKeys: decryptCollectionKeys,
    computeClientState: computeClientState
  };
};
