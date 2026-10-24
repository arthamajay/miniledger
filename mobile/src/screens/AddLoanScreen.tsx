/**
 * screens/AddLoanScreen.tsx
 *
 * Form to create a new loan entry.
 *
 * FIELDS:
 *   - Friend name (text)
 *   - Amount (numeric)
 *   - Due date (YYYY-MM-DD, picked via a simple text input with format hint)
 *   - Note (optional)
 *
 * VALIDATION (client-side mirror of the backend Zod schema):
 *   - Friend name required, max 100 chars
 *   - Amount must be positive number
 *   - Due date must be today or later, format YYYY-MM-DD
 *
 * ON SUCCESS:
 *   Navigate back to Home. useFocusEffect there will re-fetch the list.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {createLoan} from '../services/api';
import {COLORS} from '../utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddLoan'>;
};

interface FormState {
  friend_name: string;
  amount: string;
  due_date: string;
  note: string;
}

interface FormErrors {
  friend_name?: string;
  amount?: string;
  due_date?: string;
}

// Format today's date as YYYY-MM-DD for the placeholder
function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function AddLoanScreen({navigation}: Props) {
  const [form, setForm] = useState<FormState>({
    friend_name: '',
    amount: '',
    due_date: '',
    note: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm(prev => ({...prev, [field]: value}));
    // Clear the error for this field as the user types
    setErrors(prev => ({...prev, [field]: undefined}));
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    // Friend name
    if (!form.friend_name.trim()) {
      newErrors.friend_name = 'Friend name is required.';
    } else if (form.friend_name.trim().length > 100) {
      newErrors.friend_name = 'Name must be under 100 characters.';
    }

    // Amount
    const amt = parseFloat(form.amount);
    if (!form.amount.trim()) {
      newErrors.amount = 'Amount is required.';
    } else if (isNaN(amt) || amt <= 0) {
      newErrors.amount = 'Enter a valid positive amount.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim())) {
      newErrors.amount = 'Max 2 decimal places allowed.';
    }

    // Due date
    if (!form.due_date.trim()) {
      newErrors.due_date = 'Due date is required.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.due_date.trim())) {
      newErrors.due_date = 'Use format YYYY-MM-DD (e.g. 2025-06-30)';
    } else {
      const due = new Date(form.due_date.trim() + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due <= today) {
        newErrors.due_date = 'Due date must be in the future.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      await createLoan({
        friend_name: form.friend_name.trim(),
        amount: parseFloat(form.amount),
        due_date: form.due_date.trim(),
        note: form.note.trim() || undefined,
      });

      Alert.alert('Success', 'Loan entry added!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err: unknown) {
      const msg =
        (err as {response?: {data?: {error?: string}}})?.response?.data
          ?.error ?? 'Failed to add loan. Try again.';
      Alert.alert('Error', msg);
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
        {/* Friend name */}
        <View style={styles.field}>
          <Text style={styles.label}>Friend's Name *</Text>
          <TextInput
            style={[styles.input, errors.friend_name && styles.inputError]}
            placeholder="e.g. Rahul"
            placeholderTextColor={COLORS.textLight}
            value={form.friend_name}
            onChangeText={v => updateField('friend_name', v)}
            maxLength={100}
            returnKeyType="next"
          />
          {errors.friend_name ? (
            <Text style={styles.errorText}>{errors.friend_name}</Text>
          ) : null}
        </View>

        {/* Amount */}
        <View style={styles.field}>
          <Text style={styles.label}>Amount (₹) *</Text>
          <TextInput
            style={[styles.input, errors.amount && styles.inputError]}
            placeholder="e.g. 500"
            placeholderTextColor={COLORS.textLight}
            keyboardType="decimal-pad"
            value={form.amount}
            onChangeText={v => updateField('amount', v)}
            returnKeyType="next"
          />
          {errors.amount ? (
            <Text style={styles.errorText}>{errors.amount}</Text>
          ) : null}
        </View>

        {/* Due date */}
        <View style={styles.field}>
          <Text style={styles.label}>Due Date *</Text>
          <TextInput
            style={[styles.input, errors.due_date && styles.inputError]}
            placeholder={`YYYY-MM-DD (e.g. ${getTodayString()})`}
            placeholderTextColor={COLORS.textLight}
            value={form.due_date}
            onChangeText={v => updateField('due_date', v)}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            returnKeyType="next"
          />
          {errors.due_date ? (
            <Text style={styles.errorText}>{errors.due_date}</Text>
          ) : null}
        </View>

        {/* Note (optional) */}
        <View style={styles.field}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Lunch, Movie tickets…"
            placeholderTextColor={COLORS.textLight}
            value={form.note}
            onChangeText={v => updateField('note', v)}
            multiline
            numberOfLines={3}
            maxLength={500}
            returnKeyType="done"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Add loan">
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Loan Entry</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: COLORS.background},
  container: {padding: 20, paddingBottom: 40},
  field: {marginBottom: 20},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {opacity: 0.6},
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
