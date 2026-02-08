/** Themed alerts and confirm dialogs in place of native Alert. */
import React, { createContext, useState, useCallback, useContext, useRef } from 'react';
import { AlertDialog } from '../components/ui/AlertDialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [confirm, setConfirm] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    destructive: false,
  });
  const confirmCallbacksRef = useRef({ onConfirm: null, onCancel: null });

  const showAlert = useCallback((title, message, onOk) => {
    setAlert({ visible: true, title: title || 'Alert', message: message || '', onOk: onOk || null });
  }, []);

  const dismissAlert = useCallback(() => {
    setAlert((p) => {
      p.onOk?.();
      return { ...p, visible: false, onOk: null };
    });
  }, []);

  const showConfirm = useCallback((opts) => {
    const options = typeof opts === 'string'
      ? { title: opts, message: arguments[1] || '', onConfirm: arguments[2], onCancel: arguments[3] }
      : opts;
    const {
      title = 'Confirm',
      message = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      destructive = false,
      onConfirm,
      onCancel,
    } = options;

    confirmCallbacksRef.current = { onConfirm: onConfirm || (() => {}), onCancel: onCancel || (() => {}) };
    setConfirm({ visible: true, title, message, confirmText, cancelText, destructive });
  }, []);

  const handleConfirmOk = useCallback(() => {
    confirmCallbacksRef.current.onConfirm?.();
    setConfirm((p) => ({ ...p, visible: false }));
  }, []);

  const handleConfirmCancel = useCallback(() => {
    confirmCallbacksRef.current.onCancel?.();
    setConfirm((p) => ({ ...p, visible: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog visible={alert.visible} title={alert.title} message={alert.message} onOk={dismissAlert} />
      <ConfirmDialog
        visible={confirm.visible}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        destructive={confirm.destructive}
        onConfirm={handleConfirmOk}
        onCancel={handleConfirmCancel}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  return ctx || { showAlert: () => {}, showConfirm: () => {} };
}
