
module.exports = function(Request) {
if (!Request) Request = require('./request');

/* Sync Auth
 *
 * Uses the auth flow described here:
 *    https://docs.services.mozilla.com/token/user-flow.html
 */
function SyncAuth(tokenServerClient) {
  if (typeof tokenServerClient === 'string') {
    tokenServerClient = new Request(tokenServerClient);
  }
  this.tokenServerClient = tokenServerClient;
}

/* Auth
 *
 * @param assertion Serialized BrowserID assertion
 * @param clientState hex(first16Bytes(sha256(kBbytes)))
 *
 * @return Promise result resolves to:
 * {
 *  key: sync 1.5 Hawk key
 *  id: sync 1.5 Hawk id
 *  api_endpoint: sync 1.5 storage server uri
 * }
 */

SyncAuth.prototype.auth = function(assertion, clientState) {
  return this.tokenServerClient.get('/1.0/sync/1.5', {
      headers: {
        Authorization: "BrowserID " + assertion,
        'X-Client-State': clientState,
        Accept: "application/json"
      },
      json: true
    })
    .then(function(result) {
      this.token = result;
      return result;
    }.bind(this));
};

return SyncAuth;

};

