/**
 * screens/HomeScreen.tsx
 *
 * Main screen after login. Shows:
 *  1. SummaryCard at the top (totals: lent, repaid, overdue)
 *  2. Scrollable list of LoanCards (overdue highlighted in red)
 *  3. FAB (Floating Action Button) to add a new loan
 *  4. Logout button in the header
 *
 * DATA FETCHING:
 * We use a custom hook (useLoanData) that fetches both the loan list
 * and the summary in parallel. It re-fetches when the screen is focused
 * (using React Navigation's useFocusEffect) so data is fresh after
 * adding or repaying a loan.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, Loan, LoanSummary} from '../types';
import {fetchLoans, fetchLoanSummary} from '../services/api';
import {useAuth} from '../context/AuthContext';
import SummaryCard from '../components/SummaryCard';
import LoanCard from '../components/LoanCard';
import {COLORS} from '../utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({navigation}: Props) {
  const {user, logout} = useAuth();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Load data function – used on focus and pull-to-refresh
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      // Parallel requests – faster than sequential
      const [loansData, summaryData] = await Promise.all([
        fetchLoans(),
        fetchLoanSummary(),
      ]);
      setLoans(loansData);
      setSummary(summaryData);
    } catch {
      setError('Could not load data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch every time this screen comes into focus
  // e.g. after navigating back from AddLoan or LoanDetail
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Header right: logout button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to log out?', [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Logout', style: 'destructive', onPress: logout},
            ]);
          }}
          style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your ledger…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={loans}
        keyExtractor={item => String(item.id)}
        // Summary card is rendered above the list
        ListHeaderComponent={
          <View>
            {/* Greeting */}
            <Text style={styles.greeting}>
              Hi +91 {user?.phone} 👋
            </Text>

            {/* Summary card */}
            {summary && <SummaryCard summary={summary} />}

            {/* Section heading */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Loans</Text>
              <Text style={styles.loanCount}>{loans.length} entries</Text>
            </View>
          </View>
        }
        renderItem={({item}) => (
          <LoanCard
            loan={item}
            onPress={() =>
              navigation.navigate('LoanDetail', {loanId: item.id})
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No loans yet</Text>
            <Text style={styles.emptyHint}>
              Tap the + button to add your first entry
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />

      {/* FAB – Floating Action Button to add a loan */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddLoan')}
        accessibilityRole="button"
        accessibilityLabel="Add new loan">
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textLight,
    paddingHorizontal: 16,
    paddingTop: 16,
    fontWeight: '500',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  loanCount: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  listContent: {
    paddingBottom: 100, // space for FAB
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 15,
  },
  errorEmoji: {fontSize: 40, marginBottom: 8},
  errorText: {color: COLORS.danger, fontSize: 15, textAlign: 'center', paddingHorizontal: 32},
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {color: '#fff', fontWeight: '600'},
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {fontSize: 48, marginBottom: 12},
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 34,
  },
  logoutBtn: {padding: 8},
  logoutText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 15,
  },
});
