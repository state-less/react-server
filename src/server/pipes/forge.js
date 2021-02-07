var forge = require('node-forge');
var fs = require('fs');
 
// openssl enc -des3 -in input.txt -out input.enc
const encrypt = (password) => input => {
  // 3DES key and IV sizes
  var keySize = 24;
  var ivSize = 8;
 
  // get derived bytes
  // Notes:
  // 1. If using an alternative hash (eg: "-md sha1") pass
  //   "forge.md.sha1.create()" as the final parameter.
  // 2. If using "-nosalt", set salt to null.
  var salt = forge.random.getBytesSync(8);
  // var md = forge.md.sha1.create(); // "-md sha1"
  var derivedBytes = forge.pbe.opensslDeriveBytes(
    password, salt, keySize + ivSize/*, md*/);
  var buffer = forge.util.createBuffer(derivedBytes);
  var key = buffer.getBytes(keySize);
  var iv = buffer.getBytes(ivSize);
 
  var cipher = forge.cipher.createCipher('3DES-CBC', key);
  cipher.start({iv: iv});
  cipher.update(forge.util.createBuffer(input, 'binary'));
  cipher.finish();
 
  var output = forge.util.createBuffer();
 
  // if using a salt, prepend this to the output:
  if(salt !== null) {
    output.putBytes('Salted__'); // (add to match openssl tool output)
    output.putBytes(salt);
  }
  output.putBuffer(cipher.output);
 
  return  output.getBytes();
}
 
// openssl enc -d -des3 -in input.enc -out input.dec.txt
const decrypt = (password) => (input) => {
  // parse salt from input
  input = forge.util.createBuffer(input, 'binary');
  // skip "Salted__" (if known to be present)
  input.getBytes('Salted__'.length);
  // read 8-byte salt
  var salt = input.getBytes(8);
 
  // Note: if using "-nosalt", skip above parsing and use
  // var salt = null;
 
  // 3DES key and IV sizes
  var keySize = 24;
  var ivSize = 8;
 
  var derivedBytes = forge.pbe.opensslDeriveBytes(
    password, salt, keySize + ivSize);
  var buffer = forge.util.createBuffer(derivedBytes);
  var key = buffer.getBytes(keySize);
  var iv = buffer.getBytes(ivSize);
 
  var decipher = forge.cipher.createDecipher('3DES-CBC', key);
  decipher.start({iv: iv});
  decipher.update(input);
  var result = decipher.finish(); // check 'result' for true/false
 
  return decipher.output.getBytes();
}

module.exports = {
    encrypt, decrypt
}