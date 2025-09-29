import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
// Removido: import do supabaseDataService

const PestControlScreen = () => {
  const [loading, setLoading] = useState(true);
  const [pestCounts, setPestCounts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPest, setSelectedPest] = useState<any>(null);
  const [newCount, setNewCount] = useState('');
  const [selectedPestType, setSelectedPestType] = useState('');

  useEffect(() => {
    fetchPestCounts();
  }, []);

  const fetchPestCounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pest_counts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPestCounts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar contagens de pragas:', error);
    }
    setLoading(false);
  };

  const addPestCount = async () => {
    if (!newCount || !selectedPestType) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      const pestData = {
        pest_type: selectedPestType,
        count: parseInt(newCount),
        location: 'Local padrão',
        notes: `Contagem de ${selectedPestType}`,
        created_at: new Date().toISOString()
      };

      await savePestCount(pestData);
      Alert.alert('Sucesso', 'Contagem adicionada com sucesso!');
      setModalVisible(false);
      setNewCount('');
      setSelectedPestType('');
      fetchPestCounts();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar contagem');
    }
  };

  const getPestIcon = (pestType: string) => {
    switch (pestType.toLowerCase()) {
      case 'barata':
        return '🦗';
      case 'rato':
        return '🐀';
      case 'formiga':
        return '🐜';
      case 'mosca':
        return '🪰';
      case 'aranha':
        return '🕷️';
      default:
        return '🦗';
    }
  };

  const getPestColor = (pestType: string) => {
    switch (pestType.toLowerCase()) {
      case 'barata':
        return '#8b5cf6';
      case 'rato':
        return '#6b7280';
      case 'formiga':
        return '#f59e0b';
      case 'mosca':
        return '#10b981';
      case 'aranha':
        return '#ef4444';
      default:
        return '#2563eb';
    }
  };

  const renderPestCard = (pest: any) => (
    <View style={styles.pestCard}>
      <View style={styles.pestHeader}>
        <Text style={styles.pestIcon}>{getPestIcon(pest.pest_type)}</Text>
        <View style={styles.pestInfo}>
          <Text style={styles.pestType}>{pest.pest_type}</Text>
          <Text style={styles.pestCount}>Quantidade: {pest.count}</Text>
        </View>
        <View style={[styles.pestBadge, { backgroundColor: getPestColor(pest.pest_type) }]}>
          <Text style={styles.pestBadgeText}>{pest.count}</Text>
        </View>
      </View>
      <Text style={styles.pestLocation}>Local: {pest.location}</Text>
      <Text style={styles.pestDate}>
        {new Date(pest.created_at).toLocaleDateString('pt-BR')}
      </Text>
      {pest.notes && (
        <Text style={styles.pestNotes}>Observações: {pest.notes}</Text>
      )}
    </View>
  );

  const renderStatsCard = (title: string, value: number, color: string, icon: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <Text style={styles.statsIcon}>{icon}</Text>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  const calculateStats = () => {
    const totalPests = pestCounts.reduce((sum, pest) => sum + pest.count, 0);
    const uniqueTypes = new Set(pestCounts.map(pest => pest.pest_type)).size;
    const todayCounts = pestCounts.filter(pest => {
      const today = new Date().toDateString();
      const pestDate = new Date(pest.created_at).toDateString();
      return today === pestDate;
    });
    const todayTotal = todayCounts.reduce((sum, pest) => sum + pest.count, 0);

    return {
      totalPests,
      uniqueTypes,
      todayTotal,
      totalCounts: pestCounts.length
    };
  };

  const stats = calculateStats();

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
      <Text style={styles.header}>Controle de Pragas</Text>
      
      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Estatísticas</Text>
        <View style={styles.statsGrid}>
          {renderStatsCard('Total de Pragas', stats.totalPests, '#ef4444', '🦗')}
          {renderStatsCard('Tipos Únicos', stats.uniqueTypes, '#8b5cf6', '📊')}
          {renderStatsCard('Hoje', stats.todayTotal, '#10b981', '📅')}
          {renderStatsCard('Contagens', stats.totalCounts, '#f59e0b', '📋')}
        </View>
      </View>

      {/* Botão Adicionar */}
      <View style={styles.addSection}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>➕ Adicionar Contagem</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Contagens */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Histórico de Contagens</Text>
        
        {pestCounts.length > 0 ? (
          pestCounts.map((pest, index) => (
            <View key={index}>
              {renderPestCard(pest)}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🦗</Text>
            <Text style={styles.emptyStateText}>Nenhuma contagem registrada</Text>
            <Text style={styles.emptyStateSubtext}>
              Adicione sua primeira contagem de pragas
            </Text>
          </View>
        )}
      </View>

      {/* Modal Adicionar Contagem */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Contagem de Pragas</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Praga</Text>
              <View style={styles.pestTypeButtons}>
                {['Barata', 'Rato', 'Formiga', 'Mosca', 'Aranha'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pestTypeButton,
                      selectedPestType === type && styles.pestTypeButtonSelected
                    ]}
                    onPress={() => setSelectedPestType(type)}
                  >
                    <Text style={[
                      styles.pestTypeButtonText,
                      selectedPestType === type && styles.pestTypeButtonTextSelected
                    ]}>
                      {getPestIcon(type)} {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantidade</Text>
              <TextInput
                style={styles.input}
                value={newCount}
                onChangeText={setNewCount}
                placeholder="Digite a quantidade"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={addPestCount}
              >
                <Text style={styles.modalButtonText}>Adicionar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewCount('');
                  setSelectedPestType('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
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
  sectionTitle: {
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
  addSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSection: {
    marginBottom: 24,
  },
  pestCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  pestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pestIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pestInfo: {
    flex: 1,
  },
  pestType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  pestCount: {
    fontSize: 14,
    color: '#64748b',
  },
  pestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pestBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pestLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  pestDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  pestNotes: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  pestTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pestTypeButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pestTypeButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pestTypeButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  pestTypeButtonTextSelected: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#64748b',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PestControlScreen;