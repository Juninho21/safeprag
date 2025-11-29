import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
// Removido: import do supabase

const AdminScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalDevices: 0,
    totalOrders: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Buscar estatísticas
      const [usersResult, companiesResult, devicesResult, ordersResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('companies').select('id', { count: 'exact' }),
        supabase.from('devices').select('id', { count: 'exact' }),
        supabase.from('service_orders').select('id', { count: 'exact' })
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalCompanies: companiesResult.count || 0,
        totalDevices: devicesResult.count || 0,
        totalOrders: ordersResult.count || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
    setLoading(false);
  };

  const handleSectionPress = (section: string) => {
    setSelectedSection(section);
    setModalVisible(true);
  };

  const renderStatsCard = (title: string, value: number, color: string, icon: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <Text style={styles.statsIcon}>{icon}</Text>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  const renderAdminSection = (title: string, description: string, icon: string, onPress: () => void) => (
    <TouchableOpacity style={styles.adminSection} onPress={onPress}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <View style={styles.sectionContent}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
      <Text style={styles.sectionArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderModalContent = () => {
    switch (selectedSection) {
      case 'users':
        return (
          <View>
            <Text style={styles.modalTitle}>Gerenciar Usuários</Text>
            <Text style={styles.modalDescription}>
              Aqui você pode visualizar, adicionar, editar e remover usuários do sistema.
            </Text>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Ver Todos os Usuários</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Adicionar Novo Usuário</Text>
            </TouchableOpacity>
          </View>
        );
      case 'companies':
        return (
          <View>
            <Text style={styles.modalTitle}>Gerenciar Empresas</Text>
            <Text style={styles.modalDescription}>
              Gerencie as empresas cadastradas no sistema e suas configurações.
            </Text>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Ver Todas as Empresas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Adicionar Nova Empresa</Text>
            </TouchableOpacity>
          </View>
        );
      case 'devices':
        return (
          <View>
            <Text style={styles.modalTitle}>Gerenciar Dispositivos</Text>
            <Text style={styles.modalDescription}>
              Visualize e gerencie todos os dispositivos do sistema.
            </Text>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Ver Todos os Dispositivos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Adicionar Dispositivo</Text>
            </TouchableOpacity>
          </View>
        );
      case 'backup':
        return (
          <View>
            <Text style={styles.modalTitle}>Backup e Restauração</Text>
            <Text style={styles.modalDescription}>
              Gerencie backups do sistema e restaure dados quando necessário.
            </Text>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Criar Backup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Restaurar Backup</Text>
            </TouchableOpacity>
          </View>
        );
      case 'settings':
        return (
          <View>
            <Text style={styles.modalTitle}>Configurações do Sistema</Text>
            <Text style={styles.modalDescription}>
              Configure parâmetros gerais do sistema e notificações.
            </Text>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Configurações Gerais</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Notificações</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Administração</Text>
      
      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionHeader}>Estatísticas do Sistema</Text>
        <View style={styles.statsGrid}>
          {renderStatsCard('Usuários', stats.totalUsers, '#2563eb', '👥')}
          {renderStatsCard('Empresas', stats.totalCompanies, '#10b981', '🏢')}
          {renderStatsCard('Dispositivos', stats.totalDevices, '#f59e0b', '📱')}
          {renderStatsCard('Ordens', stats.totalOrders, '#ef4444', '📋')}
        </View>
      </View>

      {/* Seções Administrativas */}
      <View style={styles.adminContainer}>
        <Text style={styles.sectionHeader}>Gerenciamento</Text>
        
        {renderAdminSection(
          'Usuários',
          'Gerenciar usuários do sistema',
          '👤',
          () => handleSectionPress('users')
        )}
        
        {renderAdminSection(
          'Empresas',
          'Gerenciar empresas cadastradas',
          '🏢',
          () => handleSectionPress('companies')
        )}
        
        {renderAdminSection(
          'Dispositivos',
          'Gerenciar dispositivos do sistema',
          '📱',
          () => handleSectionPress('devices')
        )}
        
        {renderAdminSection(
          'Backup e Restauração',
          'Gerenciar backups do sistema',
          '💾',
          () => handleSectionPress('backup')
        )}
        
        {renderAdminSection(
          'Configurações',
          'Configurações do sistema',
          '⚙️',
          () => handleSectionPress('settings')
        )}
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderModalContent()}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginVertical: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderLeftWidth: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statsIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  adminContainer: {
    marginBottom: 24,
  },
  adminSection: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  sectionArrow: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
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
    maxHeight: '80%',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#64748b',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminScreen; 