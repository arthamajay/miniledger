/**
 * components/LoanCard.tsx
 *
 * A single row in the loan list.
 *
 * VISUAL DESIGN:
 * - Normal loan      → white card with purple accent
 * - Overdue loan     → red-tinted card with "OVERDUE" badge
 * - Repaid loan      → grey/muted card with green "REPAID" badge
 *
 * The card is tappable (navigates to LoanDetail for repay / photo upload).
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Loan} from '../types';
import {formatCurrency, formatDate, getDaysOverdue} from '../utils/formatters';
import {COLORS} from '../utils/constants';

interface Props {
  loan: Loan;
  onPress: () => void;
}

export default function LoanCard({loan, onPress}: Props) {
  // Determine visual state
  const isOverdue = loan.is_overdue && !loan.is_repaid;
  const isRepaid = loan.is_repaid;

  const cardBorderColor = isOverdue
    ? COLORS.danger
    : isRepaid
    ? COLORS.border
    : COLORS.primary;

  const amountColor = isOverdue
    ? COLORS.danger
    : isRepaid
    ? COLORS.success
    : COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {borderLeftColor: cardBorderColor},
        isOverdue && styles.overdueCard,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Top row: friend name + amount */}
      <View style={styles.row}>
        {/* Avatar circle with first letter */}
        <View style={[styles.avatar, {backgroundColor: cardBorderColor + '22'}]}>
          <Text style={[styles.avatarText, {color: cardBorderColor}]}>
            {loan.friend_name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{loan.friend_name}</Text>
          {loan.note ? (
            <Text style={styles.note} numberOfLines={1}>
              {loan.note}
            </Text>
          ) : null}
        </View>

        <View style={styles.right}>
          <Text style={[styles.amount, {color: amountColor}]}>
            {formatCurrency(Number(loan.amount))}
          </Text>
          {/* Status badge */}
          {isRepaid ? (
            <View style={[styles.badge, styles.badgeRepaid]}>
              <Text style={styles.badgeTextRepaid}>REPAID</Text>
            </View>
          ) : isOverdue ? (
            <View style={[styles.badge, styles.badgeOverdue]}>
              <Text style={styles.badgeTextOverdue}>
                {getDaysOverdue(loan.due_date)}d overdue
              </Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgePending]}>
              <Text style={styles.badgeTextPending}>PENDING</Text>
            </View>
          )}
        </View>
      </View>

      {/* Due date row */}
      <View style={styles.footer}>
        <Text style={styles.dueDateLabel}>
          {isRepaid ? 'Repaid on ' : 'Due '}
        </Text>
        <Text
          style={[
            styles.dueDateValue,
            isOverdue && {color: COLORS.danger, fontWeight: '600'},
          ]}>
          {isRepaid && loan.repaid_at
            ? formatDate(loan.repaid_at.split('T')[0])
            : formatDate(loan.due_date)}
        </Text>
        {loan.receipt_url ? (
          <View style={styles.receiptBadge}>
            <Text style={styles.receiptText}>📎 Receipt</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderLeftWidth: 4,
    // Shadow iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    // Shadow Android
    elevation: 2,
  },
  overdueCard: {
    backgroundColor: '#FFF8F8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  note: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeRepaid: {backgroundColor: '#EAFAF1'},
  badgeOverdue: {backgroundColor: '#FFF0F0'},
  badgePending: {backgroundColor: '#EEF0FF'},
  badgeTextRepaid: {fontSize: 10, fontWeight: '700', color: COLORS.success},
  badgeTextOverdue: {fontSize: 10, fontWeight: '700', color: COLORS.danger},
  badgeTextPending: {fontSize: 10, fontWeight: '700', color: COLORS.primary},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dueDateLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  dueDateValue: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  receiptBadge: {
    marginLeft: 'auto',
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  receiptText: {
    fontSize: 11,
    color: COLORS.primary,
  },
});
