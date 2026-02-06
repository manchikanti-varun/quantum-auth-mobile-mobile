import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import { v4 as uuidv4 } from 'uuid';
import {
  DilithiumKeyPair,
  DilithiumLevel,
  DilithiumPrivateKey,
  DilithiumSignature,
} from '@asanrom/dilithium';
import { storage } from './storage';

const DILITHIUM_LEVEL = 2;
const ALGORITHM = 'Dilithium2';

export const deviceService = {
  async ensureDeviceIdentity() {
    try {
      let deviceId = await storage.getDeviceId();
      if (!deviceId) {
        const baseId =
          Application.androidId ||
          Application.applicationId ||
          uuidv4();
        deviceId = `device-${baseId}`;
        await storage.saveDeviceId(deviceId);
      }

      let keypair = await storage.getPqcKeypair();

      // Migrate from Mock-Dilithium to real CRYSTALS-Dilithium
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

      return { deviceId, keypair };
    } catch (e) {
      console.log('Failed to ensure device identity', e);
      return { deviceId: null, keypair: null };
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
      console.log('Failed to sign message', e);
      return null;
    }
  },
};
