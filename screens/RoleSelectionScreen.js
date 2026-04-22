import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function RoleSelectionScreen({ navigation }) {
  const [loadingRole, setLoadingRole] = useState(null);

  const handleSelectRole = async (role) => {
    if (loadingRole) return;

    const user = auth.currentUser;
    if (!user) return;

    setLoadingRole(role);

    const uid = user.uid;

    try {
      // Guardar rol principal
      await setDoc(doc(db, 'users', uid), {
        role,
        email: user.email,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Redirección limpia
      navigation.reset({
        index: 0,
        routes: [
          { name: role === 'patient' ? 'Home' : 'ProfessionalDashboard' }
        ],
      });

    } catch (error) {
      console.log('Error guardando rol:', error);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>¿Cómo quieres usar MedApp?</Text>

      <TouchableOpacity style={styles.card} onPress={() => handleSelectRole('patient')}>
        <Text style={styles.text}>🩺 Soy paciente</Text>
        {loadingRole === 'patient' && <ActivityIndicator />}
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => handleSelectRole('professional')}>
        <Text style={styles.text}>👩‍⚕️ Soy profesional</Text>
        {loadingRole === 'professional' && <ActivityIndicator />}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center' },
  title: { fontSize:22, marginBottom:30 },
  card: {
    backgroundColor:'#2563EB',
    padding:20,
    borderRadius:12,
    marginBottom:15,
    width:'80%',
    alignItems:'center'
  },
  text: { color:'#fff', fontSize:16 }
});