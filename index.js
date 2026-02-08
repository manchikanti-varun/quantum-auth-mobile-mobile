/**
 * Application entry point. Registers root component and required polyfills.
 * @module index
 */

import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
