import { useState, useEffect } from 'react';
import { generateTOTP, generateTOTPWithAdjacent, getTimeRemainingInWindow } from '../services/totp';
import { storage } from '../services/storage';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [totpCodes, setTotpCodes] = useState({});
  const [totpAdjacent, setTotpAdjacent] = useState({});
  const [totpSecondsRemaining, setTotpSecondsRemaining] = useState(0);

  useEffect(() => {
    loadAccounts();
  }, []);

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
          if (__DEV__) console.warn('TOTP failed for', acc.label, e?.message || e);
          updated[key] = '------';
          adjacentUpdated[key] = { prev: '------', next: '------' };
        }
      });
      setTotpCodes(updated);
      setTotpAdjacent(adjacentUpdated);
    }, 1000);

    return () => clearInterval(interval);
  }, [accounts]);

  const loadAccounts = async () => {
    const loaded = await storage.getAccounts();
    const migrated = loaded.map((a) => ({
      ...a,
      favorite: a.favorite ?? false,
      folder: a.folder ?? 'Personal',
      notes: a.notes ?? '',
      lastUsed: a.lastUsed ?? 0,
    }));
    setAccounts(migrated);
  };

  const addAccount = async (account) => {
    const withMeta = { ...account, favorite: false, folder: 'Personal', notes: '', lastUsed: Date.now() };
    const next = [...accounts, withMeta];
    setAccounts(next);
    try {
      await storage.saveAccounts(next);
    } catch (e) {
      setAccounts(accounts);
      throw e;
    }
  };

  const removeAccount = async (accountId) => {
    const next = accounts.filter((acc) => acc.id !== accountId);
    setAccounts(next);
    await storage.saveAccounts(next);
  };

  const toggleFavorite = async (accountId) => {
    const next = accounts.map((a) => (a.id === accountId ? { ...a, favorite: !a.favorite } : a));
    setAccounts(next);
    await storage.saveAccounts(next);
  };

  const updateAccount = async (accountId, updates) => {
    const next = accounts.map((a) => (a.id === accountId ? { ...a, ...updates } : a));
    setAccounts(next);
    await storage.saveAccounts(next);
  };

  const setLastUsed = async (accountId) => {
    const next = accounts.map((a) => (a.id === accountId ? { ...a, lastUsed: Date.now() } : a));
    setAccounts(next);
    await storage.saveAccounts(next);
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
    setLastUsed,
    reloadAccounts: loadAccounts,
  };
};
