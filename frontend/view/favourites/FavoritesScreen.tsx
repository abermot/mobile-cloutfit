import { View, Text, useWindowDimensions, StyleSheet, FlatList, Pressable, Image, Platform} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Item } from '../../utils/modals/interfaces';
import { UnauthorisedFavourites } from '../components/errorScreens/Unauthorised';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingIndicator from '../../utils/LoadingIndicator';
import { useAuth } from '../authentication/AuthContext';
import axios from 'axios';
import { BASE_URL } from '../../utils/utils';


const calcNumColumns = (width: number) => {
  const itemWidth = 0.33333 * width; 
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
  
  // update screen
  useEffect(() => {
    setNumColumns(calcNumColumns(width));
  }, [width]);

  // loading items
  useEffect(() => {
    fetchFavoritesCallback();
  }, []); 

  const handleItemPress = (item : any) => {
    navigation.navigate('Details', {item: item })
  };

  const fetchFavoritesCallback = useCallback(async () => {
    try {
      const fetchedData = await fetchFavorites(page, token, setPage); // receives the processed data
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
      await handleRemoveItem(item, token);
      setData(data => data.filter(i => i.id !== item.id));
    } catch (error) {
      console.error('Error deleting favorite:', error);
      throw error;
    }
  }, [handleRemoveItem, data]);


  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={styles.itemBoxStyle}>
      <View>
        <Pressable onPress={() => handleItemPress(item)}>
          <Image source={{uri: item.photos_urls[0]}} style={styles.imagesView} resizeMode='cover'/>
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
    <View style={styles.container}>
      {isLoading ? (
        <LoadingIndicator/>
      ) : (
        <>
        <View style={styles.containerText}>
          <Text style={styles.headerText}>Artículos guardados</Text>
        </View>
        {isUnauthorized ? (
          <UnauthorisedFavourites/>
        ) :
          noDataMessage ? (
            <Text style={styles.noDataText}>{noDataMessage}</Text>
          ) : (
            <FlatList
              getItemLayout={(data, index) => (
                {length: 200, offset: 200 * index, index}
              )}
              style={styles.flatlistStyle}
              data={data}
              renderItem={renderItem}
              numColumns={numColumns}
              key={numColumns}
              keyExtractor={item =>  item.id.toString()}
              onEndReached={() => fetchFavoritesCallback()}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={false}
            />
            
          )}
        </>
      )}
    </View>
  );
}

export default FavoritesScreen;


// -- API petitions --

const fetchFavorites = async (page: number, token: string, setPage: any) => {
  try {
    const response = await axios.get(`${BASE_URL}/get_likes/${page}`,  {
      headers: {
        'Authorization': `Bearer ${token}`, // get the context token
      },
    },);
    setPage((prevPage: number) => prevPage + 1)
    return response.data 
  } catch (error) {
    //console.error('Error fetching favorites:', error);
    throw error;
  }
};

const handleRemoveItem = async (item: Item, token: string) => {
  // remove the item from the data
  try {
    await axios.delete(`${BASE_URL}/remove/like/${item.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`, // get the context token
      },
    },);
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw error;
  }
};


// -- Style --

const styles = StyleSheet.create({
  container: {
    paddingTop:'15%',
    flex: 1,
    backgroundColor: 'white',
  },
  imagesView: {
    width: '100%',
    minWidth:'33.333%',
    height: 205,
    backgroundColor: 'white',
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
    //borderRightWidth:0.8,
    borderRightColor:'white',
  },
  textStyle: {
    fontSize: 12,
    padding: 5,
    marginLeft: 1,
  },
  removeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 1,
    padding: 5,
  },
});


  