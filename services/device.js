/** Device ID, Dilithium2 keypair (MFA signatures), Kyber keypair (key exchange). */
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import { v4 as uuidv4 } from 'uuid';
import {
  DilithiumKeyPair,
  DilithiumLevel,
  DilithiumPrivateKey,
  DilithiumSignature,
} from '@asanrom/dilithium';
import { generateKeyPair as generateKyberKeypair } from './kyber';
import { storage } from './storage';

const DILITHIUM_LEVEL = 2;
const ALGORITHM = 'Dilithium2';

export const deviceService = {
  async ensureDeviceIdentity() {
    try {
      let deviceId = await storage.getDeviceId();
      if (deviceId && deviceId.startsWith('device-com.')) {
        await storage.saveDeviceId(null);
        deviceId = null;
      }
      if (!deviceId) {
        const baseId = Application.androidId || uuidv4();
        deviceId = `device-${baseId}`;
        await storage.saveDeviceId(deviceId);
      }

      let keypair = await storage.getPqcKeypair();

      if (keypair?.algorithm === 'Mock-Dilithium') {
        await storage.savePqcKeypair(null);
        keypair = null;
      }

      if (!keypair) {
        const level = DilithiumLevel.get(DILITHIUM_LEVEL);
        const seed = await Crypto.getRandomBytesAsync(32);
        const keyPair = DilithiumKeyPair.generate(level, seed);
        const privateKey = keyPair.getPrivateKey();
        const publicKey = keyPair.getPublicKey();

        keypair = {
          algorithm: ALGORITHM,
          publicKey: publicKey.toHex(),
          privateKey: privateKey.toHex(),
        };
        await storage.savePqcKeypair(keypair);
      }

      let kyberKeypair = await storage.getKyberKeypair();
      if (!kyberKeypair?.publicKey) {
        kyberKeypair = await generateKyberKeypair();
        await storage.saveKyberKeypair(kyberKeypair);
      }

      return { deviceId, keypair, kyberKeypair };
    } catch (e) {
      return { deviceId: null, keypair: null, kyberKeypair: null };
    }
  },

  async signMessage(message, keypair) {
    if (!keypair?.privateKey || keypair?.algorithm !== ALGORITHM) {
      return null;
    }

    try {
      const level = DilithiumLevel.get(DILITHIUM_LEVEL);
      const privateKey = DilithiumPrivateKey.fromHex(keypair.privateKey, level);
      const messageBytes = new TextEncoder().encode(message);
      const signature = privateKey.sign(messageBytes);
      return signature.toHex();
    } catch (e) {
      return null;
    }
  },
};
