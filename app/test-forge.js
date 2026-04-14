const forge = require('node-forge');

try {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 0x10001 });
  console.log("Keys generated");
  console.log("Public key pem via publicKeyToRSAPublicKeyPem:");
  console.log(forge.pki.publicKeyToRSAPublicKeyPem(keypair.publicKey));
} catch (e) {
  console.error("Error generating keys:", e.message);
}
