import { View, Text, useWindowDimensions, StyleSheet, FlatList, Pressable, Image, Platform} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Item } from '../../utils/modals/interfaces';
import { UnauthorisedFavourites } from '../components/errorScreens/Unauthorised';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingIndicator from '../../utils/LoadingIndicator';
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../authentication/AuthContext';
import axios from 'axios';
import { BASE_URL } from '../../utils/utils';


const calcNumColumns = (width: number) => {
  const itemWidth = 100; 
  return Math.floor(width / itemWidth);
};

const FavoritesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {width} = useWindowDimensions();
  const [numColumns, setNumColumns] = useState(calcNumColumns(width));
  const [data, setData] = useState<Item[]>([]);
  const [noDataMessage, setNoDataMessage] = useState('');
  const [isUnauthorized, setIsUnauthorized] = useState(false); // state for manage authoritation
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  

  useEffect(() => {
    setNumColumns(calcNumColumns(width));
  }, [width]);

  useEffect(() => {
    fetchFavoritesCallback();
  }, []); 

  Platform.OS == 'web' ? (
    useEffect(() => {
      fetchFavoritesCallback();
    }, [])
  )
  : ( useFocusEffect(
    useCallback(() => {
      fetchFavoritesCallback();
    }, [])
    )
 );

const handleRemoveItem = async (item: Item) => {
  // Remove the item from the data array
  try {
      await axios.delete(`${BASE_URL}/remove/like/${item.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
        },
      },);
  } catch (error) {
      console.error('Error deleting favorite:', error);
  }
};

const handleItemPress = (item : any) => {
  navigation.navigate('Details', {item: item })
};


const fetchFavorites = async () => {
  try {
  const response = await axios.get(`${BASE_URL}/get_likes/${page}`,  {
    headers: {
      'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
    },
  },);
  setPage(prevPage => prevPage + 1)
  return response.data 
  } catch (error) {
    throw error;
  }
};
 


  const fetchFavoritesCallback = useCallback(async () => {

    try {
      const fetchedData = await fetchFavorites(); // recibe los datos procesados
      if (fetchedData.length === 0 && page === 1) {
        setNoDataMessage("No tienes ningún artículo guardado");
      } else if (!(fetchedData.length === 0)) {
        setData(prevData => page==1 ? fetchedData : [...prevData, ...fetchedData]);
        setPage(prevPage => prevPage + 1)
        setNoDataMessage('');
      }
      setIsUnauthorized(false);
    } catch (error) {
      setIsUnauthorized(true);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const handleRemoveItemCallback = useCallback(async (item: Item) => {
    try {
      await handleRemoveItem(item);
      setData(data => data.filter(i => i.id !== item.id));
    } catch (error) {
      console.error('Error deleting favorite:', error);
    }
  }, [handleRemoveItem, data]);


  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={styles.itemBoxStyle}>
      <View>
        <Pressable onPress={() => handleItemPress(item)}>
          <Image source={{uri: item.photos_urls[0]}} style={[styles.imagesView, {minWidth: '30%',  width: (width - (width*0.01))/numColumns}]}/>
        </Pressable>
        <Pressable onPress={() => handleRemoveItemCallback(item)} style={styles.removeIcon}>
          <Icon name="close" size={24} color="black" />
        </Pressable>
      <View style={[styles.textStyle, {maxWidth: width/numColumns}]}>
        <Text numberOfLines={1} style={styles.textStyle}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.textStyle}>{item.price}</Text>
      </View>
      </View>
    </View>
  ), []);

    
  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <LoadingIndicator/>
      ) : (
        <>
        <View style={styles.containerText}>
          <Text style={styles.headerText}>Artículos guardados para movil</Text>
        </View>
        {isUnauthorized ? (
          <UnauthorisedFavourites/>
        ) :
          noDataMessage ? (
            <Text style={styles.noDataText}>{noDataMessage}</Text>
          ) : (
            <FlatList
              getItemLayout={(data, index) => (
                {length: ( Platform.OS == 'web' ? 400: 200), offset: ( Platform.OS == 'web' ? 400: 200) * index, index}
              )}
              style={styles.flatlistStyle}
              data={data}
              renderItem={renderItem}
              numColumns={numColumns}
              key={numColumns}
              keyExtractor={item =>  item.id.toString()}
              onEndReached={() => fetchFavoritesCallback()}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={Platform.OS == 'web' ? true : false }
            />
            
          )}
        </>
      )}
      
    </SafeAreaView>
  );
}

export default FavoritesScreen;



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      zIndex: 0,
      backgroundColor: 'white',
    },
    imagesView: {
      padding: 0.5,
      height: Platform.OS == 'web' ? 400: 200,
      backgroundColor: 'white',
      maxHeight:'100%',
    },
    containerText: {
      backgroundColor: '#f0f0f0', 
      paddingVertical: 20, 
      paddingHorizontal: 16,
      borderBottomWidth: 1, 
      borderBottomColor: '#ddd', 
      alignItems: 'center'
    },
    headerText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    noDataText: {
      padding: 16,
      textAlign: 'center',
      color: '#888',
    },
    flatlistStyle: {
      width: '100%',
      zIndex: 0,
    },
    itemBoxStyle: {
      padding: 0.5,
    },
    textView: {
      padding: 0.5,
      backgroundColor: 'white',
    },
    textStyle: {
      fontSize: 12,
      padding: 10,
      marginLeft: 3,
    },
    removeIcon: {
      position: 'absolute',
      top: 5,
      right: 5,
      zIndex: 1,
      padding: 5,
    },
  });


  