import { useState, useMemo, useEffect } from 'react';
import { FlatList, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { Colors, CategoryColors } from '@/constants/colors';
import { CATEGORIES, Category } from '@/types';
import { ITEMS_BY_CATEGORY } from '@/data';
import { CollectibleRow } from '@/components/ui/CollectibleRow';
import { ProgressBar } from '@/components/ui/ProgressBar';

type FilterMode = 'all' | 'donated' | 'remaining';

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: Category }>();
  const router = useRouter();
  const navigation = useNavigation();

  const activeTown = useAppStore((s) => s.getActiveTown());
  const isDonated = useAppStore((s) => s.isDonated);
  const donate = useAppStore((s) => s.donate);
  const undonate = useAppStore((s) => s.undonate);
  const getCategoryProgress = useAppStore((s) => s.getCategoryProgress);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const catMeta = CATEGORIES.find((c) => c.id === category);
  const accent = CategoryColors[category ?? 'fish'];
  const items = ITEMS_BY_CATEGORY[category as Category] ?? [];

  useEffect(() => {
    navigation.setOptions({ title: catMeta?.label ?? 'Category' });
  }, [catMeta]);

  const progress = activeTown
    ? getCategoryProgress(activeTown.id, category as Category)
    : { donated: 0, total: items.length, percentage: 0 };

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (filter === 'donated') {
      list = list.filter((i) => activeTown && isDonated(activeTown.id, i.id));
    } else if (filter === 'remaining') {
      list = list.filter((i) => !activeTown || !isDonated(activeTown.id, i.id));
    }
    return list;
  }, [items, search, filter, activeTown]);

  function handleToggle(itemId: string) {
    if (!activeTown) return;
    if (isDonated(activeTown.id, itemId)) {
      undonate(activeTown.id, itemId);
    } else {
      donate(activeTown.id, itemId, category as Category);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Progress banner */}
      <View style={[styles.progressBanner, { borderBottomColor: accent.bg + '22' }]}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            <Text style={{ color: accent.bg, fontWeight: '800' }}>{progress.donated}</Text>
            {' / '}{progress.total} donated
          </Text>
          <Text style={[styles.progressPct, { color: accent.bg }]}>
            {Math.round(progress.percentage * 100)}%
          </Text>
        </View>
        <ProgressBar progress={progress.percentage} color={accent.bg} height={6} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${catMeta?.label ?? ''}…`}
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.chips}>
        {(['all', 'remaining', 'donated'] as FilterMode[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && { backgroundColor: accent.bg }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CollectibleRow
            item={item}
            isDonated={!!activeTown && isDonated(activeTown.id, item.id)}
            onPress={() => router.push(`/item/${category}/${item.id}`)}
            onToggle={() => handleToggle(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  progressBanner: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressText: { fontSize: 14, color: Colors.textSecondary },
  progressPct:  { fontSize: 16, fontWeight: '800' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  chips: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText:       { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  list:      { paddingHorizontal: 12, paddingBottom: 24 },
  empty:     { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
