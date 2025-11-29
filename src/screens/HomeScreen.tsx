import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
// Removido: import do supabase

const HomeScreen = ({ navigation }: any) => {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Sulpest Mobile!</Text>
      <Text style={styles.subtitle}>Aplicativo de Controle de Pragas</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Sair" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default HomeScreen; 