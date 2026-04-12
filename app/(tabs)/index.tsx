import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { Colors, CategoryColors } from '@/constants/colors';
import { CATEGORIES, Category } from '@/types';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { getItemById } from '@/data';

export default function HomeScreen() {
  const router = useRouter();
  const activeTown = useAppStore((s) => s.getActiveTown());
  const getProgress = useAppStore((s) => s.getProgress);
  const getRecentDonations = useAppStore((s) => s.getRecentDonations);

  if (!activeTown) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="🏡"
          title="No town yet"
          subtitle="Create your first town to start tracking your museum donations."
        />
        <View style={styles.centerBtn}>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/town/create')}>
            <Text style={styles.createBtnText}>Create Town</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = getProgress(activeTown.id);
  const recent = getRecentDonations(activeTown.id, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.playerName}>{activeTown.playerName} 🍃</Text>
            <Text style={styles.townName}>{activeTown.name}</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/town/edit')}>
            <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Overall Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Museum Progress</Text>
            <Text style={styles.cardSubtitle}>
              {progress.donated} / {progress.total} donated
            </Text>
          </View>
          <ProgressBar
            progress={progress.percentage}
            color={Colors.green}
            height={10}
            showLabel
          />
        </View>

        {/* Category Grid */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const cp = progress.byCategory.find((c) => c.category === cat.id)!;
            return (
              <CategoryCard
                key={cat.id}
                category={cat.id as Category}
                label={cat.label}
                icon={cat.icon}
                donated={cp.donated}
                total={cp.total}
                onPress={() => router.push(`/museum/${cat.id}`)}
              />
            );
          })}
        </View>

        {/* Recent Donations */}
        {recent.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Donations</Text>
            <View style={styles.card}>
              {recent.map((record, i) => {
                const item = getItemById(record.itemId);
                if (!item) return null;
                const accent = CategoryColors[record.category];
                const date = new Date(record.donatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <View key={record.itemId} style={[styles.recentRow, i > 0 && styles.recentRowBorder]}>
                    <View style={[styles.recentDot, { backgroundColor: accent.bg }]} />
                    <View style={styles.recentText}>
                      <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.recentMeta}>{accent.bg && record.category} · {date}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.donated} />
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 8,
  },
  greeting:    { fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  playerName:  { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  townName:    { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 4,
  },

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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 13, color: Colors.textMuted },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 16 },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  recentRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  recentText:  { flex: 1 },
  recentName:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  recentMeta:  { fontSize: 12, color: Colors.textMuted, marginTop: 1, textTransform: 'capitalize' },

  centerBtn: { paddingHorizontal: 32, paddingBottom: 40 },
  createBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
