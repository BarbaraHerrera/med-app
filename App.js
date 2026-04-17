import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { auth, db } from './firebaseConfig';

// Splash / Auth
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Patient
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfessionalDetailScreen from './screens/ProfessionalDetailScreen';
import BookingScreen from './screens/BookingScreen';
import PatientAppointmentsScreen from './screens/PatientAppointmentsScreen';

// Professional
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import ProfessionalDashboardScreen from './screens/ProfessionalDashboardScreen';
import ProfessionalProfileScreen from './screens/ProfessionalProfileScreen';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2D6CDF" />
      <Text style={styles.loadingText}>Cargando tu experiencia...</Text>
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setUserRole(null);
        setNeedsRoleSelection(false);
        setInitializing(false);
        return;
      }

      setUser(firebaseUser);

      const userRef = doc(db, 'users', firebaseUser.uid);

      unsubscribeUserDoc = onSnapshot(
        userRef,
        (userSnap) => {
          if (!userSnap.exists()) {
            setUserRole(null);
            setNeedsRoleSelection(true);
            setInitializing(false);
            return;
          }

          const userData = userSnap.data();

          if (!userData?.role) {
            setUserRole(null);
            setNeedsRoleSelection(true);
          } else {
            setUserRole(userData.role);
            setNeedsRoleSelection(false);
          }

          setInitializing(false);
        },
        (error) => {
          console.log('Error escuchando documento user:', error);
          setUserRole(null);
          setNeedsRoleSelection(true);
          setInitializing(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
          </>
        ) : needsRoleSelection ? (
          <>
            <Stack.Screen
              name="RoleSelection"
              component={RoleSelectionScreen}
            />
          </>
        ) : userRole === 'professional' ? (
          <>
            <Stack.Screen
              name="ProfessionalDashboard"
              component={ProfessionalDashboardScreen}
            />
            <Stack.Screen
              name="ProfessionalProfile"
              component={ProfessionalProfileScreen}
            />
            <Stack.Screen name="History" component={HistoryScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="ProfessionalDetail"
              component={ProfessionalDetailScreen}
            />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen
              name="PatientAppointments"
              component={PatientAppointmentsScreen}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 16,
    color: '#475467',
    fontWeight: '600',
  },
});