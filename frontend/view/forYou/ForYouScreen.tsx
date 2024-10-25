import { View, Text, useWindowDimensions, StyleSheet, FlatList, Pressable, Image, Platform} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Item, Recommendations } from '../../utils/modals/interfaces';
import { UnauthorisedAlgorithm } from '../components/errorScreens/Unauthorised';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingIndicator from '../../utils/LoadingIndicator';
import ModalInicial from './modal/ModalInicial';
import ModalRefinar from './modal/ModalRefinar';
import axios, { AxiosResponse } from 'axios';
import { useFocusEffect } from '@react-navigation/native'
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

  useEffect(() => {
    setNumColumns(calcNumColumns(width));
  }, [width]);

  Platform.OS == 'web' ? (
    useEffect(() => {
      fetchHistoryCallback();
    }, [])
  )
  : ( useFocusEffect(
    useCallback(() => {
      fetchHistoryCallback();
    }, [])
    )
 );

 const handleFetchHistory = async (page: number) => {
  try {
    console.log(`${BASE_URL}/history/recommendations/${page}`)
    const response = await axios.get(`${BASE_URL}/history/recommendations/${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
      },
    },);
    return response.data;
  } catch (error: any) {
    throw error
  }
};

const handleNavigation = (gender: string, items : string) => {
  // al algortimo 
  navigation.navigate('Recommendation', {gender: gender, items: items })
};

const handleDeleteRec = async (id: number) => {
  try {
    await axios.delete(`${BASE_URL}/history/recommendations/${id}`,  {
      headers: {
        'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
      },
    },);
    //return response.data
  } catch (error) {
    console.error('Error deleting recommendation:', error);
  }
};

const handleOnPress = (item: Item) => {
  navigation.navigate('Details', {item: item })

};

const run_algorithm = async () => {
  try {
      let response = await axios.get(`${BASE_URL}/run_algorithm`, {
      headers: {
          'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
      },
      },);
      return response;
  } catch (error: any) {
      // Check this error 
  }
};



const hasUserTaggedClothing = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/foryou/hasUserTagged`, {
      headers: {
        'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
      },
    },);
    return response.data;
  } catch (error: any) {
    throw error
  }
};

const handleFinish = async (recommendations: Recommendations[]) => {
  // when the algorithm is finished, new screen will be displayed
  navigation.navigate('ShowRecommendations', {recommendations: recommendations})
};
 

  

  const handlePreferences = () => {  // se cargan las imagenes para que el usuario pueda indicar sus preferencias sobre ellas 
    setModal(true);
  };

  const handleRecommendation = async () => {
    // comprueba si el usuario ha etiquetado prendas o no
    // en el caso de que no se consiga crear ninguna cluster recomienda lo mas parecido a lo que le gustó
    const is_not_user_tagged = await hasUserTaggedClothing(); 
    if (is_not_user_tagged) {
      setInitialModal(true)
    } else {
      const fetchRecs = async () => {
        setIsLoading(true); 
        setLoadingAlg(true);
        try {
          const response = await run_algorithm();
          if(response) {
            if (response.status === 200) {
              let data =  response.data;

              handleFinish(data)
            } else {
              // user unauthorized
            }
          }
        } catch (error: any) {
          // user unauthorized
         // setIsUnauthorized(true);
        } finally {
          setLoadingAlg(false);
          setIsLoading(false); // stop algorithm
        }
      };
      fetchRecs();
    }
  };

  const handleStart = () => {  // se cargan las imagenes para que el usuario pueda indicar sus preferencias sobre ellas 
    setModal(false);
    handleNavigation(gender, items)
  };

  const handleStartInitialModal = () => {  // se cargan las imagenes para que el usuario pueda indicar sus preferencias sobre ellas 
    setInitialModal(false);
    handleNavigation(gender, items)
  };


  const deleteRecommendation = async (id: number) => {
    try {
      handleDeleteRec(id);
      setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting recommendation:', error);
    }
  };

  const fetchHistoryCallback = useCallback(async () => {

    try {
      const fetchedData = await handleFetchHistory(page); 
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
                maxToRenderPerBatch={Platform.OS === 'web' ? 10 : 4}
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
      width: Platform.OS == 'web' ? '20%': null,
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
    secondContainer: {
      backgroundColor: 'white',
      paddingLeft: 3,
      paddingTop: '1%',
      flexDirection: Platform.OS == 'web' ? 'column': 'column',

    },
    flatListStyle: {
      width: '100%',
      zIndex: 0,
    },
  });