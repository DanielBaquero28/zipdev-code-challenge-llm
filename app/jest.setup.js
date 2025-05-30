const fetch = require('node-fetch');

if (typeof Request === "undefined") {
  global.Request = fetch.Request;
}
if (typeof Response === "undefined") {
  global.Response = fetch.Response;
}
if (typeof Headers === "undefined") {
  global.Headers = fetch.Headers;
}