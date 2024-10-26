import { View, Text, useWindowDimensions, StyleSheet, FlatList, Pressable, Image, Platform} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Item, Recommendations } from '../../utils/modals/interfaces';
import { UnauthorisedAlgorithm } from '../components/errorScreens/Unauthorised';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingIndicator from '../../utils/LoadingIndicator';
import ModalInicial from './modal/ModalInicial';
import ModalRefinar from './modal/ModalRefinar';
import axios from 'axios';
import { BASE_URL } from '../../utils/utils';
import { useAuth } from '../authentication/AuthContext';


const calcNumColumns = (width: number) => {
  const itemWidth = 100; 
  return Math.floor(width / itemWidth);
};

export const ForYouScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {width} = useWindowDimensions();
  const [numColumns, setNumColumns] = useState(calcNumColumns(width));
  const [isModal, setModal] = useState(false);
  const [isInitialModal, setInitialModal] = useState(false);
  const [gender, setGender] = useState('');
  const [items, setItems] = useState('');
  const [history, setHistory] = useState<Item[]>([]);
  const [noDataMessage, setNoDataMessage] = useState('');
  const [loadingAlg, setLoadingAlg] = useState(false);
  const { token } = useAuth();
  const [isUnauthorized, setIsUnauthorized] = useState(false); // state for manage authoritation
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // update screen
  useEffect(() => {
    setNumColumns(calcNumColumns(width));
  }, [width]);

  // loading items
  useEffect(() => {
    fetchHistoryCallback();
  }, []); 

  
  const handleOnPress = (item: Item) => {
    navigation.navigate('Details', {item: item })  
    // navigate to the detail page
  };

  const handleNavigation = (gender: string, items : string) => {
    navigation.navigate('Recommendation', {gender: gender, items: items }) 
    // navigates to the page that allows the user to indicate their preferences
  };

  const handleFinish = async (recommendations: Recommendations[]) => {
    navigation.navigate('ShowRecommendations', {recommendations: recommendations}) 
    // when the algorithm finishes, a new screen with the new recommendations will be displayed 
  };
 

  const handlePreferences = () => { 
    // this will open the modal to allow the user to tag the images
    setModal(true);
  };

  const handleRecommendation = async () => {
    // check if the user has tagged clothes or not
    const is_not_user_tagged = await hasUserTaggedClothing(token); 
    if (is_not_user_tagged) {
      setInitialModal(true)
    } else {
      const fetchRecs = async () => {
        setIsLoading(true); 
        setLoadingAlg(true);
        try {
          const response = await run_algorithm(token);
          if(response) {
            if (response.status === 200) {
              let data =  response.data;
              handleFinish(data)
            } else {
              setIsUnauthorized(true)
            }
          }
        } catch (error) {
          console.error('Error handling recommendations:', error);
          throw error
        } finally {
          setLoadingAlg(false);
          setIsLoading(false); // stop algorithm
        }
      };
      fetchRecs();
    }
  };

  const handleStart = () => {  
    // the images are loaded so that the user can indicate their preferences about them
    setModal(false);
    handleNavigation(gender, items)
  };

  const handleStartInitialModal = () => {  
    // the images are loaded so that the user can indicate their preferences about them
    setInitialModal(false);
    handleNavigation(gender, items)
  };


  const deleteRecommendation = async (id: number) => {
    try {
      handleDeleteRec(id, token);
      setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting recommendation:', error);
    }
  };

  const fetchHistoryCallback = useCallback(async () => {
    try {
      const fetchedData = await handleFetchHistory(page, token); 
      if (fetchedData.length === 0 && page === 1) {
        setNoDataMessage("No tienes ningún artículo guardado");
      } else if (!(fetchedData.length === 0)) {
        setHistory(prevData => page==1 ? fetchedData : [...prevData, ...fetchedData]);
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


  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={styles.itemBoxStyle}>
      <View>
        <Pressable onPress={() => handleOnPress(item)}>
          <Image source={{uri: item.photos_urls[0]}} style={[styles.imagesView, {minWidth: '30%', width: (width - (width*0.01))/numColumns}]}/>
        </Pressable>
        <Pressable onPress={() => deleteRecommendation(item.id)} style={styles.removeIcon}>
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
        loadingAlg ? (
          <View style={{alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: 'white'}}>
            <Text style={{fontSize: 20, fontFamily: 'Helvetica Neue', textAlign: 'center', fontWeight: 'bold'}}>
              Se están preparando las recomendaciones...
            </Text>
            <LoadingIndicator />
          </View>
        ) : (
          <LoadingIndicator />
        )
      ) : (
        isUnauthorized ? (
          <UnauthorisedAlgorithm />
        ) : (
          <>
            <Text style={styles.descriptionText}>
              Cuanta más información tengamos de ti, más precisas serán las recomendaciones
            </Text>
            <View style={styles.secondContainer}>
              <View style={styles.actionButtonsContainer}>
                <Pressable style={styles.primaryButton} onPress={handleRecommendation}>
                  <Text style={styles.primaryButtonText}>Crear recomendación</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={handlePreferences}>
                  <Text style={styles.primaryButtonText}>Refinar recomendación</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.historyTitle}>Historial de recomendaciones</Text>
            {noDataMessage ? (
              <Text style={styles.noHistoryText}>{noDataMessage}</Text>
            ) : (
              <FlatList
                style={styles.flatListStyle}
                data={history}
                renderItem={renderItem}
                numColumns={numColumns}
                key={numColumns}
                keyExtractor={item => `${item.id}_${item.name}`}
                onEndReached={() => fetchHistoryCallback()}
                onEndReachedThreshold={0.5}
                maxToRenderPerBatch={4}
                extraData={history} 
              />
            )}
            {isInitialModal ? (
              <ModalInicial
                isVisible={isInitialModal}
                onClose={() => setInitialModal(false)}
                gender={gender}
                setGender={setGender}
                items={items}
                setItems={setItems} 
                onStart={handleStartInitialModal}
              />
            ) : null}

            {isModal ? (
              <ModalRefinar
                isVisible={isModal}
                onClose={() => setModal(false)}
                gender={gender}
                setGender={setGender}
                items={items}
                setItems={setItems} 
                onStart={handleStart}
              />
            ) : null}
          </>
        )
      )}
    </SafeAreaView>
  );
  
};

export default ForYouScreen;


// -- API petitions --

// Get history of recommendations for the current user 
const handleFetchHistory = async (page: number, token: string) => {
  try {
    console.log(`${BASE_URL}/history/recommendations/${page}`)
    const response = await axios.get(`${BASE_URL}/history/recommendations/${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`, // get the context token
      },
    },);
    return response.data;
  } catch (error: any) {
    //console.error('Error fetching histroy xd:', error);
    throw error
  }
};

// Delete one of the items of clothing recalled for the current user
const handleDeleteRec = async (id: number, token: string) => {
  try {
    await axios.delete(`${BASE_URL}/history/recommendations/${id}`,  {
      headers: {
        'Authorization': `Bearer ${token}`, // get the context token
      },
    },);
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    throw error;
  }
};


const run_algorithm = async (token: string) => {
  try {
      let response = await axios.get(`${BASE_URL}/run_algorithm`, {
      headers: {
          'Authorization': `Bearer ${token}`, // get the context token
      },
      },);
      return response;
  } catch (error) {
    console.error('Error running algorithm:', error);
    throw error;
  }
};


// Checks if the user has previously tagged garments 
const hasUserTaggedClothing = async (token: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/foryou/hasUserTagged`, {
      headers: {
        'Authorization': `Bearer ${token}`, // get the context token
      },
    },);
    return response.data;
  } catch (error) {
    console.error('Error hasUserTagged algorithm:', error);
    throw error;
  }
};


// -- Style --

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

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 15, 
  },
  primaryButton: {
    backgroundColor: 'black',
    borderRadius: 30,
    padding: 15,
    minWidth: 150,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  descriptionText: {
    textAlign: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    fontSize: 14,
    color: '#666', 
  },

  flatlistStyle: {
    width: '100%',
    zIndex: 0,
  },
  itemBoxStyle: {
    padding: 0.5,
  },

  historyTitle: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    paddingLeft:10,
  },
  noHistoryText: {
    marginTop: 10,
    fontSize: 16,
    color: 'grey',
    paddingLeft:10,
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
  secondContainer: {
    backgroundColor: 'white',
    paddingLeft: 3,
    paddingTop: '1%',
    flexDirection: 'column',

  },
  flatListStyle: {
    width: '100%',
    zIndex: 0,
  },
});