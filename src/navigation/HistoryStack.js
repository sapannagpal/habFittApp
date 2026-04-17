/**
 * HistoryStack — Native stack navigator for the History tab.
 *
 * Screens:
 *   WorkoutHistory — list of completed workout sessions
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutHistoryScreen from '../screens/WorkoutHistoryScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function HistoryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgPrimary },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="WorkoutHistory"
        component={WorkoutHistoryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
