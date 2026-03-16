/**
 * HabFitt App — Root component
 *
 * Navigation strategy:
 *  - While auth state is bootstrapping → show full-screen loader
 *  - isAuthenticated = true  → AppStack (Dashboard, ...)
 *  - isAuthenticated = false → AuthStack (Login, Register, VerifyEmail)
 *
 * Stack switching is driven by AuthContext; no manual navigation.navigate
 * calls are needed for auth transitions.
 *
 * WorkoutBootstrapper: inner component that bridges AuthContext and
 * WorkoutContext — calls bootstrapActivePlan() once the user is authenticated.
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WorkoutProvider, useWorkout } from './src/context/WorkoutContext';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import ActiveSessionScreen from './src/screens/ActiveSessionScreen';
import WorkoutSummaryScreen from './src/screens/WorkoutSummaryScreen';
import WeightUnitScreen from './src/screens/WeightUnitScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetCodeScreen from './src/screens/ResetCodeScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import PasswordResetSuccessScreen from './src/screens/PasswordResetSuccessScreen';

const Stack = createNativeStackNavigator();

const HEADER_STYLE = {
  headerStyle: { backgroundColor: '#141414' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
};

// ─── WorkoutBootstrapper ──────────────────────────────────────────────────────

/**
 * Bridges AuthContext → WorkoutContext.
 * Calls bootstrapActivePlan() once the user is authenticated and not bootstrapping.
 * Must be rendered inside both AuthProvider and WorkoutProvider.
 * Returns null — no UI.
 */
function WorkoutBootstrapper() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { bootstrapActivePlan } = useWorkout();

  useEffect(() => {
    if (isAuthenticated && !isBootstrapping) {
      bootstrapActivePlan();
    }
  }, [isAuthenticated, isBootstrapping]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ─── Stacks ──────────────────────────────────────────────────────────────────

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ResetCode"
        component={ResetCodeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PasswordResetSuccess"
        component={PasswordResetSuccessScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen
        name="ActiveSession"
        component={ActiveSessionScreen}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="WeightUnit"
        component={WeightUnitScreen}
        options={{
          presentation: 'transparentModal',
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WorkoutProvider>
          {/* WorkoutBootstrapper triggers plan hydration once auth is confirmed */}
          <WorkoutBootstrapper />
          <AppNavigator />
        </WorkoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
  },
});
