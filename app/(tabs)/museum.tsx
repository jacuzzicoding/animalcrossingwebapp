import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store';
import { Colors, CategoryColors } from '@/constants/colors';
import { CATEGORIES, Category } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MuseumScreen() {
  const router = useRouter();
  const activeTown = useAppStore((s) => s.getActiveTown());
  const getProgress = useAppStore((s) => s.getProgress);

  if (!activeTown) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="🏛️"
          title="No town selected"
          subtitle="Create a town on the Home tab to start tracking donations."
        />
      </SafeAreaView>
    );
  }

  const progress = getProgress(activeTown.id);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Museum</Text>
        <Text style={styles.sub}>{activeTown.name} · {activeTown.playerName}</Text>

        {/* Overall */}
        <View style={styles.overallCard}>
          <Text style={styles.overallLabel}>Overall completion</Text>
          <Text style={styles.overallPct}>{Math.round(progress.percentage * 100)}%</Text>
          <ProgressBar progress={progress.percentage} color={Colors.green} height={8} />
          <Text style={styles.overallCount}>{progress.donated} of {progress.total} items donated</Text>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        {CATEGORIES.map((cat) => {
          const cp = progress.byCategory.find((c) => c.category === cat.id)!;
          const accent = CategoryColors[cat.id as Category];
          const remaining = cp.total - cp.donated;

          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.catRow}
              onPress={() => router.push(`/museum/${cat.id}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.catIcon, { backgroundColor: accent.light }]}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
              </View>

              <View style={styles.catInfo}>
                <View style={styles.catTopRow}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={[styles.catCount, { color: accent.bg }]}>
                    {cp.donated}/{cp.total}
                  </Text>
                </View>
                <ProgressBar progress={cp.percentage} color={accent.bg} height={6} />
                <Text style={styles.catRemaining}>
                  {remaining === 0
                    ? '✅ Complete!'
                    : `${remaining} remaining`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

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

  overallCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  overallPct:   { fontSize: 36, fontWeight: '800', color: Colors.green, marginBottom: 10 },
  overallCount: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },

  catRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  catIcon:  {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  catEmoji: { fontSize: 26 },
  catInfo:  { flex: 1 },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  catLabel:     { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  catCount:     { fontSize: 14, fontWeight: '700' },
  catRemaining: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
