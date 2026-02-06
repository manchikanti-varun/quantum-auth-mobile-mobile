// Polyfill for uuid (React Native has no crypto.getRandomValues)
import 'react-native-get-random-values';
// Buffer polyfill for @asanrom/dilithium (React Native has no global Buffer)
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
