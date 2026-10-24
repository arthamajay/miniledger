/**
 * screens/OtpVerifyScreen.tsx
 *
 * Step 2 of login: user types the 6-digit OTP they see in server logs.
 *
 * ON SUBMIT:
 * 1. Validate: code must be exactly 6 digits.
 * 2. Call verifyOtp(phone, code) – server validates and returns a JWT.
 * 3. Save the user in AuthContext → navigation auto-switches to Home.
 *
 * RESEND:
 * The "Resend OTP" button calls sendOtp again and resets a 30-second
 * cooldown timer so users don't spam requests.
 */

import React, {useState, useEffect, useRef} from 'react';
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
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../types';
import {verifyOtp, sendOtp} from '../services/api';
import {useAuth} from '../context/AuthContext';
import {COLORS} from '../utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OtpVerify'>;
  route: RouteProp<RootStackParamList, 'OtpVerify'>;
};

const RESEND_COOLDOWN = 30; // seconds

export default function OtpVerifyScreen({navigation, route}: Props) {
  const {phone} = route.params;
  const {setUser} = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown for resend button on mount
  useEffect(() => {
    startCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function validate(): boolean {
    if (!code.trim()) {
      setError('Please enter the OTP.');
      return false;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('OTP must be exactly 6 digits.');
      return false;
    }
    setError('');
    return true;
  }

  async function handleVerify() {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await verifyOtp(phone, code.trim());
      setUser(user); // this triggers navigation to Home via App.tsx
    } catch (err: unknown) {
      const message =
        (err as {response?: {data?: {error?: string}}})?.response?.data
          ?.error ?? 'Invalid OTP. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    try {
      await sendOtp(phone);
      startCooldown();
      Alert.alert('OTP Sent', 'Check the server console for the new OTP.');
    } catch {
      Alert.alert('Error', 'Could not resend OTP.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code shown in{'\n'}the server console for{' '}
          <Text style={styles.phone}>+91 {phone}</Text>
        </Text>

        {/* 6-digit OTP input */}
        <TextInput
          style={[styles.otpInput, error ? styles.inputError : null]}
          placeholder="_ _ _ _ _ _"
          placeholderTextColor={COLORS.border}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={text => {
            setCode(text.replace(/\D/g, ''));
            setError('');
          }}
          returnKeyType="done"
          onSubmitEditing={handleVerify}
          textAlign="center"
          accessibilityLabel="OTP input"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Verify OTP">
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Login</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={cooldown > 0}
          style={styles.resendBtn}>
          <Text
            style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
            {cooldown > 0
              ? `Resend OTP in ${cooldown}s`
              : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: COLORS.background},
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  back: {
    marginBottom: 24,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 22,
    marginBottom: 36,
  },
  phone: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  otpInput: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 18,
    letterSpacing: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {opacity: 0.6},
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  resendDisabled: {
    color: COLORS.textLight,
  },
});
