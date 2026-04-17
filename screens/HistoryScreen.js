import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'history'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHistory(items);
        setLoading(false);
      },
      (error) => {
        console.log('Error historial:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'view':
        return 'eye-outline';
      case 'contact':
        return 'chatbubble-ellipses-outline';
      case 'booking':
        return 'calendar-outline';
      default:
        return 'time-outline';
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case 'view':
        return 'Perfil visto';
      case 'contact':
        return 'Contacto iniciado';
      case 'booking':
        return 'Reserva realizada';
      default:
        return 'Actividad';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return 'Sin fecha';

    const date = timestamp.toDate();

    return (
      date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
      }) +
      ' · ' +
      date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name={getIcon(item.type)} size={20} color="#2563EB" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title || 'Profesional'}</Text>
        <Text style={styles.subtitle}>{getLabel(item.type)}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10 }}>Cargando historial...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Historial</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* LISTA */}
      {history.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={40} color="#2563EB" />
          <Text style={styles.emptyTitle}>Sin historial</Text>
          <Text style={styles.emptySubtitle}>
            Aquí aparecerán tus acciones dentro de la app
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontWeight: '800',
    fontSize: 15,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
});