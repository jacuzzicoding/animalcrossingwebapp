import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { Colors, CategoryColors } from '@/constants/colors';
import { Category } from '@/types';
import { getItemById } from '@/data';

export default function ItemDetailScreen() {
  const { category, id } = useLocalSearchParams<{ category: Category; id: string }>();
  const navigation = useNavigation();

  const activeTown = useAppStore((s) => s.getActiveTown());
  const isDonated = useAppStore((s) => s.isDonated);
  const donate = useAppStore((s) => s.donate);
  const undonate = useAppStore((s) => s.undonate);
  const getDonationRecord = useAppStore((s) => s.getDonationRecord);

  const item = getItemById(id);
  const accent = CategoryColors[category ?? 'fish'];
  const donated = activeTown ? isDonated(activeTown.id, id) : false;
  const record = activeTown ? getDonationRecord(activeTown.id, id) : undefined;

  useEffect(() => {
    navigation.setOptions({ title: item?.name ?? 'Item' });
  }, [item]);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Item not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  function handleToggle() {
    if (!activeTown) return;
    if (donated) {
      undonate(activeTown.id, id);
    } else {
      donate(activeTown.id, id, category as Category);
    }
  }

  function renderDetails() {
    switch (item!.category) {
      case 'fish':
        return (
          <>
            <DetailRow icon="location" label="Location" value={item.location} />
            <DetailRow icon="calendar" label="Season" value={item.season} />
          </>
        );
      case 'bugs':
        return <DetailRow icon="calendar" label="Season" value={item.season} />;
      case 'fossils':
        if (item.part) {
          return <DetailRow icon="build" label="Part" value={item.part} />;
        }
        return <DetailRow icon="information-circle" label="Type" value="Standalone fossil" />;
      case 'art':
        return <DetailRow icon="image" label="Based on" value={item.basedOn} />;
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: accent.light }]}>
          <View style={[styles.iconCircle, { backgroundColor: accent.bg }]}>
            <Text style={styles.categoryIcon}>
              {item.category === 'fish' ? '🐟'
                : item.category === 'bugs' ? '🐛'
                : item.category === 'fossils' ? '🦕'
                : '🖼️'}
            </Text>
          </View>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: accent.bg }]}>
            <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          {renderDetails()}
          <DetailRow icon="game-controller" label="Game" value="Animal Crossing (GCN)" />
        </View>

        {/* Donation status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Donation Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: donated ? Colors.donated : Colors.undone }]} />
            <Text style={styles.statusText}>
              {donated ? 'Donated to museum' : 'Not yet donated'}
            </Text>
          </View>
          {record && (
            <Text style={styles.donatedDate}>
              Donated on {new Date(record.donatedAt).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </Text>
          )}
        </View>

        {/* Toggle button */}
        {activeTown && (
          <TouchableOpacity
            style={[styles.toggleBtn, donated ? styles.toggleBtnUndo : styles.toggleBtnDonate]}
            onPress={handleToggle}
            activeOpacity={0.85}
          >
            <Ionicons
              name={donated ? 'close-circle-outline' : 'checkmark-circle-outline'}
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.toggleBtnText}>
              {donated ? 'Mark as not donated' : 'Mark as donated'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon as any} size={16} color={Colors.textMuted} style={detailStyles.icon} />
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  icon:  { marginRight: 8 },
  label: { fontSize: 13, color: Colors.textMuted, width: 80 },
  value: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500', textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.textMuted, fontSize: 16 },

  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  categoryIcon: { fontSize: 36 },
  itemName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  statusRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  donatedDate: { fontSize: 13, color: Colors.textMuted, marginTop: 6, paddingLeft: 20 },

  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    margin: 16,
    marginTop: 20,
  },
  toggleBtnDonate: { backgroundColor: Colors.green },
  toggleBtnUndo:   { backgroundColor: Colors.brownMid },
  toggleBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
