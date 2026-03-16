/**
 * HabFitt Main Tab Navigator.
 * Bottom tab navigation with four tabs: Home, Workouts, History, Profile.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutsStack   from './WorkoutsStack';
import HistoryStack    from './HistoryStack';
import ProfileScreen   from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

// ─── Icon helper ─────────────────────────────────────────────────────────────

function tabIcon(activeName, inactiveName) {
  return ({ focused, color, size }) => (
    <Ionicons name={focused ? activeName : inactiveName} size={size} color={color} />
  );
}

// ─── Navigator ───────────────────────────────────────────────────────────────

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.divider,
          paddingBottom: 4,
        },
        tabBarActiveTintColor:   colors.textAccent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsStack}
        options={{
          tabBarIcon: tabIcon('barbell', 'barbell-outline'),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={{
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: tabIcon('person', 'person-outline'),
        }}
      />
    </Tab.Navigator>
  );
}
