import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store';
import { Colors, CategoryColors } from '@/constants/colors';
import { CATEGORIES, Category } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsScreen() {
  const activeTown = useAppStore((s) => s.getActiveTown());
  const getProgress = useAppStore((s) => s.getProgress);
  const getRecentDonations = useAppStore((s) => s.getRecentDonations);

  if (!activeTown) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState icon="📊" title="No town selected" subtitle="Create a town to see your analytics." />
      </SafeAreaView>
    );
  }

  const progress = getProgress(activeTown.id);
  const allDonations = getRecentDonations(activeTown.id, 999);

  // Monthly breakdown
  const monthlyCount: number[] = new Array(12).fill(0);
  allDonations.forEach((d) => {
    const m = new Date(d.donatedAt).getMonth();
    monthlyCount[m]++;
  });
  const maxMonthly = Math.max(...monthlyCount, 1);

  // Category breakdown
  const categoryDonations = CATEGORIES.map((cat) => {
    const count = allDonations.filter((d) => d.category === cat.id).length;
    return { ...cat, count };
  });

  const totalDonated = progress.donated;
  const totalRemaining = progress.total - progress.donated;
  const completionPct = Math.round(progress.percentage * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Analytics</Text>
        <Text style={styles.sub}>{activeTown.name}</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.donatedBg }]}>
            <Text style={[styles.summaryNumber, { color: Colors.donated }]}>{totalDonated}</Text>
            <Text style={styles.summaryLabel}>Donated</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.undoneBg }]}>
            <Text style={[styles.summaryNumber, { color: Colors.textMuted }]}>{totalRemaining}</Text>
            <Text style={styles.summaryLabel}>Remaining</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.greenDark + '18' }]}>
            <Text style={[styles.summaryNumber, { color: Colors.green }]}>{completionPct}%</Text>
            <Text style={styles.summaryLabel}>Complete</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By Category</Text>
          {progress.byCategory.map((cp) => {
            const cat = CATEGORIES.find((c) => c.id === cp.category)!;
            const accent = CategoryColors[cp.category as Category];
            return (
              <View key={cp.category} style={styles.catRow}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <View style={styles.catInfo}>
                  <View style={styles.catTopRow}>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <Text style={[styles.catCount, { color: accent.bg }]}>
                      {cp.donated}/{cp.total}
                    </Text>
                  </View>
                  <ProgressBar progress={cp.percentage} color={accent.bg} height={6} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Monthly Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Donation Activity</Text>
          {allDonations.length === 0 ? (
            <Text style={styles.noData}>No donations recorded yet.</Text>
          ) : (
            <>
              <Text style={styles.chartSubtitle}>Donations per month</Text>
              <View style={styles.barChart}>
                {MONTHS.map((month, i) => {
                  const count = monthlyCount[i];
                  const heightPct = count / maxMonthly;
                  return (
                    <View key={month} style={styles.barCol}>
                      <Text style={styles.barCount}>{count > 0 ? count : ''}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(heightPct * 100, count > 0 ? 8 : 0)}%`,
                              backgroundColor: count > 0 ? Colors.green : Colors.borderLight,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{month}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Category donation share (if any donated) */}
        {totalDonated > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Donation Share</Text>
            {categoryDonations.map((cat) => {
              if (cat.count === 0) return null;
              const pct = cat.count / totalDonated;
              const accent = CategoryColors[cat.id as Category];
              return (
                <View key={cat.id} style={styles.shareRow}>
                  <Text style={styles.shareIcon}>{cat.icon}</Text>
                  <Text style={styles.shareLabel}>{cat.label}</Text>
                  <View style={styles.shareBarWrap}>
                    <View style={[styles.shareBar, { width: `${pct * 100}%`, backgroundColor: accent.bg }]} />
                  </View>
                  <Text style={[styles.sharePct, { color: accent.bg }]}>{Math.round(pct * 100)}%</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  heading: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  sub:     { fontSize: 13, color: Colors.textMuted, marginBottom: 20 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  summaryNumber: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  summaryLabel:  { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  noData:    { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },

  catRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  catIcon:   { fontSize: 20, width: 32 },
  catInfo:   { flex: 1 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  catLabel:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  catCount:  { fontSize: 13, fontWeight: '700' },

  chartSubtitle: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 4,
  },
  barCol:    { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barCount:  { fontSize: 9, color: Colors.textMuted, marginBottom: 2 },
  barTrack:  { width: '80%', flex: 1, justifyContent: 'flex-end' },
  barFill:   { width: '100%', borderRadius: 3, minHeight: 0 },
  barLabel:  { fontSize: 9, color: Colors.textMuted, marginTop: 4 },

  shareRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  shareIcon:   { fontSize: 16, width: 26 },
  shareLabel:  { fontSize: 13, color: Colors.textSecondary, width: 60 },
  shareBarWrap:{ flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  shareBar:    { height: '100%', borderRadius: 4 },
  sharePct:    { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
});
