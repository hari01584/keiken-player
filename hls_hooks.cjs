module.exports = {
  "redirect_final": function(url) {
    return url.replace("http://localhost:4541/", "/.proxy/api/bypass?url=");
  }
};
console.log("hls_hooks.js loaded");
