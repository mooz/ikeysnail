module.exports = function (FxaUser, Crypto) {
  if (!FxaUser) FxaUser = require('./fxaUser')();
  if (!Crypto) Crypto = require('./crypto')();

  function FxaSyncAuth(syncAuth, options) {
    this.syncAuth = syncAuth;
    this.options = options;
  }

  FxaSyncAuth.prototype.auth = async function (creds, unblockCode) {
    let user = new FxaUser(creds, this.options);
    await user.setup(unblockCode);
    this.keys = user.syncKey;

    let assertion = await user.getAssertion(this.options.audience, this.options.duration);
    let clientState = Crypto.computeClientState(user.syncKey);
    let token = await this.syncAuth.auth(assertion, clientState);

    return {
      token: token,
      keys: this.keys,
      credentials: {
        sessionToken: user.creds.sessionToken,
        keyPair: user._keyPair
      }
    };
  };

  return FxaSyncAuth;
};
