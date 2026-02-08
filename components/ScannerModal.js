/**
 * QR scan or manual secret entry for TOTP enrollment.
 * @module components/ScannerModal
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from './ui';
import { useTheme } from '../context/ThemeContext';
import { themeDark } from '../constants/themes';
import { spacing, radii } from '../constants/designTokens';

const useNativeScanner = CameraView?.isModernBarcodeScannerAvailable === true;

export const ScannerModal = ({ visible, onClose, onScan, folders: foldersProp = [] }) => {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState('scan');
  const [launchingScanner, setLaunchingScanner] = useState(false);
  const [manualSecret, setManualSecret] = useState('');
  const [manualAccount, setManualAccount] = useState('');
  const [manualIssuer, setManualIssuer] = useState('Google');
  const [manualFolder, setManualFolder] = useState('Personal');
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const folders = Array.isArray(foldersProp) && foldersProp.length > 0 ? foldersProp : ['Personal', 'Work', 'Banking'];
  const scanSubscriptionRef = useRef(null);
  const scannedRef = useRef(false);
  scannedRef.current = scanned;

  const handleScanResult = (data, options) => {
    const str = typeof data === 'string' ? data.trim() : (data ? String(data).trim() : '');
    if (!str || scannedRef.current) return;
    scannedRef.current = true;
    setScanned(true);
    onScan(str, options);
    setTimeout(() => {
      scannedRef.current = false;
      setScanned(false);
    }, 2500);
  };

  const handleBarcodeScanned = (result) => {
    const raw =
      typeof result === 'string'
        ? result
        : result?.data ?? result?.nativeEvent?.data ?? result?.nativeEvent;
    const data = typeof raw === 'string' ? raw.trim() : (raw && typeof raw === 'object' && raw.data ? String(raw.data).trim() : raw ? String(raw).trim() : '');
    if (data) handleScanResult(data);
  };

  const pickImageAndScan = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo access needed',
        'Allow access to photos to scan a QR code from an image.',
        [{ text: 'OK' }],
      );
      return;
    }
    setScanningPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled || !result.assets?.[0]?.uri) {
        setScanningPhoto(false);
        return;
      }
      const uri = result.assets[0].uri;
      let scanResults;
      try {
        scanResults = await scanFromURLAsync(uri, ['qr']);
      } catch (scanErr) {
        setScanningPhoto(false);
        Alert.alert(
          'Could not read QR code',
          'Try a clearer image or use Manual entry to paste the setup key from your service\'s security settings.',
          [{ text: 'OK' }],
        );
        return;
      }
      const otpauth = scanResults?.find((r) => (r?.data || '').toLowerCase().startsWith('otpauth://'))?.data
        || scanResults?.[0]?.data;
      if (otpauth && typeof otpauth === 'string') {
        handleScanResult(otpauth.trim());
        onClose();
      } else {
        Alert.alert(
          'No 2FA code found',
          'This image doesn\'t contain a 2FA setup QR. Use a screenshot of the Google 2FA QR, or use Manual entry and paste the key.',
          [{ text: 'OK' }],
        );
      }
    } catch (e) {
      Alert.alert(
        'Error',
        'Something went wrong. Use Manual entry and paste the setup key from Google instead.',
        [{ text: 'OK' }],
      );
    }
    setScanningPhoto(false);
  };

  const openNativeScanner = async () => {
    if (!CameraView?.launchScanner || !CameraView?.onModernBarcodeScanned) return;
    setLaunchingScanner(true);
    try {
      scanSubscriptionRef.current = CameraView.onModernBarcodeScanned((event) => {
        const raw = event?.data ?? event?.nativeEvent?.data;
        const data = typeof raw === 'string' ? raw.trim() : (raw ? String(raw).trim() : '');
        if (!data) return;
        if (scanSubscriptionRef.current) {
          scanSubscriptionRef.current.remove();
          scanSubscriptionRef.current = null;
        }
        setLaunchingScanner(false);
        handleScanResult(data);
        if (Platform.OS === 'ios' && CameraView.dismissScanner) {
          CameraView.dismissScanner();
        }
        onClose();
      });
      await CameraView.launchScanner({ barcodeTypes: ['qr'] });
    } catch (e) {
      setLaunchingScanner(false);
      if (scanSubscriptionRef.current) {
        scanSubscriptionRef.current.remove();
        scanSubscriptionRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!visible) {
      if (scanSubscriptionRef.current) {
        scanSubscriptionRef.current.remove();
        scanSubscriptionRef.current = null;
      }
      setLaunchingScanner(false);
    }
  }, [visible]);

  const onBarcodeScannedStable = useRef((result) => handleBarcodeScanned(result)).current;

  const handleManualSubmit = () => {
    const raw = manualSecret.trim();
    const isFullLink = raw.toLowerCase().startsWith('otpauth://');

    if (isFullLink) {
      onScan(raw, { folder: manualFolder });
      setManualSecret('');
      setManualAccount('');
      setManualIssuer('Google');
      setManualFolder('Personal');
      setMode('scan');
      onClose();
      return;
    }

    const secret = raw.replace(/\s/g, '');
    if (!secret || secret.length < 16) return;
    const issuer = manualIssuer.trim() || 'Unknown';
    const label = manualAccount.trim() || issuer;
    const otpauth = `otpauth://totp/${encodeURIComponent(issuer + ':' + label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}`;
    onScan(otpauth, { folder: manualFolder });
    setManualSecret('');
    setManualAccount('');
    setManualIssuer('Google');
    setManualFolder('Personal');
    setMode('scan');
    onClose();
  };

  const canSubmitManual =
    manualSecret.trim().length >= 16 ||
    manualSecret.trim().toLowerCase().startsWith('otpauth://');

  const resetManual = () => {
    setManualSecret('');
    setManualAccount('');
    setManualIssuer('Google');
    setMode('scan');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={[styles.header, { backgroundColor: theme.colors.bgElevated, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {mode === 'scan' ? 'Scan QR Code' : 'Enter key manually'}
            </Text>
            <TouchableOpacity
              onPress={() => (mode === 'manual' ? resetManual() : onClose())}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.close, { color: theme.colors.textMuted }]}>×</Text>
            </TouchableOpacity>
          </View>

          {mode === 'manual' ? (
            <KeyboardAvoidingView
              style={styles.flex1}
              behavior="padding"
              keyboardVerticalOffset={Platform.OS === 'android' ? (StatusBar?.currentHeight ?? 0) : 0}
            >
              <ScrollView
                style={styles.manualScroll}
                contentContainerStyle={styles.manualContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.manualHint, { color: theme.colors.textSecondary }]}>
                  Paste the setup key from your service (e.g. "vzxx mt5x w7xp 2u5z...") or paste a full otpauth:// link. Spaces are fine.
                </Text>
                <Input
                  label="Setup key or otpauth link"
                  icon="key-variant"
                  placeholder="Paste here..."
                  value={manualSecret}
                  onChangeText={setManualSecret}
                  autoCapitalize="none"
                  multiline
                  numberOfLines={3}
                  hint="Usually shown when you can't scan a QR code"
                />
                <Input
                  label="Your email or username"
                  icon="account-outline"
                  placeholder="e.g. you@gmail.com"
                  value={manualAccount}
                  onChangeText={setManualAccount}
                  autoCapitalize="none"
                />
                <Input
                  label="Service name"
                  icon="web"
                  placeholder="e.g. Google, GitHub"
                  value={manualIssuer}
                  onChangeText={setManualIssuer}
                  autoCapitalize="none"
                  hint="The company or app name"
                />
                <Text style={[styles.folderLabel, { color: theme.colors.textSecondary }]}>Folder</Text>
                <View style={styles.folderChipsRow}>
                  {folders.map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.folderChip,
                        { backgroundColor: manualFolder === f ? theme.colors.accent : theme.colors.bgElevated, borderColor: theme.colors.border },
                      ]}
                      onPress={() => setManualFolder(f)}
                    >
                      <Text style={[styles.folderChipText, { color: manualFolder === f ? theme.colors.onAccent : theme.colors.textSecondary }]}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.buttonWrapper}
                  onPress={handleManualSubmit}
                  activeOpacity={0.85}
                  disabled={!canSubmitManual}
                >
                  <LinearGradient
                    colors={theme.gradients.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                  >
                    <Text style={[styles.buttonText, { color: theme.colors.onAccent }]}>Add account</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          ) : !permission ? (
            <View style={styles.placeholder}>
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                Requesting camera permission...
              </Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.placeholder}>
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                Camera permission is required
              </Text>
              <TouchableOpacity
                style={styles.buttonWrapper}
                onPress={() => requestPermission()}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={theme.gradients.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.onAccent }]}>Allow camera</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : useNativeScanner ? (
            <View style={styles.placeholder}>
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                Scan the QR code with your camera or from a photo.
              </Text>
              <TouchableOpacity
                style={styles.buttonWrapper}
                onPress={pickImageAndScan}
                disabled={scanningPhoto}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={theme.gradients.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  {scanningPhoto ? (
                    <ActivityIndicator color={theme.colors.onAccent} size="small" />
                  ) : (
                    <Text style={[styles.buttonText, { color: theme.colors.onAccent }]}>Scan from photo</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <Text style={[styles.orText, { color: theme.colors.textMuted }]}>or</Text>
              <TouchableOpacity
                style={[styles.buttonWrapperOutline, { borderColor: theme.colors.accent }]}
                onPress={openNativeScanner}
                disabled={launchingScanner}
                activeOpacity={0.85}
              >
                {launchingScanner ? (
                  <ActivityIndicator color={theme.colors.accent} size="small" />
                ) : (
                  <Text style={[styles.buttonTextOutline, { color: theme.colors.accent }]}>Scan with camera</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualLink, { position: 'relative', marginTop: spacing.lg }]}
                onPress={() => setMode('manual')}
                activeOpacity={0.7}
              >
                <Text style={[styles.manualLinkText, { color: theme.colors.accent }]}>
                  Enter key manually
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scannerContainer}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onBarcodeScannedStable}
              />
              <View style={styles.overlay} pointerEvents="none">
                <View style={[styles.frameOuter, { borderColor: theme.colors.accentGlow }]}>
                  <View style={[styles.frame, { borderColor: theme.colors.accent }]} />
                </View>
                <Text style={[styles.hint, { color: theme.colors.textMuted }]}>Align QR code within frame</Text>
              </View>
              <View style={styles.scanActions}>
                <TouchableOpacity
                  style={[styles.scanFromPhotoButton, { borderColor: theme.colors.accent }]}
                  onPress={pickImageAndScan}
                  disabled={scanningPhoto}
                  activeOpacity={0.85}
                >
                  {scanningPhoto ? (
                    <ActivityIndicator color={theme.colors.accent} size="small" />
                  ) : (
                    <Text style={[styles.scanFromPhotoText, { color: theme.colors.accent }]}>Scan from photo</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.manualLink}
                  onPress={() => setMode('manual')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.manualLinkText, { color: theme.colors.accent }]}>Enter key manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...themeDark.typography.h2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  close: {
    fontSize: 28,
    fontWeight: '300',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  placeholderText: {
    marginBottom: spacing.xl,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonWrapper: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    marginVertical: spacing.md,
    fontSize: 14,
  },
  buttonWrapperOutline: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  buttonTextOutline: {
    fontSize: 16,
    fontWeight: '700',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameOuter: {
    padding: 4,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderRadius: 20,
  },
  hint: {
    ...themeDark.typography.caption,
    marginTop: spacing.xl,
    letterSpacing: 1,
  },
  scanActions: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.md,
  },
  scanFromPhotoButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 2,
  },
  scanFromPhotoText: {
    fontSize: 15,
    fontWeight: '600',
  },
  manualLink: {
    alignSelf: 'center',
  },
  manualLinkText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  flex1: { flex: 1 },
  manualScroll: { flex: 1 },
  manualContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  manualHint: {
    fontSize: 14,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
    minHeight: 48,
  },
  inputLarge: {
    minHeight: 80,
  },
  folderLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  folderChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  folderChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  folderChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
