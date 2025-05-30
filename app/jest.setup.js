// Polyfill the Request global if not already defined.
if (typeof Request === "undefined") {
  // node-fetch exports Request among other things.
  global.Request = require("node-fetch").Request;
}