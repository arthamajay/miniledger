/**
 * screens/LoanDetailScreen.tsx
 *
 * Shows full details for a single loan and lets the user:
 *   1. Mark the loan as repaid (PATCH /loans/:id/repay)
 *   2. Upload a receipt photo (PATCH /loans/:id/receipt)  ← Bonus
 *   3. Delete the loan (DELETE /loans/:id)
 *
 * BONUS – RECEIPT UPLOAD:
 * The "Attach Receipt" button opens the device image library via
 * react-native-image-picker. The chosen image is sent to the server
 * as multipart/form-data.
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {launchImageLibrary} from 'react-native-image-picker';
import {RootStackParamList, Loan} from '../types';
import {fetchLoan, repayLoan, deleteLoan, uploadReceipt} from '../services/api';
import {
  formatCurrency,
  formatDate,
  getDaysOverdue,
  getDaysUntilDue,
} from '../utils/formatters';
import {COLORS, API_BASE_URL} from '../utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LoanDetail'>;
  route: RouteProp<RootStackParamList, 'LoanDetail'>;
};

export default function LoanDetailScreen({navigation, route}: Props) {
  const {loanId} = route.params;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadLoan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLoan(loanId);
      setLoan(data);
    } catch {
      Alert.alert('Error', 'Could not load loan details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [loanId, navigation]);

  useEffect(() => {
    loadLoan();
  }, [loadLoan]);

  // ── Mark as repaid ─────────────────────────────────────────────────────────
  async function handleRepay() {
    Alert.alert(
      'Mark as Repaid',
      `Confirm that ${loan?.friend_name} has repaid ${formatCurrency(Number(loan?.amount))}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              const updated = await repayLoan(loanId);
              setLoan(updated);
              Alert.alert('Done!', 'Loan marked as repaid.');
            } catch (err: unknown) {
              const msg =
                (err as {response?: {data?: {error?: string}}})?.response
                  ?.data?.error ?? 'Failed to update.';
              Alert.alert('Error', msg);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }

  // ── Delete loan ────────────────────────────────────────────────────────────
  async function handleDelete() {
    Alert.alert(
      'Delete Loan',
      'This will permanently delete this loan entry.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteLoan(loanId);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete loan.');
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }

  // ── Upload receipt (Bonus) ────────────────────────────────────────────────
  async function handleUploadReceipt() {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.7},
      async response => {
        if (response.didCancel || !response.assets?.[0]) return;
        const asset = response.assets[0];
        if (!asset.uri || !asset.type || !asset.fileName) return;

        setActionLoading(true);
        try {
          const updated = await uploadReceipt(
            loanId,
            asset.uri,
            asset.type,
            asset.fileName,
          );
          setLoan(updated);
          Alert.alert('Uploaded!', 'Receipt photo attached to this loan.');
        } catch {
          Alert.alert('Error', 'Failed to upload receipt.');
        } finally {
          setActionLoading(false);
        }
      },
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!loan) return null;

  const isOverdue = loan.is_overdue && !loan.is_repaid;
  const daysOverdue = getDaysOverdue(loan.due_date);
  const daysLeft = getDaysUntilDue(loan.due_date);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Amount hero */}
      <View
        style={[
          styles.hero,
          {backgroundColor: isOverdue ? '#FFF0F0' : loan.is_repaid ? '#EAFAF1' : '#EEF0FF'},
        ]}>
        <Text
          style={[
            styles.heroAmount,
            {
              color: isOverdue
                ? COLORS.danger
                : loan.is_repaid
                ? COLORS.success
                : COLORS.primary,
            },
          ]}>
          {formatCurrency(Number(loan.amount))}
        </Text>
        <Text style={styles.heroName}>{loan.friend_name}</Text>

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isOverdue
                ? COLORS.danger
                : loan.is_repaid
                ? COLORS.success
                : COLORS.primary,
            },
          ]}>
          <Text style={styles.statusText}>
            {loan.is_repaid
              ? '✓ REPAID'
              : isOverdue
              ? `⚠ ${daysOverdue}d OVERDUE`
              : `${daysLeft}d remaining`}
          </Text>
        </View>
      </View>

      {/* Details card */}
      <View style={styles.card}>
        <DetailRow label="Due Date" value={formatDate(loan.due_date)} />
        {loan.is_repaid && loan.repaid_at && (
          <DetailRow
            label="Repaid On"
            value={formatDate(loan.repaid_at.split('T')[0])}
          />
        )}
        {loan.note && <DetailRow label="Note" value={loan.note} />}
        <DetailRow
          label="Added On"
          value={formatDate(loan.created_at.split('T')[0])}
        />
      </View>

      {/* Receipt image (if any) */}
      {loan.receipt_url && (
        <View style={styles.receiptContainer}>
          <Text style={styles.sectionLabel}>Receipt</Text>
          <Image
            source={{uri: API_BASE_URL + loan.receipt_url}}
            style={styles.receiptImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {!loan.is_repaid && (
          <TouchableOpacity
            style={[styles.btn, styles.btnRepay]}
            onPress={handleRepay}
            disabled={actionLoading}
            accessibilityRole="button"
            accessibilityLabel="Mark as repaid">
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>✓ Mark as Repaid</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Bonus: Upload receipt */}
        <TouchableOpacity
          style={[styles.btn, styles.btnReceipt]}
          onPress={handleUploadReceipt}
          disabled={actionLoading}
          accessibilityRole="button"
          accessibilityLabel="Attach receipt photo">
          <Text style={[styles.btnText, {color: COLORS.primary}]}>
            📎 {loan.receipt_url ? 'Change Receipt' : 'Attach Receipt'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnDelete]}
          onPress={handleDelete}
          disabled={actionLoading}
          accessibilityRole="button"
          accessibilityLabel="Delete loan">
          <Text style={[styles.btnText, {color: COLORS.danger}]}>
            🗑 Delete
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  hero: {
    padding: 32,
    alignItems: 'center',
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 6,
  },
  statusBadge: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  receiptContainer: {marginTop: 8},
  receiptImage: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 12,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  btnRepay: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  btnReceipt: {
    backgroundColor: '#EEF0FF',
    borderColor: COLORS.primary,
  },
  btnDelete: {
    backgroundColor: '#FFF0F0',
    borderColor: COLORS.danger,
  },
  btnText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#fff',
  },
});
