/**
 * Styled text input with optional label and icon.
 * @module components/ui/Input
 */
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { themeDark } from '../../constants/themes';

export const Input = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  label,
  icon,
  error,
  hint,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  multiline,
  numberOfLines,
  editable = true,
  maxLength,
  containerStyle,
  style,
}) => {
  const { theme } = useTheme();
  const phColor = placeholderTextColor ?? theme.colors.textMuted;
  const borderColor = error ? theme.colors.error : theme.colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelWrap}>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={18} color={theme.colors.textSecondary} />
          ) : null}
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
        </View>
      ) : null}
      <View style={[
        styles.inputWrap,
        { backgroundColor: theme.colors.surface, borderColor },
        multiline && styles.inputWrapMultiline,
      ]}>
        {icon && !label ? (
          <MaterialCommunityIcons name={icon} size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
        ) : null}
        <TextInput
          style={[
            styles.input,
            { color: theme.colors.text },
            multiline && styles.inputMultiline,
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={phColor}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect ?? false}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
        />
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
    borderRadius: themeDark.radii.lg,
    borderWidth: 1,
    paddingHorizontal: themeDark.spacing.lg,
    minHeight: 52,
  },
  inputWrapMultiline: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  inputIcon: {
    marginRight: themeDark.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: themeDark.spacing.md,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: themeDark.spacing.md,
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
