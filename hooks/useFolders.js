/**
 * Folders hook. Manages default and custom folders; add, rename, remove.
 * @module hooks/useFolders
 */
import { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { DEFAULT_FOLDERS } from '../constants/config';

export const useFolders = (token, uid) => {
  const [customFolders, setCustomFolders] = useState([]);

  const loadCustomFolders = async () => {
    if (!uid) return;
    const list = await storage.getCustomFolders(uid);
    setCustomFolders(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    if (!token || !uid) {
      setCustomFolders([]);
      return;
    }
    loadCustomFolders();
  }, [token, uid]);

  const allFolders = [...DEFAULT_FOLDERS, ...customFolders.filter((f) => !DEFAULT_FOLDERS.includes(f))];

  const addFolder = async (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed || allFolders.includes(trimmed)) return;
    const next = [...customFolders, trimmed];
    setCustomFolders(next);
    await storage.saveCustomFolders(next, uid);
  };

  const renameFolder = async (oldName, newName) => {
    const trimmed = String(newName || '').trim();
    if (!trimmed || trimmed === oldName) return;
    const idx = customFolders.indexOf(oldName);
    if (idx === -1) return;
    const next = [...customFolders];
    next[idx] = trimmed;
    setCustomFolders(next);
    await storage.saveCustomFolders(next, uid);
  };

  const removeFolder = async (name) => {
    if (DEFAULT_FOLDERS.includes(name)) return;
    const next = customFolders.filter((f) => f !== name);
    setCustomFolders(next);
    await storage.saveCustomFolders(next, uid);
  };

  return { folders: allFolders, customFolders, addFolder, renameFolder, removeFolder, refreshFolders: loadCustomFolders };
};
