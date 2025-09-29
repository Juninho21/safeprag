import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
// Removido: import do supabase

const DEVICE_TYPES = [
  'Armadilha',
  'Ponto de Isca',
  'Luminosa',
  'Outros',
];

const STATUS_TYPES = [
  'Conforme',
  'Sem Dispositivo',
  'Dispositivo danificado',
  'Consumida',
  'Sem acesso',
  'Desarmada',
  'Desligada',
  'Praga encontrada',
  'Não definido',
];

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pests, setPests] = useState<number>(0);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [devicesRes, clientsRes, ordersRes] = await Promise.all([
        supabase.from('devices').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('service_orders').select('*'),
      ]);
      if (!devicesRes.error && devicesRes.data) {
        setDevices(devicesRes.data);
        prepareChartData(devicesRes.data);
        // Contar pragas encontradas
        const pestCount = devicesRes.data.filter((d: any) => (d.status || '') === 'Praga encontrada').length;
        setPests(pestCount);
      }
      if (!clientsRes.error && clientsRes.data) setClients(clientsRes.data);
      if (!ordersRes.error && ordersRes.data) setOrders(ordersRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const prepareChartData = (devices: any[]) => {
    // Para cada tipo de dispositivo, conta por status
    const datasets = DEVICE_TYPES.map((deviceType) => {
      const devicesByType = devices.filter((d) => d.type === deviceType);
      const statusCounts = STATUS_TYPES.map(
        (status) => devicesByType.filter((d) => (d.status || 'Não definido') === status).length
      );
      return {
        data: statusCounts,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        label: deviceType,
      };
    });

    setChartData({
      labels: STATUS_TYPES,
      datasets,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dispositivos</Text>
          <Text style={styles.cardValue}>{devices.length}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clientes</Text>
          <Text style={styles.cardValue}>{clients.length}</Text>
        </View>
      </View>
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ordens de Serviço</Text>
          <Text style={styles.cardValue}>{orders.length}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pragas Encontradas</Text>
          <Text style={styles.cardValue}>{pests}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Distribuição de dispositivos por status</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : chartData ? (
        <BarChart
          data={{
            labels: chartData.labels,
            datasets: chartData.datasets.map((ds: any) => ({ data: ds.data }))
          }}
          width={Dimensions.get('window').width - 32}
          height={320}
          yAxisLabel=""
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})` ,
            style: { borderRadius: 16 },
            propsForDots: { r: '6', strokeWidth: '2', stroke: '#2563eb' },
          }}
          verticalLabelRotation={30}
          fromZero
          showBarTops
          showValuesOnTopOfBars
          style={{ marginVertical: 16, borderRadius: 16 }}
        />
      ) : (
        <Text style={{ marginTop: 40 }}>Nenhum dado encontrado.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2563eb',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default DashboardScreen; 