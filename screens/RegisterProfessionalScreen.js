import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function RegisterProfessionalScreen({ navigation }) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const handleRegister = async () => {
    if (!name || !specialty || !latitude || !longitude) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    try {
      await addDoc(collection(db, 'professionals'), {
        name,
        specialty,
        description,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Éxito", "Profesional registrado correctamente");
      navigation.goBack();

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo registrar");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrarte como profesional</Text>

      <TextInput placeholder="Nombre" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Especialidad" value={specialty} onChangeText={setSpecialty} style={styles.input} />
      <TextInput placeholder="Descripción" value={description} onChangeText={setDescription} style={styles.input} />

      <TextInput
        placeholder="Latitud"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Longitud"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});