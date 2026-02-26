import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const { name, phone } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submitted Info</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Name</Text>
          <Text style={styles.fieldValue}>{name}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Phone</Text>
          <Text style={styles.fieldValue}>{phone}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
