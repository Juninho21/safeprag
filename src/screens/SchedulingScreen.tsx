import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Button, Platform } from 'react-native';
// Removido: import do supabase

const SchedulingScreen = () => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', client_name: '', status: 'Pendente' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('schedules').select('*').order('date', { ascending: false });
    if (!error && data) {
      setSchedules(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.date || !form.client_name) return;
    setSaving(true);
    
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('schedules').insert([{ 
        ...form,
        status: 'pending', // Usar o status correto do banco
        created_at: now,
        updated_at: now
      }]);
      
      if (error) {
        console.error('Erro ao salvar agendamento:', error);
        // Aqui você poderia mostrar um Alert com o erro
        return;
      }
      
      setModalVisible(false);
      setForm({ title: '', date: '', client_name: '', status: 'Pendente' });
      fetchSchedules();
    } catch (error) {
      console.error('Erro inesperado ao salvar agendamento:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.title}>{item.title || 'Agendamento'}</Text>
      <Text style={styles.date}>{new Date(item.date).toLocaleString('pt-BR')}</Text>
      <Text style={styles.client}>{item.client_name || 'Cliente não informado'}</Text>
      <Text style={styles.status}>Status: {item.status || 'Pendente'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agendamentos</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<Text style={{ marginTop: 40, textAlign: 'center' }}>Nenhum agendamento encontrado.</Text>}
        />
      )}
      {/* Botão flutuante */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      {/* Modal de novo agendamento */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Agendamento</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Data (YYYY-MM-DDTHH:mm)"
              value={form.date}
              onChangeText={(text) => setForm({ ...form, date: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Cliente"
              value={form.client_name}
              onChangeText={(text) => setForm({ ...form, client_name: text })}
            />
            <Button title={saving ? 'Salvando...' : 'Salvar'} onPress={handleSave} disabled={saving} />
            <Button title="Cancelar" color="#888" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  client: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 10,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2563eb',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
});

export default SchedulingScreen; 