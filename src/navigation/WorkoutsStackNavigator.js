/**
 * Workout Stack Navigator.
 * Mounted as the Workouts tab component so the bottom tab bar stays visible.
 *
 * Flow:
 *   PlanCatalogue → PlanDetail → (activate) → WeeklySchedule
 *   WeeklySchedule → (tap day) → ActiveSession → WorkoutSummary → WeeklySchedule
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import PlanCatalogueScreen  from '../screens/workout/PlanCatalogueScreen';
import PlanDetailScreen     from '../screens/workout/PlanDetailScreen';
import WeeklyScheduleScreen from '../screens/workout/WeeklyScheduleScreen';
import ActiveSessionScreen  from '../screens/workout/ActiveSessionScreen';
import WorkoutSummaryScreen from '../screens/workout/WorkoutSummaryScreen';
import WeightUnitScreen     from '../screens/WeightUnitScreen';
import ScreenErrorBoundary  from '../components/common/ScreenErrorBoundary';

const Stack = createNativeStackNavigator();

function withErrorBoundary(ScreenComponent) {
  return function BoundedScreen(props) {
    return (
      <ScreenErrorBoundary
        onGoBack={props.navigation.canGoBack() ? () => props.navigation.goBack() : undefined}
      >
        <ScreenComponent {...props} />
      </ScreenErrorBoundary>
    );
  };
}

// Module-scope wrapped components — defined once, stable identity across renders
const BoundedPlanCatalogue   = withErrorBoundary(PlanCatalogueScreen);
const BoundedPlanDetail      = withErrorBoundary(PlanDetailScreen);
const BoundedWeeklySchedule  = withErrorBoundary(WeeklyScheduleScreen);
const BoundedActiveSession   = withErrorBoundary(ActiveSessionScreen);
const BoundedWorkoutSummary  = withErrorBoundary(WorkoutSummaryScreen);
const BoundedWeightUnit      = withErrorBoundary(WeightUnitScreen);

export default function WorkoutsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'slide_from_right',
        gestureEnabled: true,        // iOS swipe-from-left-edge to go back
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true, // Allow swipe from anywhere on screen, not just edge
      }}
    >
      <Stack.Screen name="PlanCatalogue"   component={BoundedPlanCatalogue} />
      <Stack.Screen name="PlanDetail"      component={BoundedPlanDetail} />
      <Stack.Screen name="WeeklySchedule"  component={BoundedWeeklySchedule} />
      <Stack.Screen name="ActiveSession"   component={BoundedActiveSession} />
      <Stack.Screen name="WorkoutSummary"  component={BoundedWorkoutSummary} />
      <Stack.Screen
        name="WeightUnit"
        component={BoundedWeightUnit}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
