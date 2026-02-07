/**
 * QR parser – parse otpauth:// URIs from QR (secret, issuer, account).
 */
/**
 * QR parser – parse otpauth:// URIs from QR (secret, issuer, account).
 */
import { Alert } from 'react-native';

/**
 * Parse query string (e.g. "secret=ABC&issuer=Google") without URLSearchParams
 * so it works reliably in React Native.
 */
function safeDecode(str) {
  try {
    return decodeURIComponent(String(str || '').replace(/\+/g, ' '));
  } catch (_) {
    return String(str || '');
  }
}

function parseQueryString(search) {
  const params = {};
  const s = String(search || '').replace(/^\?/, '');
  s.split('&').forEach((pair) => {
    const eq = pair.indexOf('=');
    const key = eq >= 0 ? pair.slice(0, eq).trim() : pair.trim();
    const value = eq >= 0 ? pair.slice(eq + 1) : '';
    const decoded = safeDecode(value);
    if (key && decoded) params[key] = decoded;
  });
  return params;
}

/**
 * Parse otpauth URI. Uses regex fallback so it works even when URL() is
 * unreliable in React Native / Expo Go.
 */
export const qrParser = {
  parseOtpauth(data) {
    try {
      const raw = (typeof data === 'string' ? data : String(data || ''))
        .replace(/\r\n|\r|\n/g, '')
        .trim();
      if (!raw) {
        Alert.alert('Invalid QR', 'No data received. Try again or use manual entry.');
        return null;
      }
      const lower = raw.toLowerCase();
      if (!lower.startsWith('otpauth://')) {
        Alert.alert('Invalid QR', 'This QR is not a 2FA setup code. Use manual entry for Google.');
        return null;
      }
      if (!lower.includes('totp')) {
        Alert.alert('Unsupported', 'Only TOTP (time-based) codes are supported.');
        return null;
      }

      let issuer = 'Unknown';
      let label = '';
      let secret = '';

      try {
        const url = new URL(raw);
        const type = (url.hostname || '').toLowerCase();
        if (type !== 'totp') {
          Alert.alert('Unsupported', 'Only TOTP (time-based) codes are supported.');
          return null;
        }
        const pathPart = url.pathname.slice(1).replace(/^\/+/, '');
        label = safeDecode(pathPart);
        const params = url.search ? parseQueryString(url.search) : {};
        secret = (params.secret || '').trim();
        issuer = (params.issuer || (label.includes(':') ? label.split(':')[0] : 'Unknown') || 'Unknown').trim();
      } catch (_) {
        const match = raw.match(/^otpauth:\/\/totp\/([^?]+)(?:\?(.+))?$/i);
        if (!match) {
          Alert.alert('Error', 'Could not parse QR. Use manual entry and paste the key or full link.');
          return null;
        }
        label = safeDecode(match[1].replace(/^\/+/, ''));
        const query = match[2] || '';
        const params = parseQueryString(query);
        secret = (params.secret || '').trim();
        issuer = (params.issuer || (label.includes(':') ? label.split(':')[0] : 'Unknown') || 'Unknown').trim();
      }

      const secretClean = String(secret || '').trim().replace(/\s/g, '');
      if (!secretClean || secretClean.length < 16) {
        Alert.alert('Invalid QR', 'TOTP secret missing or too short. Use manual entry.');
        return null;
      }

      return { issuer, label, secret: secretClean };
    } catch (e) {
      console.warn('QR parse error', e);
      Alert.alert('Error', 'Could not process QR. Try manual entry.');
      return null;
    }
  },
};
