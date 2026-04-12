import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, CategoryColors } from '@/constants/colors';
import { ProgressBar } from './ProgressBar';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  label: string;
  icon: string;
  donated: number;
  total: number;
  onPress: () => void;
}

export function CategoryCard({ category, label, icon, donated, total, onPress }: CategoryCardProps) {
  const accent = CategoryColors[category];
  const progress = total > 0 ? donated / total : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconBadge, { backgroundColor: accent.light }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.count}>
        <Text style={{ color: accent.bg, fontWeight: '700' }}>{donated}</Text>
        <Text style={styles.total}> / {total}</Text>
      </Text>
      <ProgressBar progress={progress} color={accent.bg} height={6} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    margin: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 140,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  icon: { fontSize: 24 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  count: {
    fontSize: 13,
    marginBottom: 8,
  },
  total: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
});
