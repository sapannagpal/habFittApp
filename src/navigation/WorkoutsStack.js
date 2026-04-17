/**
 * WorkoutsStack — Native stack navigator for the Workouts tab.
 *
 * Screens:
 *   PlanCatalogue — browse all workout plans
 *   PlanDetail    — view details of a specific plan
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlanCatalogueScreen from '../screens/PlanCatalogueScreen';
import PlanDetailScreen from '../screens/PlanDetailScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function WorkoutsStack() {
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
        name="PlanCatalogue"
        component={PlanCatalogueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
