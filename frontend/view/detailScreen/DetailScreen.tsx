import { View, FlatList, Image, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextDetail from './TextDetail'
import React, { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Item } from '../../utils/modals/interfaces';
import { BASE_URL } from '../../utils/utils';
import axios from 'axios';
import { useAuth } from '../authentication/AuthContext';



export default function DetailScreenMobile() {
  const { token } = useAuth();
  const { params } = useRoute();
  const { item } = params as { item: Item };
  const navigation = useNavigation(); 
  const [isLiked, setIsLiked] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = React.useState(false); // state for manage authoritation
  const [iconName, setIconName] = React.useState(''); // state for manage authoritation



  const renderPhotos = ({item}:any) => {
    return (
      <View style={styles.containerLeft}>
        <Image source={{uri: item}} style={{width: '100%', height: 350}} resizeMode="cover"/>
      </View>
    );
  }

  useEffect(() => {
    const checkIsLike = async (item: Item) => {
      try {
        let response = await axios.get(`${BASE_URL}/details/isliked/${item.id}`,  {
          headers: {
              'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
          },
        },);
        if (response.status === 200) {
          setIsUnauthorized(false);
          setIsLiked(response.data);
        } else {
          setIsUnauthorized(true);
        }
      } catch (error: any) {
        setIsUnauthorized(true);
      }
    };
    checkIsLike(item);
  }, [item]);

  useEffect(() => {
    setIconName(isLiked ? 'heart' : 'heart-outline');
  }, [isLiked]);

  const handlePress = async () => {
    if (isLiked) {
      // Eliminar de favoritos
      try {
        await axios.delete(`${BASE_URL}/remove/like/${item.id}`, {
          headers: {
              'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
          },
          },);
        setIsLiked(false);
      } catch (error) {
        console.error('Error deleting favorite:', error);
      }
    } else {
      // Guardar en favoritos
      try {
        console.log(item.id)
        await axios.post(`${BASE_URL}/save/like/${item.id}`,  {item: item}, {
          headers: {
              'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
          },
          },);
        setIsLiked(true);
      } catch (error) {

        console.log('Error aqui: ' + error);
      }
    }
  };
  

  return (
    <View style = {{flex:1, flexDirection: 'column', backgroundColor: 'white'}}>
      <SafeAreaView>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="close" size={30} color="black" />
        </Pressable>
      </SafeAreaView>
      <FlatList
        style={{paddingEnd:1, paddingTop:'2%',}}
        data={item.photos_urls} 
        renderItem={renderPhotos}
        numColumns={2} 
        keyExtractor={(item, index) => index.toString()} 
        ListFooterComponent={<TextDetail item = {item}/>}
      />
      <View style={styles.smallContainer}>
          {!isUnauthorized ? (
            <Pressable onPress={() => handlePress()}>
              <Icon name={iconName} size={24} color="black" />
            </Pressable>
          ) : null}
          <View style={{flexDirection:'column'}}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.price}>{item.price}</Text>
          </View>
          
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: 'white',
  },
  containerLeft: {
    padding: 1,
    backgroundColor: 'white',
    flex: 3,
  },
  containerRight: {
    padding:20,
    backgroundColor: 'white',
    flex:1,
  },
  textStyle: {
    padding:20,
    color: 'black',
  },
  smallContainer: {
    padding:15,
    flexDirection: 'row'
  },
  title: {
    paddingStart: 20,
    fontSize: 15,
    marginVertical: 8,
  },
  price: {
    paddingStart: 20,
    fontSize: 16,
    marginVertical: 4,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    padding: 5,
    zIndex: 1,
    paddingTop:'10%',
  },
});

