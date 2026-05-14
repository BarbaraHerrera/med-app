import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';

import { auth, db } from './firebaseConfig';
import {
  setupNotificationChannel,
  registerAndSavePushToken,
} from './services/notifications';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

import RoleSelectionScreen from './screens/RoleSelectionScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfessionalDetailScreen from './screens/ProfessionalDetailScreen';
import BookingScreen from './screens/BookingScreen';
import PatientAppointmentsScreen from './screens/PatientAppointmentsScreen';
import PatientNotificationsScreen from './screens/PatientNotificationsScreen';

import ProfessionalDashboardScreen from './screens/ProfessionalDashboardScreen';
import ProfessionalProfileScreen from './screens/ProfessionalProfileScreen';
import ProfessionalNotificationsScreen from './screens/ProfessionalNotificationsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(undefined);
  const [initializing, setInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setupNotificationChannel();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setInitializing(true);
      setUser(authenticatedUser);

      if (!authenticatedUser) {
        setUserRole(null);
        setInitializing(false);
        return;
      }

      try {
        const uid = authenticatedUser.uid;
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data()?.role) {
          const role = userSnap.data().role;
          console.log('ROL OBTENIDO:', role);
          setUserRole(role);
          setInitializing(false);
          return;
        }

        // Respaldo: si ya existe como profesional
        const profQuery = query(
          collection(db, 'professionals'),
          where('userId', '==', uid),
          limit(1)
        );

        const profSnap = await getDocs(profQuery);

        if (!profSnap.empty) {
          console.log('ROL RECUPERADO DESDE PROFESSIONALS: professional');

          await setDoc(
            userRef,
            {
              role: 'professional',
              email: authenticatedUser.email,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          setUserRole('professional');
          setInitializing(false);
          return;
        }

        // Si no tiene rol ni perfil profesional, recién ahí pregunta
          console.log('Usuario sin rol definido, asignando patient por defecto');

          await setDoc(
            userRef,
            {
              uid,
              email: authenticatedUser.email,
              role: 'patient',
              onboardingCompleted: true,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

setUserRole('patient');
      } finally {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      registerAndSavePushToken();
    }
  }, [user]);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (initializing || userRole === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : userRole === null ? (
          <Stack.Screen name="RoleSelection">
            {(props) => (
              <RoleSelectionScreen
                {...props}
                onRoleSelected={(role) => setUserRole(role)}
              />
            )}
          </Stack.Screen>
        ) : userRole === 'patient' ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="ProfessionalDetail" component={ProfessionalDetailScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="PatientAppointments" component={PatientAppointmentsScreen} />
            <Stack.Screen name="PatientNotifications" component={PatientNotificationsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="ProfessionalDashboard" component={ProfessionalDashboardScreen} />
            <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
            <Stack.Screen name="ProfessionalNotifications" component={ProfessionalNotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}