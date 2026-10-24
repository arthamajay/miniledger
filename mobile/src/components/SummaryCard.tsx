/**
 * components/SummaryCard.tsx
 *
 * The summary card shown at the top of the Home screen.
 * Displays 4 stats in a 2×2 grid:
 *   Total Lent | Total Repaid
 *   Outstanding | Overdue
 *
 * Each stat is a coloured tile so they're visually distinct.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {LoanSummary} from '../types';
import {formatCurrency} from '../utils/formatters';
import {COLORS} from '../utils/constants';

interface Props {
  summary: LoanSummary;
}

interface StatTileProps {
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

function StatTile({label, value, color, bgColor}: StatTileProps) {
  return (
    <View style={[styles.tile, {backgroundColor: bgColor}]}>
      <Text style={[styles.tileValue, {color}]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export default function SummaryCard({summary}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Overview</Text>
      <View style={styles.grid}>
        <StatTile
          label="Total Lent"
          value={formatCurrency(summary.total_lent)}
          color={COLORS.primary}
          bgColor="#EEF0FF"
        />
        <StatTile
          label="Repaid"
          value={formatCurrency(summary.total_repaid)}
          color={COLORS.success}
          bgColor="#EAFAF1"
        />
        <StatTile
          label="Outstanding"
          value={formatCurrency(summary.total_outstanding)}
          color={COLORS.warning}
          bgColor="#FFF8EE"
        />
        <StatTile
          label="Overdue"
          value={formatCurrency(summary.total_overdue)}
          color={COLORS.danger}
          bgColor="#FFF0F0"
        />
      </View>

      {/* Loan counts row */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {summary.total_loans} total loans
        </Text>
        <Text style={styles.countSep}>·</Text>
        <Text style={[styles.countText, {color: COLORS.success}]}>
          {summary.repaid_count} repaid
        </Text>
        <Text style={styles.countSep}>·</Text>
        <Text style={[styles.countText, {color: COLORS.danger}]}>
          {summary.overdue_count} overdue
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Shadow (Android)
    elevation: 4,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  tileLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    justifyContent: 'center',
    gap: 6,
  },
  countText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  countSep: {
    color: COLORS.border,
    fontSize: 16,
  },
});
