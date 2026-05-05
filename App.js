import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from './firebaseConfig';
import { setupNotificationChannel } from './services/notifications';

// Auth
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Shared
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfessionalDetailScreen from './screens/ProfessionalDetailScreen';
import BookingScreen from './screens/BookingScreen';
import PatientAppointmentsScreen from './screens/PatientAppointmentsScreen';
import PatientNotificationsScreen from './screens/PatientNotificationsScreen';

// Professional
import ProfessionalDashboardScreen from './screens/ProfessionalDashboardScreen';
import ProfessionalProfileScreen from './screens/ProfessionalProfileScreen';
import ProfessionalNotificationsScreen from './screens/ProfessionalNotificationsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(undefined); // 👈 CLAVE
  const [initializing, setInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setupNotificationChannel();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);

      if (authenticatedUser) {
        try {
          const userRef = doc(db, 'users', authenticatedUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            console.log('ROL OBTENIDO:', data.role);

            setUserRole(data.role ?? null); // 👈 fallback correcto
          } else {
            console.log('Usuario sin documento');
            setUserRole(null);
          }
        } catch (error) {
          console.log('Error obteniendo rol:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }

      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // Splash
  if (showSplash) {
    return <SplashScreen />;
  }

  // Loader mientras obtiene auth + rol
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
        
        {/* NO LOGUEADO */}
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : userRole === null ? (
          
          /* SIN ROL */
          <Stack.Screen name="RoleSelection">
              {(props) => (
                <RoleSelectionScreen
                  {...props}
                  onRoleSelected={(role) => setUserRole(role)}
                />
              )}
            </Stack.Screen>
          
        ) : userRole === 'patient' ? (
          
          /* PACIENTE */
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
          
          /* PROFESIONAL */
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