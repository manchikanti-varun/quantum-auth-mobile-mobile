/**
 * AES-256 encryption for backup export/import.
 * Uses crypto-js with PBKDF2 key derivation.
 * @module utils/backupEncryption
 */
import CryptoJS from 'crypto-js';

const ENC_PREFIX = 'QSAFE_ENC:';

export function encryptBackup(plainJson, password) {
  if (!password || typeof password !== 'string' || password.trim().length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  const encrypted = CryptoJS.AES.encrypt(plainJson, password.trim()).toString();
  return ENC_PREFIX + encrypted;
}

export function decryptBackup(encryptedPayload, password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password required');
  }
  const str = encryptedPayload.startsWith(ENC_PREFIX)
    ? encryptedPayload.slice(ENC_PREFIX.length)
    : encryptedPayload;
  const bytes = CryptoJS.AES.decrypt(str, password.trim());
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) throw new Error('Wrong password or corrupted data');
  return decrypted;
}

export function isEncryptedBackup(data) {
  return typeof data === 'string' && data.trim().startsWith(ENC_PREFIX);
}
