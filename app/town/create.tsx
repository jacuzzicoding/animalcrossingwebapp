import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store';
import { Colors } from '@/constants/colors';
import { AC_GAMES, ACGame } from '@/types';

export default function CreateTownScreen() {
  const router = useRouter();
  const createTown = useAppStore((s) => s.createTown);

  const [townName, setTownName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedGame, setSelectedGame] = useState<ACGame>('ACGCN');

  function handleCreate() {
    if (!townName.trim()) {
      Alert.alert('Missing info', 'Please enter a town name.');
      return;
    }
    if (!playerName.trim()) {
      Alert.alert('Missing info', 'Please enter your player name.');
      return;
    }
    createTown({ name: townName.trim(), playerName: playerName.trim(), game: selectedGame });
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Set up your town to start tracking your museum donations.
        </Text>

        {/* Town Name */}
        <Text style={styles.label}>Town Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Nookton"
          placeholderTextColor={Colors.textMuted}
          value={townName}
          onChangeText={setTownName}
          maxLength={20}
          returnKeyType="next"
        />

        {/* Player Name */}
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Isabelle"
          placeholderTextColor={Colors.textMuted}
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
              <View style={styles.gameText}>
                <Text style={[styles.gameLabel, selectedGame === game.id && styles.gameLabelSelected]}>
                  {game.label}
                </Text>
                <Text style={styles.gameYear}>{game.year}</Text>
              </View>
              <View style={[styles.radio, selectedGame === game.id && styles.radioSelected]}>
                {selectedGame === game.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} activeOpacity={0.85}>
          <Text style={styles.createBtnText}>Create Town 🍃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },

  intro: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },

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

  gameList: { marginBottom: 28 },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gameRowSelected: {
    borderColor: Colors.green,
    backgroundColor: Colors.donatedBg,
  },
  gameText:  { flex: 1 },
  gameLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  gameLabelSelected: { color: Colors.greenDark },
  gameYear:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.green },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.green },

  createBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
