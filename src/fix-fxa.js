const hawk = require('fxa-js-client/client/lib/hawk');
// const hawk = require("hawk");
const Request = require('fxa-js-client/client/lib/request');

function log(message) {
  console.log(message);
}


/* Request.prototype.send = function request(
  path,
  method,
  credentials,
  jsonPayload,
  options
) { */


Request.prototype.send = function request(
  path,
  method,
  credentials,
  jsonPayload,
  options
) {
  // Quick shim for xhr
  const customHeader = {};
  const xhr = {
    setRequestHeader: (key, value) => {
      customHeader[key] = value;
    }
  };

  // Info
  var uri = this.baseUri + path;
  var payload = null;
  var self = this;
  options = options || {};

  log("EndPoint: " + uri);

  if (jsonPayload) {
    payload = JSON.stringify(jsonPayload);
  }

  log("payload: " + payload);

  // calculate Hawk header if credentials are supplied
  if (credentials) {
    var hawkHeader = hawk.client.header(uri, method, {
      credentials: credentials,
      payload: payload,
      contentType: 'application/json',
      localtimeOffsetMsec: self._localtimeOffsetMsec || 0,
    });
    console.log("Hawk field / header");
    console.log(hawkHeader);
    xhr.setRequestHeader('authorization', hawkHeader.field);
  }
  xhr.setRequestHeader('Content-Type', 'application/json');

  if (options && options.headers) {
    // set extra headers for this request
    for (let header in options.headers) {
      xhr.setRequestHeader(header, options.headers[header]);
    }
  }

  return new Promise((resolve, reject) => {
    // TODO: handle rejection
    $http.request({
      method: method,
      url: this.baseUri + path,
      header: customHeader,
      body: payload ? JSON.parse(payload) : null,
      handler: (response) => {
        log("Got response");
        log(response);
        resolve(response);
      }
    });
  });
};

exports.FxAccountClient = require("fxa-js-client/client/FxAccountClient");
