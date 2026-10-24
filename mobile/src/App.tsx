/**
 * App.tsx
 *
 * Root component. Sets up:
 *  1. AuthProvider – global auth state (logged-in user, logout fn)
 *  2. NavigationContainer – React Navigation root
 *  3. Stack navigator with two "groups":
 *     - Auth group (Login, OtpVerify) – shown when user is NOT logged in
 *     - App group  (Home, AddLoan, LoanDetail) – shown when logged in
 *
 * HOW AUTH-GATED NAVIGATION WORKS:
 * We read `user` from AuthContext.
 * - If user is null → render Login/OtpVerify screens only
 * - If user exists  → render Home/AddLoan/LoanDetail screens only
 * React Navigation automatically animates between the two groups.
 * There's no manual redirect needed — state drives the UI.
 */

import React from 'react';
import {StatusBar, View, ActivityIndicator} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AuthProvider, useAuth} from './context/AuthContext';
import {RootStackParamList} from './types';
import {COLORS} from './utils/constants';

// Screens
import LoginScreen from './screens/LoginScreen';
import OtpVerifyScreen from './screens/OtpVerifyScreen';
import HomeScreen from './screens/HomeScreen';
import AddLoanScreen from './screens/AddLoanScreen';
import LoanDetailScreen from './screens/LoanDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Inner navigator (reads AuthContext) ───────────────────────────────────────
function AppNavigator() {
  const {user, isLoading} = useAuth();

  // Show a spinner while restoring session from AsyncStorage
  if (isLoading) {
    return (
      <View
        style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background}}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: COLORS.background},
        headerTitleStyle: {fontWeight: '700', color: COLORS.text},
        headerShadowVisible: false,
        contentStyle: {backgroundColor: COLORS.background},
      }}>
      {user == null ? (
        // ── Auth screens ──────────────────────────────────────────────
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="OtpVerify"
            component={OtpVerifyScreen}
            options={{headerShown: false}}
          />
        </>
      ) : (
        // ── Authenticated screens ─────────────────────────────────────
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'MiniLedger 💸'}}
          />
          <Stack.Screen
            name="AddLoan"
            component={AddLoanScreen}
            options={{
              title: 'New Loan Entry',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="LoanDetail"
            component={LoanDetailScreen}
            options={{title: 'Loan Details'}}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.background}
          />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
