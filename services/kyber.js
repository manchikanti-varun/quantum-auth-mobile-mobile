/** Kyber (ML-KEM-768) key encapsulation for device registration. NIST FIPS 203. */
import { MlKem768 } from 'mlkem';

const ALGORITHM = 'ML-KEM-768';

function toBase64(uint8) {
  const buf = uint8 instanceof Uint8Array ? Buffer.from(uint8) : uint8;
  return buf.toString('base64');
}

function fromBase64(str) {
  return new Uint8Array(Buffer.from(str, 'base64'));
}

export async function generateKeyPair() {
  const recipient = new MlKem768();
  const [pk, sk] = await recipient.generateKeyPair();
  return {
    publicKey: toBase64(pk),
    privateKey: toBase64(sk),
    algorithm: ALGORITHM,
  };
}

export async function decapsulate(ciphertextBase64, privateKeyBase64) {
  const ct = fromBase64(ciphertextBase64);
  const sk = fromBase64(privateKeyBase64);
  const recipient = new MlKem768();
  const ss = await recipient.decap(ct, sk);
  return toBase64(ss);
}

export { ALGORITHM };
