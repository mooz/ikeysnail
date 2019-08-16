// external dependencies
module.exports = function (crypto, HKDF, jwcrypto, FxAccountsClient, XHR) {

  const Request = require('./request');
  const Crypto = require('./crypto')(HKDF, crypto);
  const SyncAuth = require('./syncAuth')(Request);

  const FxaUser = require('./fxaUser')(XHR, jwcrypto, FxAccountsClient);
  const FxaSyncAuth = require('./fxaSyncAuth')(FxaUser, Crypto);
  const SyncClient = require('./syncClient')(Request, Crypto);
  const BJSON = require('buffer-json');

  const DEFAULTS = {
    syncAuthUrl: 'https://token.services.mozilla.com',
    fxaServerUrl: 'https://api.accounts.firefox.com/v1',
    // certs last a year
    duration: 3600 * 24 * 365
  };

  function FxSync(creds, options, store) {
    if (!options) options = {};
    this._creds = creds || {};
    this._store = store;
    this._unblockCode = options.unblockCode;

    if (store.getItem("authState")) {
      this.authState = BJSON.parse(store.getItem("authState"));
      this._client = new SyncClient(this.authState);
    }

    var syncAuthUrl = options.syncAuthUrl || DEFAULTS.syncAuthUrl;
    var syncAuth = new SyncAuth(new Request(syncAuthUrl));

    this._fxaSyncAuthClient = new FxaSyncAuth(syncAuth, {
      certDuration: DEFAULTS.duration,
      duration: DEFAULTS.duration,
      audience: syncAuthUrl,
      fxaServerUrl: options.fxaServerUrl || DEFAULTS.fxaServerUrl
    });
  }

  FxSync.prototype.auth = async function (creds) {
    await this._auth(creds);
    return this.authState;
  };

  FxSync.prototype._auth = async function (creds, unblockCode) {
    if (this._client) return this._client.prepare();

    this.authState = await this._fxaSyncAuthClient.auth(
      creds || this._creds,
      unblockCode || this._unblockCode
    );
    // save credentials
    this._store.setItem("authState", BJSON.stringify(this.authState));

    this._client = new SyncClient(this.authState);
    return this._client.prepare();
  };

  FxSync.prototype.fetchIDs = async function (collection, options) {
    await this._auth();
    return this._client.fetchCollection(collection, options);
  };

  FxSync.prototype.fetch = async function (collection, options) {
    if (!options) options = {};
    options.full = true;

    await this._auth();
    return this._client.fetchCollection(collection, options);
  };

  return FxSync;
};
