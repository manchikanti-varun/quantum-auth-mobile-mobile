/**
 * Folders hook. Manages default and custom folders; add, rename, remove, reorder.
 * @module hooks/useFolders
 */
import { useState, useEffect } from 'react';
import { storage } from '../services/storage';
export const useFolders = (token, uid) => {
  const [customFolders, setCustomFolders] = useState([]);
  const [folderOrder, setFolderOrderState] = useState(null);

  const loadFolders = async () => {
    if (!uid) return;
    const [list, order] = await Promise.all([
      storage.getCustomFolders(uid),
      storage.getFolderOrder(uid),
    ]);
    const cf = Array.isArray(list) ? list : [];
    setCustomFolders(cf);
    setFolderOrderState(Array.isArray(order) && order.length > 0 ? order : null);
  };

  useEffect(() => {
    if (!token || !uid) {
      setCustomFolders([]);
      setFolderOrderState(null);
      return;
    }
    loadFolders();
  }, [token, uid]);

  const allFolderNames = customFolders;
  const allFolders = folderOrder
    ? [...folderOrder.filter((f) => allFolderNames.includes(f)), ...allFolderNames.filter((f) => !folderOrder.includes(f))]
    : allFolderNames;

  const addFolder = async (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed || allFolders.includes(trimmed)) return;
    const nextCf = [...customFolders, trimmed];
    setCustomFolders(nextCf);
    await storage.saveCustomFolders(nextCf, uid);
    const nextOrder = [...allFolders, trimmed];
    setFolderOrderState(nextOrder);
    await storage.saveFolderOrder(nextOrder, uid);
  };

  const renameFolder = async (oldName, newName) => {
    const trimmed = String(newName || '').trim();
    if (!trimmed || trimmed === oldName) return;
    const idx = customFolders.indexOf(oldName);
    if (idx === -1) return;
    const nextCf = [...customFolders];
    nextCf[idx] = trimmed;
    setCustomFolders(nextCf);
    await storage.saveCustomFolders(nextCf, uid);
    if (folderOrder && folderOrder.includes(oldName)) {
      const nextOrder = folderOrder.map((f) => (f === oldName ? trimmed : f));
      setFolderOrderState(nextOrder);
      await storage.saveFolderOrder(nextOrder, uid);
    }
  };

  const removeFolder = async (name) => {
    const nextCf = customFolders.filter((f) => f !== name);
    setCustomFolders(nextCf);
    await storage.saveCustomFolders(nextCf, uid);
    if (folderOrder && folderOrder.includes(name)) {
      const nextOrder = folderOrder.filter((f) => f !== name);
      setFolderOrderState(nextOrder);
      await storage.saveFolderOrder(nextOrder, uid);
    }
  };

  const reorderFolders = async (newOrder) => {
    if (!Array.isArray(newOrder) || newOrder.length === 0) return;
    setFolderOrderState(newOrder);
    await storage.saveFolderOrder(newOrder, uid);
  };

  return { folders: allFolders, customFolders, addFolder, renameFolder, removeFolder, reorderFolders, refreshFolders: loadFolders };
};
