import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function ProfessionalNotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.log('Error cargando notificaciones:', error);
        Alert.alert('Error', 'No pudimos cargar tus notificaciones.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const markAsRead = async (notificationId) => {
    try {
      if (!uid || !notificationId) return;

      await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      console.log('Error marcando notificación como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!uid || notifications.length === 0) return;

      const unreadNotifications = notifications.filter((item) => item.read === false);

      if (unreadNotifications.length === 0) {
        Alert.alert('Listo', 'No tienes notificaciones pendientes.');
        return;
      }

      const batch = writeBatch(db);

      unreadNotifications.forEach((item) => {
        const ref = doc(db, 'users', uid, 'notifications', item.id);
        batch.update(ref, { read: true });
      });

      await batch.commit();
      Alert.alert('Éxito', 'Todas las notificaciones fueron marcadas como leídas.');
    } catch (error) {
      console.log('Error marcando todas como leídas:', error);
      Alert.alert('Error', 'No pudimos marcar todas como leídas.');
    }
  };

  const handleNotificationPress = async (item) => {
    await markAsRead(item.id);

    if (item?.appointmentId) {
      navigation.navigate('ProfessionalDashboard');
    }
  };

  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'Fecha no disponible';

      const date =
        typeof timestamp?.toDate === 'function'
          ? timestamp.toDate()
          : new Date(timestamp);

      return date.toLocaleString('es-CL');
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.card, item.read === false && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={item.read === false ? 'notifications' : 'notifications-outline'}
            size={22}
            color={item.read === false ? '#2563EB' : '#64748B'}
          />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title || 'Notificación'}</Text>
            {item.read === false && <View style={styles.dot} />}
          </View>

          <Text style={styles.message}>
            {item.message || 'Tienes una nueva actualización.'}
          </Text>

          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <Text style={styles.headerSubtitle}>
            Revisa tus avisos más recientes
          </Text>
        </View>

        <TouchableOpacity style={styles.readAllButton} onPress={markAllAsRead}>
          <Text style={styles.readAllText}>Marcar todo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.centerText}>Cargando notificaciones...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="notifications-off-outline" size={54} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
          <Text style={styles.emptyText}>
            Cuando un paciente agende una cita o tengas novedades, aparecerán aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  readAllButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  readAllText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '600',
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '600',
  },
});