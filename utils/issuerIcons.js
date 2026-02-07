import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Map issuer names to MaterialCommunityIcons. Fallback: first letter.
 * Keys are lowercase for matching.
 */
const ICON_MAP = {
  google: 'google',
  instagram: 'instagram',
  facebook: 'facebook',
  microsoft: 'microsoft',
  github: 'github',
  twitter: 'twitter',
  amazon: 'amazon',
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

export function getIssuerIcon(issuer) {
  const key = String(issuer || '').toLowerCase().trim();
  const iconName = ICON_MAP[key] || ICON_MAP[key.replace(/\s+/g, '')];
  return iconName || null;
}

export const ICON_PICKER_OPTIONS = [
  'google', 'shield-account', 'email', 'lock', 'key', 'domain',
  'bank', 'credit-card', 'cart', 'gamepad-variant', 'cloud',
  'microsoft', 'github', 'apple', 'amazon', 'facebook',
];

export function IssuerIcon({ issuer, size = 24, color, style }) {
  const iconName = getIssuerIcon(issuer);
  if (iconName) {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} style={style} />;
  }
  return null;
}
