import { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { Colors, CategoryColors } from '@/constants/colors';
import { Category } from '@/types';
import { ALL_ITEMS } from '@/data';
import { CollectibleRow } from '@/components/ui/CollectibleRow';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const activeTown = useAppStore((s) => s.getActiveTown());
  const isDonated = useAppStore((s) => s.isDonated);
  const donate = useAppStore((s) => s.donate);
  const undonate = useAppStore((s) => s.undonate);
  const searchHistory = useAppStore((s) => s.searchHistory);
  const addSearchHistory = useAppStore((s) => s.addSearchHistory);
  const clearSearchHistory = useAppStore((s) => s.clearSearchHistory);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_ITEMS.filter((item) => {
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.category === 'fish' && (item.location.toLowerCase().includes(q) || item.season.toLowerCase().includes(q))) return true;
      if (item.category === 'bugs' && item.season.toLowerCase().includes(q)) return true;
      if (item.category === 'fossils' && item.part?.toLowerCase().includes(q)) return true;
      if (item.category === 'art' && item.basedOn.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query]);

  function handleSubmit() {
    if (query.trim()) addSearchHistory(query.trim());
  }

  function handleHistoryPress(h: string) {
    setQuery(h);
  }

  function handleToggle(itemId: string, category: Category) {
    if (!activeTown) return;
    if (isDonated(activeTown.id, itemId)) {
      undonate(activeTown.id, itemId);
    } else {
      donate(activeTown.id, itemId, category);
    }
  }

  const showHistory = query.trim() === '' && searchHistory.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search all museum items…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category legend */}
      <View style={styles.legend}>
        {(['fish', 'bugs', 'fossils', 'art'] as Category[]).map((cat) => {
          const accent = CategoryColors[cat];
          const icons: Record<Category, string> = { fish: '🐟', bugs: '🐛', fossils: '🦕', art: '🖼️' };
          return (
            <View key={cat} style={[styles.legendChip, { backgroundColor: accent.light }]}>
              <Text style={styles.legendText}>{icons[cat]} {cat}</Text>
            </View>
          );
        })}
      </View>

      {/* History */}
      {showHistory && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearSearchHistory}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {searchHistory.slice(0, 8).map((h) => (
            <TouchableOpacity key={h} style={styles.historyRow} onPress={() => handleHistoryPress(h)}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} style={{ marginRight: 10 }} />
              <Text style={styles.historyText}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results */}
      {query.trim() !== '' && (
        <>
          <Text style={styles.resultCount}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query.trim()}"
          </Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <CollectibleRow
                item={item}
                isDonated={!!activeTown && isDonated(activeTown.id, item.id)}
                onPress={() => router.push(`/item/${item.category}/${item.id}`)}
                onToggle={() => handleToggle(item.id, item.category as Category)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No items match "{query}"</Text>
                <Text style={styles.emptySubtext}>Try searching by name, location, or season</Text>
              </View>
            }
          />
        </>
      )}

      {/* Idle state */}
      {query.trim() === '' && !showHistory && (
        <View style={styles.idle}>
          <Text style={styles.idleIcon}>🏛️</Text>
          <Text style={styles.idleText}>Search across all 118 museum items</Text>
          <Text style={styles.idleSubtext}>Fish, bugs, fossils, and art</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.background },
  searchRow:  { padding: 12, paddingBottom: 8 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  input:      { flex: 1, fontSize: 16, color: Colors.textPrimary },

  legend: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  legendChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  legendText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },

  historySection: { paddingHorizontal: 16, paddingTop: 8 },
  historyHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  historyTitle:   { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  clearText:      { fontSize: 13, color: Colors.green, fontWeight: '600' },
  historyRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  historyText:    { fontSize: 14, color: Colors.textSecondary },

  resultCount: { fontSize: 13, color: Colors.textMuted, paddingHorizontal: 16, marginBottom: 4 },
  list:        { paddingHorizontal: 12, paddingBottom: 24 },

  empty:       { alignItems: 'center', paddingTop: 48 },
  emptyIcon:   { fontSize: 36, marginBottom: 12 },
  emptyText:   { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  emptySubtext:{ fontSize: 13, color: Colors.textMuted },

  idle:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  idleIcon:    { fontSize: 48, marginBottom: 16 },
  idleText:    { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  idleSubtext: { fontSize: 14, color: Colors.textMuted },
});
