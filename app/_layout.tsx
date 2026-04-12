import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="museum/[category]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            headerBackTitle: 'Museum',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="item/[category]/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="town/create"
          options={{
            headerShown: true,
            title: 'Create Town',
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="town/edit"
          options={{
            headerShown: true,
            title: 'Edit Town',
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            presentation: 'modal',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
