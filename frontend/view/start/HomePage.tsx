import { StyleSheet, View, Text, Image} from 'react-native';
import * as React from 'react';


export default function HomePage() {
    return (
        <View style={styles.container}>
            <View style={styles.messageContainer}>
                <Text style={styles.message}>Descubre miles de productos y recibe recomendaciones a tu estilo</Text>
            </View>
            <Text style={styles.sectionTitle}>Marcas y Tiendas</Text>
            <View style={styles.iconContainer}>
                <View style={styles.iconWrapper}>
                    <Image source={require('../../assets/brand-images/mango_logo.png')} style={styles.icon} />
                </View>
                <View style={styles.iconWrapper}>
                    <Image source={require('../../assets/brand-images/zara_logo.png')} style={styles.icon} />
                </View>
            </View>
        </View>
    );
}
    
const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 20,
    },
    messageContainer: {
      backgroundColor: '#f8f9fa',
      padding: 20,
      borderRadius: 10,
      marginBottom: 20,
      width: '50%',
      alignItems: 'center',
    },
    message: {
      fontSize: 18,
      textAlign: 'center',
      color: '#333',
    },
    sectionTitle: {
      fontSize: 22,
      color: '#333',
      marginVertical: 10,
      padding: 30,
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    iconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: 'gray',
        marginHorizontal: 10,
    },
    icon: {
      width: 80,
      height: 80,
      resizeMode: 'contain',
    },
  });
  