/**
 * PIN hashing – SHA256 with salt for app lock; verify against stored hash.
 */
/**
 * PIN hashing – SHA256 with salt for app lock; verify against stored hash.
 */
import * as Crypto from 'expo-crypto';

const SALT = 'QSAFE_PIN_SALT_V1';

export async function hashPin(pin) {
  if (!pin || typeof pin !== 'string') return null;
  const toHash = SALT + ':' + pin;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    toHash,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
}

export async function verifyPin(pin, storedHash) {
  if (!pin || !storedHash) return false;
  const computed = await hashPin(pin);
  return computed === storedHash;
}
