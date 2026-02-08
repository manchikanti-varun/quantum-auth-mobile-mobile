/** TOTP accounts: load, persist, codes every second. Favorites, folders, sort, last-used. */
import { useState, useEffect } from 'react';
import { generateTOTP, generateTOTPWithAdjacent, getTimeRemainingInWindow } from '../services/totp';
import { storage } from '../services/storage';

export const useAccounts = (token, uid) => {
  const [accounts, setAccounts] = useState([]);
  const [totpCodes, setTotpCodes] = useState({});
  const [totpAdjacent, setTotpAdjacent] = useState({});
  const [totpSecondsRemaining, setTotpSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!token || !uid) {
      setAccounts([]);
      return;
    }
    loadAccounts();
  }, [token, uid]);

  const loadAccounts = async () => {
    if (!uid) return;
    const loaded = await storage.getAccounts(uid);
    const migrated = loaded.map((a, i) => ({
      ...a,
      favorite: a.favorite ?? false,
      folder: a.folder ?? 'Personal',
      notes: a.notes ?? '',
      lastUsed: a.lastUsed ?? 0,
      order: a.order ?? i,
    }));
    migrated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setAccounts(migrated);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!accounts.length) return;
      setTotpSecondsRemaining(getTimeRemainingInWindow());
      const updated = {};
      const adjacentUpdated = {};
      accounts.forEach((acc, index) => {
        const key = acc.id || `fallback-${acc.issuer}-${acc.label}-${index}`;
        try {
          if (!acc.secret) {
            updated[key] = '------';
            return;
          }
          const secret = String(acc.secret).trim().replace(/\s/g, '');
          if (!secret) {
            updated[key] = '------';
            return;
          }
          const { current, prev, next } = generateTOTPWithAdjacent(secret);
          updated[key] = current;
          adjacentUpdated[key] = { prev, next };
        } catch (e) {
          updated[key] = '------';
          adjacentUpdated[key] = { prev: '------', next: '------' };
        }
      });
      setTotpCodes(updated);
      setTotpAdjacent(adjacentUpdated);
    }, 1000);

    return () => clearInterval(interval);
  }, [accounts]);

  const addAccount = async (account) => {
    const maxOrder = accounts.reduce((m, a) => Math.max(m, a.order ?? 0), -1);
    const withMeta = { ...account, favorite: false, folder: account.folder ?? 'Personal', notes: account.notes ?? '', lastUsed: Date.now(), order: maxOrder + 1 };
    const next = [...accounts, withMeta];
    setAccounts(next);
    try {
      await storage.saveAccounts(next, uid);
    } catch (e) {
      setAccounts(accounts);
      throw e;
    }
  };

  const removeAccount = async (accountId) => {
    const next = accounts.map((acc) => {
      if (acc.id === accountId) {
        return { ...acc, secret: '0'.repeat(32), issuer: '', label: '' };
      }
      return acc;
    });
    const filtered = next.filter((acc) => acc.id !== accountId);
    setAccounts(filtered);
    await storage.saveAccounts(filtered, uid);
  };

  const toggleFavorite = async (accountId) => {
    const next = accounts.map((a) => (a.id === accountId ? { ...a, favorite: !a.favorite } : a));
    setAccounts(next);
    await storage.saveAccounts(next, uid);
  };

  const updateAccount = async (accountId, updates) => {
    const next = accounts.map((a) => (a.id === accountId ? { ...a, ...updates } : a));
    setAccounts(next);
    await storage.saveAccounts(next, uid);
  };

  const updateAccountsBatch = async (updatesList) => {
    if (!Array.isArray(updatesList) || updatesList.length === 0) return;
    const byId = new Map(updatesList.map((u) => [u.id, u.updates]));
    const next = accounts.map((a) => {
      const u = byId.get(a.id);
      return u ? { ...a, ...u } : a;
    });
    setAccounts(next);
    await storage.saveAccounts(next, uid);
  };

  const setLastUsed = async (accountId) => {
    const next = accounts.map((a) => (a.id === accountId ? { ...a, lastUsed: Date.now() } : a));
    setAccounts(next);
    await storage.saveAccounts(next, uid);
  };

  const reorderAccounts = async (reordered) => {
    const next = reordered.map((a, i) => ({ ...a, order: i }));
    setAccounts(next);
    await storage.saveAccounts(next, uid);
  };

  return {
    accounts,
    totpCodes,
    totpAdjacent,
    totpSecondsRemaining,
    addAccount,
    removeAccount,
    toggleFavorite,
    updateAccount,
    updateAccountsBatch,
    setLastUsed,
    reorderAccounts,
    reloadAccounts: loadAccounts,
  };
};
