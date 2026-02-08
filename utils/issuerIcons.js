/** Issuer → icon name and brand colors for account cards. */
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ICON_MAP = {
  google: 'google',
  instagram: 'instagram',
  facebook: 'facebook',
  microsoft: 'microsoft',
  github: 'github',
  twitter: 'twitter',
  amazon: 'cart',
  apple: 'apple',
  discord: 'discord',
  slack: 'slack',
  linkedin: 'linkedin',
  dropbox: 'dropbox',
  twitch: 'twitch',
  reddit: 'reddit',
  netflix: 'netflix',
  spotify: 'spotify',
  paypal: 'paypal',
  protonmail: 'email',
  outlook: 'microsoft',
  yahoo: 'email',
  cloudflare: 'cloud',
  authy: 'shield-account',
  bitwarden: 'key',
  lastpass: 'lock',
  duo: 'shield',
  okta: 'domain',
  steam: 'steam',
  epic: 'gamepad-variant',
};

const ISSUER_COLORS = {
  google: { bg: '#4285F4', icon: '#fff' },
  microsoft: { bg: '#00a4ef', icon: '#fff' },
  github: { bg: '#24292e', icon: '#fff' },
  facebook: { bg: '#1877f2', icon: '#fff' },
  amazon: { bg: '#ff9900', icon: '#000' },
  apple: { bg: '#000', icon: '#fff' },
  instagram: { bg: '#e4405f', icon: '#fff' },
  twitter: { bg: '#1da1f2', icon: '#fff' },
  discord: { bg: '#5865f2', icon: '#fff' },
  slack: { bg: '#4a154b', icon: '#fff' },
  linkedin: { bg: '#0a66c2', icon: '#fff' },
  dropbox: { bg: '#0061ff', icon: '#fff' },
  paypal: { bg: '#00457c', icon: '#fff' },
  spotify: { bg: '#1db954', icon: '#fff' },
  netflix: { bg: '#e50914', icon: '#fff' },
  steam: { bg: '#1b2838', icon: '#fff' },
};

const INVALID_ICON_FALLBACK = { amazon: 'cart' };

export function getIssuerIcon(issuer) {
  const key = String(issuer || '').toLowerCase().trim();
  const iconName = ICON_MAP[key] || ICON_MAP[key.replace(/\s+/g, '')];
  return iconName || null;
}

export function resolveIconName(iconName) {
  return iconName ? (INVALID_ICON_FALLBACK[iconName] || iconName) : null;
}

export function getIssuerColor(issuer) {
  const key = String(issuer || '').toLowerCase().trim();
  return ISSUER_COLORS[key] || ISSUER_COLORS[key.replace(/\s+/g, '')] || null;
}

export const ICON_PICKER_OPTIONS = [
  'google', 'shield-account', 'email', 'lock', 'key', 'domain',
  'bank', 'credit-card', 'cart', 'gamepad-variant', 'cloud',
  'microsoft', 'github', 'apple', 'facebook',
];

export function IssuerIcon({ issuer, size = 24, color, style }) {
  const iconName = getIssuerIcon(issuer);
  if (iconName) {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} style={style} />;
  }
  return null;
}
