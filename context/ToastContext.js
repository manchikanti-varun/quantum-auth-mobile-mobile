/** Toast feedback messages app-wide. */
import React, { createContext, useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  const showToast = useCallback((msg, duration = 1500) => {
    setMessage(msg || 'Done');
    setVisible(true);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
    });
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && <ToastMessage message={message} opacity={opacity} />}
    </ToastContext.Provider>
  );
}

function ToastMessage({ message, opacity }) {
  const { theme } = useTheme();
  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: theme.colors.surfaceBright,
          borderColor: theme.colors.border,
        },
        { opacity },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: theme.colors.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export function useToast() {
  const c = useContext(ToastContext);
  return c?.showToast ? c : { showToast: () => {} };
}
