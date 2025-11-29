import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
// Removido: import do supabase

const ReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Buscar relatórios existentes
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setReports(data);
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    }
    setLoading(false);
  };

  const generateReport = async (reportType: string) => {
    setModalVisible(false);
    Alert.alert('Gerando Relatório', 'Aguarde enquanto o relatório é gerado...');
    
    try {
      let reportData = {};
      
      switch (reportType) {
        case 'devices':
          const { data: devices } = await supabase.from('devices').select('*');
          reportData = {
            type: 'devices',
            title: 'Relatório de Dispositivos',
            data: devices,
            generated_at: new Date().toISOString()
          };
          break;
          
        case 'activities':
          const { data: activities } = await supabase.from('service_orders').select('*');
          reportData = {
            type: 'activities',
            title: 'Relatório de Atividades',
            data: activities,
            generated_at: new Date().toISOString()
          };
          break;
          
        case 'clients':
          const { data: clients } = await supabase.from('clients').select('*');
          reportData = {
            type: 'clients',
            title: 'Relatório de Clientes',
            data: clients,
            generated_at: new Date().toISOString()
          };
          break;
          
        case 'pests':
          const { data: pests } = await supabase.from('pest_counts').select('*');
          reportData = {
            type: 'pests',
            title: 'Relatório de Pragas',
            data: pests,
            generated_at: new Date().toISOString()
          };
          break;
      }
      
      // Salvar relatório no banco
      const { error } = await supabase.from('reports').insert([reportData]);
      
      if (!error) {
        Alert.alert('Sucesso', 'Relatório gerado com sucesso!');
        fetchReports(); // Atualiza a lista
      } else {
        Alert.alert('Erro', 'Erro ao gerar relatório');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao gerar relatório');
    }
  };

  const handleReportPress = (reportType: string) => {
    setSelectedReport(reportType);
    setModalVisible(true);
  };

  const renderReportCard = (title: string, description: string, icon: string, onPress: () => void) => (
    <TouchableOpacity style={styles.reportCard} onPress={onPress}>
      <Text style={styles.reportIcon}>{icon}</Text>
      <View style={styles.reportContent}>
        <Text style={styles.reportTitle}>{title}</Text>
        <Text style={styles.reportDescription}>{description}</Text>
      </View>
      <Text style={styles.reportArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderRecentReport = (report: any) => (
    <View style={styles.recentReportCard}>
      <View style={styles.recentReportHeader}>
        <Text style={styles.recentReportTitle}>{report.title}</Text>
        <Text style={styles.recentReportDate}>
          {new Date(report.generated_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <Text style={styles.recentReportType}>
        Tipo: {report.type === 'devices' ? 'Dispositivos' : 
               report.type === 'activities' ? 'Atividades' :
               report.type === 'clients' ? 'Clientes' : 'Pragas'}
      </Text>
      <TouchableOpacity style={styles.downloadButton}>
        <Text style={styles.downloadButtonText}>Baixar PDF</Text>
      </TouchableOpacity>
    </View>
  );

  const renderModalContent = () => {
    const reportTypes = {
      devices: {
        title: 'Relatório de Dispositivos',
        description: 'Gera relatório com todos os dispositivos cadastrados, incluindo status e localização.',
        icon: '📱'
      },
      activities: {
        title: 'Relatório de Atividades',
        description: 'Relatório detalhado de todas as atividades e ordens de serviço realizadas.',
        icon: '📋'
      },
      clients: {
        title: 'Relatório de Clientes',
        description: 'Lista completa de clientes cadastrados com informações de contato.',
        icon: '👥'
      },
      pests: {
        title: 'Relatório de Pragas',
        description: 'Estatísticas de pragas encontradas e contagens realizadas.',
        icon: '🦗'
      }
    };

    const selected = reportTypes[selectedReport as keyof typeof reportTypes];
    
    if (!selected) return null;

    return (
      <View>
        <Text style={styles.modalTitle}>{selected.title}</Text>
        <Text style={styles.modalIcon}>{selected.icon}</Text>
        <Text style={styles.modalDescription}>{selected.description}</Text>
        
        <View style={styles.modalOptions}>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => generateReport(selectedReport)}
          >
            <Text style={styles.modalButtonText}>Gerar Relatório</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalButtonSecondary}>
            <Text style={styles.modalButtonSecondaryText}>Configurar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
      <Text style={styles.header}>Relatórios</Text>
      
      {/* Tipos de Relatórios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerar Novo Relatório</Text>
        
        {renderReportCard(
          'Dispositivos',
          'Relatório de dispositivos cadastrados',
          '📱',
          () => handleReportPress('devices')
        )}
        
        {renderReportCard(
          'Atividades',
          'Relatório de atividades realizadas',
          '📋',
          () => handleReportPress('activities')
        )}
        
        {renderReportCard(
          'Clientes',
          'Relatório de clientes cadastrados',
          '👥',
          () => handleReportPress('clients')
        )}
        
        {renderReportCard(
          'Pragas',
          'Relatório de pragas encontradas',
          '🦗',
          () => handleReportPress('pests')
        )}
      </View>

      {/* Relatórios Recentes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relatórios Recentes</Text>
        
        {reports.length > 0 ? (
          reports.slice(0, 5).map((report, index) => (
            <View key={index}>
              {renderRecentReport(report)}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateText}>Nenhum relatório gerado ainda</Text>
            <Text style={styles.emptyStateSubtext}>
              Gere seu primeiro relatório usando as opções acima
            </Text>
          </View>
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
                <Text style={styles.closeButtonText}>Cancelar</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  reportIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  reportArrow: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
  },
  recentReportCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  recentReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentReportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  recentReportDate: {
    fontSize: 14,
    color: '#64748b',
  },
  recentReportType: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  downloadButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 16,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  modalIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 24,
    textAlign: 'center',
  },
  modalOptions: {
    gap: 12,
  },
  modalButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#64748b',
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

export default ReportsScreen; 