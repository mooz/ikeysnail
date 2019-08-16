
var jsBigInteger = BigInteger;
var nativeBigInteger = null;

BigInteger.prototype.toBase64URL = function() {
  var s = this.toBase64();
  s = s.split('=')[0]; // Remove any trailing '='s
  s = s.replace(/\+/g, '-'); // 62nd char of encoding
  s = s.replace(/\//g, '_'); // 63rd char of encoding
  return s;
};
