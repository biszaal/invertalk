import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invertalk</Text>
      {__DEV__ && (
        <Link href="/dev-audio" style={styles.link}>
          Audio test
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  title: { fontSize: 32, fontWeight: '600' },
  link: { fontSize: 17, color: '#2F5BD3', padding: 12 },
});
