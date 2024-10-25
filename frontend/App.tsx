import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import MobileNavigator from './Navigator';
import { AuthProvider } from './view/authentication/AuthContext';

export default function App() {
  return (
  <SafeAreaProvider>
    <AuthProvider>
      <MobileNavigator />
    </AuthProvider>
    <StatusBar style="auto" />
  </SafeAreaProvider>
  );
}













