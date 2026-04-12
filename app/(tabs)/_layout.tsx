import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  focused: boolean;
  color: string;
}

function TabIcon({ name, focused, color }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={focused ? Colors.green : color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.green,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="museum"
        options={{
          title: 'Museum',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'library' : 'library-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopColor: Colors.tabBarBorder,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: Colors.donatedBg,
  },
});
