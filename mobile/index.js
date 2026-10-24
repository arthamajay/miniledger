/**
 * index.js – React Native app entry point
 *
 * This file is the very first thing React Native loads.
 * It registers our root component (App) with the native runtime.
 * The string 'MiniLedger' must match the app name in
 * android/app/src/main/res/values/strings.xml (created by RN CLI).
 */
import { AppRegistry } from 'react-native';
import App from './src/App';

AppRegistry.registerComponent('MiniLedger', () => App);
