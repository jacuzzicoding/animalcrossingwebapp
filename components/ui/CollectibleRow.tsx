import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CollectibleData } from '@/types';
import { CategoryColors, Colors } from '@/constants/colors';

interface CollectibleRowProps {
  item: CollectibleData;
  isDonated: boolean;
  onPress?: () => void;
  onToggle?: () => void;
}

function getSubtitle(item: CollectibleData): string {
  switch (item.category) {
    case 'fish':    return `${item.location} · ${item.season}`;
    case 'bugs':    return item.season;
    case 'fossils': return item.part ? `${item.name} · ${item.part}` : 'Standalone fossil';
    case 'art':     return item.basedOn;
  }
}

function getDisplayName(item: CollectibleData): string {
  if (item.category === 'fossils' && item.part) {
    return `${item.name} (${item.part})`;
  }
  return item.name;
}

export function CollectibleRow({ item, isDonated, onPress, onToggle }: CollectibleRowProps) {
  const accent = CategoryColors[item.category];

  return (
    <TouchableOpacity
      style={[styles.row, isDonated && styles.rowDonated]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category pip */}
      <View style={[styles.pip, { backgroundColor: accent.bg }]} />

      {/* Text */}
      <View style={styles.text}>
        <Text style={[styles.name, isDonated && styles.nameDonated]} numberOfLines={1}>
          {getDisplayName(item)}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {getSubtitle(item)}
        </Text>
      </View>

      {/* Donate toggle */}
      <TouchableOpacity
        style={[styles.toggle, isDonated ? styles.toggleDone : styles.toggleEmpty]}
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isDonated && <Ionicons name="checkmark" size={16} color="#fff" />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  rowDonated: {
    backgroundColor: Colors.donatedBg,
  },
  pip: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  text: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  nameDonated: {
    color: Colors.textSecondary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleDone: {
    backgroundColor: Colors.donated,
  },
  toggleEmpty: {
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
});
