/**
 * Encrypted backup storage on device. Saves and loads backups from app document directory.
 * @module services/backupStorage
 */
import * as FileSystem from 'expo-file-system';

const BACKUP_DIR = 'QSafeBackups';

function getBackupDir() {
  return `${FileSystem.documentDirectory}${BACKUP_DIR}/`;
}

export async function ensureBackupDir() {
  const dir = getBackupDir();
  const exists = await FileSystem.getInfoAsync(dir, { type: 'dir' });
  if (!exists.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export async function saveEncryptedBackup(encryptedData) {
  const dir = await ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `qsafe-backup-${timestamp}.enc`;
  const path = `${dir}${filename}`;
  await FileSystem.writeAsStringAsync(path, encryptedData, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return { path, filename };
}

export async function listSavedBackups() {
  try {
    const dir = await ensureBackupDir();
    const items = await FileSystem.readDirectoryAsync(dir);
    const backups = items
      .filter((f) => f.endsWith('.enc'))
      .map((f) => {
        const fullPath = `${dir}${f}`;
        return { filename: f, path: fullPath };
      })
      .sort((a, b) => b.filename.localeCompare(a.filename));
    return backups;
  } catch (e) {
    return [];
  }
}

export async function loadEncryptedBackup(path) {
  const content = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return content;
}

export async function deleteBackup(path) {
  const exists = await FileSystem.getInfoAsync(path, { type: 'file' });
  if (exists.exists) {
    await FileSystem.deleteAsync(path);
  }
}
