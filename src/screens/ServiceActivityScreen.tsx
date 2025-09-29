import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
// Removido: import do supabase
import { updateScheduleStatus } from '../services/ordemServicoService';

interface ServiceOrder {
  id: string;
  status: string;
  client?: { name: string };
  created_at: string;
  updated_at: string;
  devices?: any[];
  schedule_id?: string;
  observations?: string;
  location?: string;
  user_id?: string;
}

const ServiceActivityScreen = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Buscar ordens de serviço do localStorage (modo offline)
      const storedOrders = localStorage.getItem('safeprag_service_orders');
      if (storedOrders) {
        const orders = JSON.parse(storedOrders) as ServiceOrder[];
        // Ordenar por data de criação (mais recentes primeiro)
        const sortedOrders = orders.sort((a, b) => 
          new Date(b.created_at || b.createdAt || '').getTime() - 
          new Date(a.created_at || a.createdAt || '').getTime()
        );
        setOrders(sortedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('📱 Erro ao carregar ordens de serviço:', error);
      setOrders([]);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in_progress':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in_progress':
        return 'Em Andamento';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Pendente';
    }
  };

  const handleOrderPress = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    
    setUpdating(true);
    
    try {
      // Atualizar ordem de serviço no localStorage (modo offline)
      const storedOrders = localStorage.getItem('safeprag_service_orders');
      if (storedOrders) {
        const orders = JSON.parse(storedOrders) as ServiceOrder[];
        const orderIndex = orders.findIndex(order => order.id === selectedOrder.id);
        
        if (orderIndex !== -1) {
          orders[orderIndex] = {
            ...orders[orderIndex],
            status: newStatus,
            updated_at: new Date().toISOString(),
            end_time: newStatus === 'completed' ? new Date().toISOString() : null
          };
          
          localStorage.setItem('safeprag_service_orders', JSON.stringify(orders));
          console.log('📱 Status da OS atualizado no modo offline:', newStatus);
        }
      }

      // Se o status for 'completed', atualize também o agendamento usando a mesma função da web
      if (newStatus === 'completed' && selectedOrder.schedule_id) {
        try {
          await updateScheduleStatus(selectedOrder.schedule_id, 'completed');
          console.log('Agendamento atualizado para concluído com sucesso');
        } catch (scheduleError) {
          console.error('Erro ao atualizar agendamento:', scheduleError);
          Alert.alert('Aviso', 'Status da OS atualizado, mas falha ao atualizar o agendamento.');
        }
      }

      setUpdating(false);
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      fetchOrders(); // Atualiza a lista
      Alert.alert('Sucesso', 'Status atualizado com sucesso!');
      
    } catch (error) {
      setUpdating(false);
      Alert.alert('Erro', 'Erro inesperado ao atualizar status');
      console.error('Erro ao atualizar status:', error);
    }
  };

  const showStatusOptions = () => {
    Alert.alert(
      'Atualizar Status',
      'Selecione o novo status:',
      [
        { text: 'Pendente', onPress: () => updateOrderStatus('pending') },
        { text: 'Em Andamento', onPress: () => updateOrderStatus('in_progress') },
        { text: 'Concluída', onPress: () => updateOrderStatus('completed') },
        { text: 'Cancelada', onPress: () => updateOrderStatus('cancelled') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderItem = ({ item }: { item: ServiceOrder }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleOrderPress(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>OS #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.client}>{item.client?.name || 'Cliente não informado'}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString('pt-BR')}</Text>
      <Text style={styles.devices}>Dispositivos: {item.devices?.length || 0}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Atividades de Serviço</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<Text style={{ marginTop: 40, textAlign: 'center' }}>Nenhuma ordem de serviço encontrada.</Text>}
        />
      )}
      {/* Modal de detalhes */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Detalhes da Ordem de Serviço</Text>
              {selectedOrder && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Número:</Text>
                    <Text style={styles.detailValue}>OS #{selectedOrder.id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedOrder.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cliente:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.client?.name || 'Não informado'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data de Criação:</Text>
                    <Text style={styles.detailValue}>{new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data de Atualização:</Text>
                    <Text style={styles.detailValue}>{new Date(selectedOrder.updated_at).toLocaleString('pt-BR')}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dispositivos:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.devices?.length || 0}</Text>
                  </View>
                  {selectedOrder.observations && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Observações:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.observations}</Text>
                    </View>
                  )}
                  {selectedOrder.location && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Localização:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.location}</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={[styles.updateButton, updating && styles.updateButtonDisabled]} 
                    onPress={showStatusOptions}
                    disabled={updating}
                  >
                    <Text style={styles.updateButtonText}>
                      {updating ? 'Atualizando...' : 'Atualizar Status'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  client: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  devices: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailValue: {
    fontSize: 16,
    color: '#555',
    flexShrink: 1,
    textAlign: 'right',
  },
  updateButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ServiceActivityScreen;