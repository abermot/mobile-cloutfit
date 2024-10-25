import React from 'react';
import { View, Text, StyleSheet} from 'react-native';

// Errors screens

export const UnauthorisedAlgorithm = () => (
  <View style={styles.container}>
    <Text style={styles.textStyle}>No tienes acceso a las recomendaciones ☹︎</Text>
    <Text style={styles.textStyle2}>Accede para poder utilizarlas</Text>
  </View>
);

export const UnauthorisedFavourites = () => (
  <View style={styles.container}>
    <Text style={styles.textStyle}>No tienes acceso a los artículo guardados ☹︎</Text>
    <Text style={styles.textStyle2}>Accede para poder verlos</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    zIndex: 0,
    padding: 50,
    paddingTop: 150,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textStyle: {
    fontSize: 20,
    fontFamily: 'Helvetica Neue',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  textStyle2: {
    paddingTop: 20,
    fontSize: 16,
    fontFamily: 'Helvetica Neue',
    textAlign: 'center',
  },
});