const util = require("ethereumjs-util")
function recover(message, signature) {
  const nonce = "\x19Ethereum Signed Message:\n" + message.length + message;
  const keccak = util.keccak(Buffer.from(nonce));
  const sig = signature;
  const {v, r, s} = util.fromRpcSig(sig);
  const pubKey  = util.ecrecover(util.toBuffer(keccak), v, r, s);
  const addrBuf = util.pubToAddress(pubKey);
  const addr    = util.bufferToHex(addrBuf);
  return addr
}

module.exports = {
  recover
}