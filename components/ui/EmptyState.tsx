import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = '🍃', title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon:     { fontSize: 48, marginBottom: 16 },
  title:    { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
