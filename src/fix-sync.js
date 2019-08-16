const { FxAccountClient } = require("fix-fxa");
const FxSync = require("external/node-fx-sync")(null, null, null, FxAccountClient, {});

const hawk = require('fxa-js-client/client/lib/hawk');
const hawkClient = hawk.client;
const Request = require('external/node-fx-sync/request');

Request.prototype.request = function request(path, options) {
  console.log("Request called!!");

  return new Promise((resolve, reject) => {
    console.log("Promise started");

    // Quick shim for xhr
    const customHeader = {};
    const xhr = {
      setRequestHeader: (key, value) => {
        customHeader[key] = value;
      }
    };

    var uri = this.baseUrl + path;

    console.log("OK, request: " + uri);

    var credentials = options.credentials || this.credentials;
    var payload;

    if (options.json) {
      payload = JSON.stringify(options.json);
    }

    console.log("payload: " + payload);

    // calculate Hawk header if credentials are supplied
    if (credentials) {
      let authHeader = hawkClient.header(uri, options.method, {
        credentials: credentials,
        payload: payload,
        contentType: "application/json"
      });
      xhr.setRequestHeader("authorization", authHeader.header);
    }
    for (let header in options.headers) {
      xhr.setRequestHeader(header, options.headers[header]);
    }
    xhr.setRequestHeader("Content-Type", "application/json");

    console.log("Content-type: " + " type");

    // TODO: Error handling!
    // xhr.onload = function onload() {
    //   let result;
    //   if (xhr.responseText === 'Unauthorized') return reject(xhr);
    //   try {
    //     result = JSON.parse(xhr.responseText);
    //   } catch (e) {
    //     return reject(xhr);
    //   }
    //   if (result.error || xhr.status >= 400) {
    //     return reject(JSON.stringify({error: result.error, status: xhr.status}));
    //   }

    try {
      $http.request({
        method: options.method,
        url: uri,
        header: customHeader,
        body: JSON.parse(payload),
        handler: (response) => {
          log("Got response (sync)");
          log(response);
          resolve(response);
        }
      });
    } catch (x) {
      console.log("Error in sync: " + x);
    }
  });
};

exports.FxSync = FxSync;
exports.FxAccountClient = FxAccountClient;
