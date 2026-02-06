import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const useNativeScanner = CameraView?.isModernBarcodeScannerAvailable === true;

export const ScannerModal = ({ visible, onClose, onScan }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState('scan');
  const [launchingScanner, setLaunchingScanner] = useState(false);
  const [manualSecret, setManualSecret] = useState('');
  const [manualAccount, setManualAccount] = useState('');
  const [manualIssuer, setManualIssuer] = useState('Google');
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const scanSubscriptionRef = useRef(null);
  const scannedRef = useRef(false);
  scannedRef.current = scanned;

  const handleScanResult = (data) => {
    const str = typeof data === 'string' ? data.trim() : (data ? String(data).trim() : '');
    if (!str || scannedRef.current) return;
    scannedRef.current = true;
    setScanned(true);
    onScan(str);
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
        'Permission needed',
        'Allow access to photos to scan a QR from an image.',
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
          'Scan failed',
          'Could not read QR from this image. Try taking a clearer screenshot or use Manual entry and paste the key from Google.',
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
      console.warn('Scan from photo failed', e);
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
      onScan(raw);
      setManualSecret('');
      setManualAccount('');
      setManualIssuer('Google');
      setMode('scan');
      onClose();
      return;
    }

    const secret = raw.replace(/\s/g, '');
    if (!secret || secret.length < 16) return;
    const issuer = manualIssuer.trim() || 'Unknown';
    const label = manualAccount.trim() || issuer;
    const otpauth = `otpauth://totp/${encodeURIComponent(issuer + ':' + label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}`;
    onScan(otpauth);
    setManualSecret('');
    setManualAccount('');
    setManualIssuer('Google');
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
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'scan' ? 'Scan QR Code' : 'Enter key manually'}
            </Text>
            <TouchableOpacity
              onPress={() => (mode === 'manual' ? resetManual() : onClose())}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          {mode === 'manual' ? (
            <KeyboardAvoidingView
              style={styles.flex1}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                style={styles.manualScroll}
                contentContainerStyle={styles.manualContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.manualHint}>
                  Paste the setup key (e.g. "vzxx mt5x w7xp 2u5z...") OR paste the full link if you have it (otpauth://...). Spaces OK.
                </Text>
                <TextInput
                  style={[styles.input, styles.inputLarge]}
                  placeholder="Setup key or full otpauth:// link"
                  placeholderTextColor={theme.colors.textMuted}
                  value={manualSecret}
                  onChangeText={setManualSecret}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />
                <TextInput
                  style={styles.input}
                  placeholder="Your email (e.g. you@gmail.com)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={manualAccount}
                  onChangeText={setManualAccount}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Issuer (e.g. Google)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={manualIssuer}
                  onChangeText={setManualIssuer}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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
                    <Text style={styles.buttonText}>Add account</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          ) : !permission ? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                Requesting camera permission...
              </Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
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
                  <Text style={styles.buttonText}>Allow camera</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : useNativeScanner ? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
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
                    <ActivityIndicator color={theme.colors.bg} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Scan from photo</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.orText}>or</Text>
              <TouchableOpacity
                style={styles.buttonWrapperOutline}
                onPress={openNativeScanner}
                disabled={launchingScanner}
                activeOpacity={0.85}
              >
                {launchingScanner ? (
                  <ActivityIndicator color={theme.colors.accent} size="small" />
                ) : (
                  <Text style={styles.buttonTextOutline}>Scan with camera</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualLink, { position: 'relative', marginTop: theme.spacing.lg }]}
                onPress={() => setMode('manual')}
                activeOpacity={0.7}
              >
                <Text style={styles.manualLinkText}>
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
                <View style={styles.frameOuter}>
                  <View style={styles.frame} />
                </View>
                <Text style={styles.hint}>Align QR code within frame</Text>
              </View>
              <View style={styles.scanActions}>
                <TouchableOpacity
                  style={styles.scanFromPhotoButton}
                  onPress={pickImageAndScan}
                  disabled={scanningPhoto}
                  activeOpacity={0.85}
                >
                  {scanningPhoto ? (
                    <ActivityIndicator color={theme.colors.accent} size="small" />
                  ) : (
                    <Text style={styles.scanFromPhotoText}>Scan from photo</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.manualLink}
                  onPress={() => setMode('manual')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.manualLinkText}>Enter key manually</Text>
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
    backgroundColor: theme.colors.bg,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  close: {
    fontSize: 28,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonWrapper: {
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xxl,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    color: theme.colors.textMuted,
    marginVertical: theme.spacing.md,
    fontSize: 14,
  },
  buttonWrapperOutline: {
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  buttonTextOutline: {
    color: theme.colors.accent,
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
    borderColor: theme.colors.accentGlow,
  },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: 20,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xl,
    letterSpacing: 1,
  },
  scanActions: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  scanFromPhotoButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  scanFromPhotoText: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  manualLink: {
    alignSelf: 'center',
  },
  manualLinkText: {
    color: theme.colors.accent,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  flex1: { flex: 1 },
  manualScroll: { flex: 1 },
  manualContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  manualHint: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  input: {
    backgroundColor: theme.colors.bgElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    minHeight: 48,
  },
  inputLarge: {
    minHeight: 80,
  },
});
