import React from 'react';
import { View, StyleSheet, Text, Pressable, Linking } from 'react-native';

export default function TextDetail({item}:any) {
  const [linkColor, setLinkColor] = React.useState('black');

    return (
        <View style={styles.containerRight}>
        <Text style={styles.attribute}>Color: </Text>
        <Text style={styles.attribute}>{item.colour}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Pressable
            onPress={async () => {
              const supported = await Linking.canOpenURL(item.page_link);
              if (supported) {
                await Linking.openURL(item.page_link);
              } else {
                console.log(`Unable to open URL: ${item.page_link}`);
              }
            }}
            onHoverIn={() => setLinkColor('gray')}
            onHoverOut={() => setLinkColor('black')}
            style = {{alignItems:'center', justifyContent:'center'}}
          >
          <Text style={[styles.linkText, { color: linkColor }]}>Link al producto</Text>
        </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    containerRight: {
      padding:20,
      backgroundColor: 'white',
      flex:1,
    },
    linkText: {
      paddingTop: 50,
      fontSize: 16,
      fontWeight: 'bold',
      textDecorationLine: 'underline',
    },
    textStyle: {
      padding:20,
      color: 'black',
    },
    description: {
      fontSize: 14,
      color: '#333',
      marginVertical: 4,
    },
    attribute: {
      fontSize: 14,
      color: '#666',
      marginVertical: 2,
    },
  });
  
  