import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { Colors } from '@/constants/colors';
import { Town } from '@/types';

export function TownSwitcher() {
  const router = useRouter();
  const towns = useAppStore((s) => s.towns);
  const activeTown = useAppStore((s) => s.getActiveTown());
  const setActiveTown = useAppStore((s) => s.setActiveTown);
  const [open, setOpen] = useState(false);

  function handleSelect(town: Town) {
    setActiveTown(town.id);
    setOpen(false);
  }

  // No towns yet — prompt to create
  if (towns.length === 0) {
    return (
      <View style={styles.bar}>
        <View style={styles.left}>
          <Text style={styles.noTownLabel}>No town selected</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/town/create')}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.createBtnText}>Create Town</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.bar}>
        {/* Town pill — tappable only when multiple towns */}
        <TouchableOpacity
          style={styles.left}
          onPress={() => towns.length > 1 && setOpen(true)}
          activeOpacity={towns.length > 1 ? 0.7 : 1}
          disabled={towns.length === 1}
        >
          <Ionicons name="leaf" size={14} color={Colors.green} style={styles.leafIcon} />
          <Text style={styles.townName} numberOfLines={1}>
            {activeTown?.name ?? '—'}
          </Text>
          <Text style={styles.gameBadge}>{activeTown?.game}</Text>
          {towns.length > 1 && (
            <Ionicons name="chevron-down" size={13} color={Colors.textMuted} style={styles.chevron} />
          )}
        </TouchableOpacity>

        {/* Add new town */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/town/create')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add-circle-outline" size={22} color={Colors.green} />
        </TouchableOpacity>
      </View>

      {/* Town picker modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Switch Town</Text>
            <FlatList
              data={towns}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => {
                const isActive = item.id === activeTown?.id;
                return (
                  <TouchableOpacity
                    style={[styles.townRow, isActive && styles.townRowActive]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.townRowLeft}>
                      <Text style={[styles.townRowName, isActive && styles.townRowNameActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.townRowMeta}>
                        {item.playerName} · {item.game}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.newTownRow}
              onPress={() => { setOpen(false); router.push('/town/create'); }}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.green} />
              <Text style={styles.newTownText}>Create new town…</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabBarBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: { paddingTop: 10 },
      android: { paddingTop: 10 },
    }),
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  leafIcon:  { marginRight: 6 },
  townName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
    marginRight: 6,
  },
  gameBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  chevron: { marginLeft: 4 },

  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  noTownLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  townRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  townRowActive: {
    backgroundColor: Colors.donatedBg,
  },
  townRowLeft:   { flex: 1 },
  townRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  townRowNameActive: { color: Colors.greenDark },
  townRowMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },

  newTownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  newTownText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.green,
  },
});
