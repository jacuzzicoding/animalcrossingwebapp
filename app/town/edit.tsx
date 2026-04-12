import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store';
import { Colors } from '@/constants/colors';
import { AC_GAMES, ACGame } from '@/types';

export default function EditTownScreen() {
  const router = useRouter();
  const activeTown = useAppStore((s) => s.getActiveTown());
  const towns = useAppStore((s) => s.towns);
  const updateTown = useAppStore((s) => s.updateTown);
  const deleteTown = useAppStore((s) => s.deleteTown);
  const setActiveTown = useAppStore((s) => s.setActiveTown);

  const [townName, setTownName] = useState(activeTown?.name ?? '');
  const [playerName, setPlayerName] = useState(activeTown?.playerName ?? '');
  const [selectedGame, setSelectedGame] = useState<ACGame>(activeTown?.game ?? 'ACGCN');

  if (!activeTown) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.noTownText}>No active town.</Text>
        </View>
      </SafeAreaView>
    );
  }

  function handleSave() {
    if (!townName.trim()) {
      Alert.alert('Missing info', 'Please enter a town name.');
      return;
    }
    if (!playerName.trim()) {
      Alert.alert('Missing info', 'Please enter a player name.');
      return;
    }
    updateTown(activeTown!.id, {
      name: townName.trim(),
      playerName: playerName.trim(),
      game: selectedGame,
    });
    router.back();
  }

  function handleDelete() {
    Alert.alert(
      'Delete Town',
      `Are you sure you want to delete "${activeTown!.name}"? All donation records will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTown(activeTown!.id);
            router.back();
          },
        },
      ]
    );
  }

  function handleSwitchTown(id: string) {
    setActiveTown(id);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Town Name */}
        <Text style={styles.label}>Town Name</Text>
        <TextInput
          style={styles.input}
          value={townName}
          onChangeText={setTownName}
          maxLength={20}
          returnKeyType="next"
        />

        {/* Player Name */}
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
          returnKeyType="done"
        />

        {/* Game Version */}
        <Text style={styles.label}>Game Version</Text>
        <View style={styles.gameList}>
          {AC_GAMES.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameRow, selectedGame === game.id && styles.gameRowSelected]}
              onPress={() => setSelectedGame(game.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.gameLabel, selectedGame === game.id && styles.gameLabelSelected]}>
                {game.label}
              </Text>
              <View style={[styles.radio, selectedGame === game.id && styles.radioSelected]}>
                {selectedGame === game.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Switch town */}
        {towns.length > 1 && (
          <>
            <Text style={[styles.label, { marginTop: 28 }]}>Switch Town</Text>
            {towns.filter((t) => t.id !== activeTown.id).map((t) => (
              <TouchableOpacity key={t.id} style={styles.townRow} onPress={() => handleSwitchTown(t.id)}>
                <View>
                  <Text style={styles.townRowName}>{t.name}</Text>
                  <Text style={styles.townRowSub}>{t.playerName}</Text>
                </View>
                <Text style={styles.townRowArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Create new town */}
        <TouchableOpacity style={styles.newTownBtn} onPress={() => router.push('/town/create')}>
          <Text style={styles.newTownText}>+ Create Another Town</Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete This Town</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noTownText: { color: Colors.textMuted, fontSize: 16 },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  gameList: { marginBottom: 24 },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gameRowSelected: { borderColor: Colors.green, backgroundColor: Colors.donatedBg },
  gameLabel:         { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  gameLabelSelected: { color: Colors.greenDark },
  radio:         { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.green },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.green },

  saveBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  townRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  townRowName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  townRowSub:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  townRowArrow:{ fontSize: 22, color: Colors.textMuted },

  newTownBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: Colors.green,
    borderStyle: 'dashed',
  },
  newTownText: { color: Colors.green, fontSize: 15, fontWeight: '700' },

  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBtnText: { color: Colors.error, fontSize: 15, fontWeight: '600' },
});
