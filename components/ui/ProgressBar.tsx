import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0–1
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  progress,
  color = Colors.green,
  height = 8,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const pct = Math.min(Math.max(progress, 0), 1);
  const displayPct = Math.round(pct * 100);

  return (
    <View style={styles.wrapper}>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && <Text style={[styles.pct, { color }]}>{displayPct}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${displayPct}%`, backgroundColor: color, height },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:  { width: '100%' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label:    { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  pct:      { fontSize: 13, fontWeight: '700' },
  track:    { backgroundColor: Colors.borderLight, borderRadius: 99, overflow: 'hidden', width: '100%' },
  fill:     { borderRadius: 99 },
});
