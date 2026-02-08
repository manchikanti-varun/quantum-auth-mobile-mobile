/**
 * Password field with show/hide toggle.
 * @module components/ui/PasswordInput
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { themeDark } from '../../constants/themes';

export const PasswordInput = ({
  value,
  onChangeText,
  placeholder = 'Password',
  placeholderTextColor,
  label,
  error,
  hint,
  autoCapitalize = 'none',
  editable = true,
  style,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const phColor = placeholderTextColor ?? theme.colors.textMuted;
  const borderColor = error ? theme.colors.error : theme.colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelWrap}>
          <MaterialCommunityIcons name="lock-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
        </View>
      ) : null}
      <View style={[styles.inputWrap, { backgroundColor: theme.colors.surface, borderColor }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={phColor}
          secureTextEntry={!showPassword}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((v) => !v)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.eyeButton}
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={theme.colors.textMuted}
          />
        </TouchableOpacity>
      </View>
      {hint ? (
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{hint}</Text>
      ) : null}
      {error ? (
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: themeDark.spacing.md,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: themeDark.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: themeDark.radii.md,
    borderWidth: 1,
    paddingHorizontal: themeDark.spacing.lg,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: themeDark.spacing.md,
    fontSize: 16,
  },
  eyeButton: {
    padding: themeDark.spacing.sm,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});
