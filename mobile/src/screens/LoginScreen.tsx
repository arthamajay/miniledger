/**
 * screens/LoginScreen.tsx
 *
 * Step 1 of the login flow: user enters their phone number.
 *
 * ON SUBMIT:
 * 1. Validate phone is exactly 10 digits.
 * 2. Call sendOtp(phone) – server logs the OTP to console.
 * 3. Navigate to OtpVerifyScreen, passing the phone as a param.
 *
 * This screen is shown when the user is NOT logged in.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {sendOtp} from '../services/api';
import {COLORS} from '../utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({navigation}: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Client-side validation before hitting the network
  function validate(): boolean {
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return false;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit phone number.');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSendOtp() {
    if (!validate()) return;

    setLoading(true);
    try {
      await sendOtp(phone.trim());
      // Navigate to OTP screen – pass phone so OtpVerifyScreen can use it
      navigation.navigate('OtpVerify', {phone: phone.trim()});
    } catch (err: unknown) {
      const message =
        (err as {response?: {data?: {error?: string}}})?.response?.data
          ?.error ?? 'Failed to send OTP. Check your connection.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        {/* Logo / header */}
        <View style={styles.header}>
          <Text style={styles.logo}>💸</Text>
          <Text style={styles.appName}>MiniLedger</Text>
          <Text style={styles.tagline}>Track money you lend to friends</Text>
        </View>

        {/* Phone input */}
        <View style={styles.card}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={text => {
                setPhone(text.replace(/\D/g, '')); // strip non-digits live
                setError('');
              }}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />
          </View>

          {/* Inline error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Send OTP">
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            💡 Check the backend server console for your OTP
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: COLORS.background},
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textLight,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
  },
  prefix: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginRight: 8,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: COLORS.text,
    paddingVertical: 14,
    paddingLeft: 8,
    letterSpacing: 1,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: 6,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 16,
  },
});
