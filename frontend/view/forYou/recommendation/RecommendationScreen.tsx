import axios from 'axios';
import { useState, useEffect} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Image, Pressable} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Item, Recommendations } from '../../../utils/modals/interfaces';
import LoadingIndicator from '../../../utils/LoadingIndicator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../authentication/AuthContext';
import { useRoute } from '@react-navigation/native';
import { BASE_URL } from '../../../utils/utils';

// this screen allows you to run the algorithm and view the history of recommendations
const RecommendationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAlg, setLoadingAlg] = useState(false);
  const [isMobile, setIsMobile] = useState(Platform.OS == 'web' ? false : true);
  const { token } = useAuth();
  const { params } = useRoute();
  const { gender, items } = params as { gender: string, items: string };

  
  
  const currentItem = data[currentItemIndex];

const handleFinish = async (recommendations: Recommendations[]) => {
    // when the algorithm is finished, new screen will be displayed
    navigation.navigate('ShowRecommendations', {recommendations: recommendations})
};

const handlefetchRecommendation = async () => {
  try {
      let response = await axios.get(`${BASE_URL}/run_algorithm/${gender}`, {
      headers: {
          'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
      },
      },);
      return response;
  } catch (error: any) {
      // Check this error 
  }
};


const handleObtainImages = async (gender: String, items : String) => {
    try {
      let response = await axios.get(`${BASE_URL}/foryou/${gender}/${items}`,{
        headers: {
          'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
        },
      },);
      return response;
    } catch (error: any) {
        return error
    }
};

const navBack = async () => {
navigation.goBack()
};




async function save_likes(item: Item) {
    try {
        await axios.post(`${BASE_URL}/save/like/`+item.id, {item: item}, {
            headers: {
              'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
            },
          },);
    } catch (error) {
        console.log('Error: ' + error);
    }
}

async function save_dislikes(item: Item) {
    try {
        await axios.post(`${BASE_URL}/save/dislike/`+item.id, {item: item}, {
            headers: {
              'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
            },
          },);
    } catch (error) {
        console.log('Error: ' + error);
    }
}

  const handleLikeDislike = (action: 'like' | 'dislike', item: Item) => {
    if (action == 'like') {
      save_likes(item)
    } else {
      save_dislikes(item)
    }
    if (currentItemIndex == parseInt(items.toString()) - 1) {
      const fetchRecs = async () => {
        setLoadingAlg(true); // start algorithm
        try {
          const response = await handlefetchRecommendation();
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
          //setIsUnauthorized(true);
        } finally {
          setLoadingAlg(false); // stop algorithm
        }
      };
      fetchRecs();
    } else {
      setCurrentItemIndex((prevIndex) => (prevIndex + 1) % data.length);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log(gender + items)
        const response = await handleObtainImages(gender, items); 
        if(response) {
          let data =  response.data;
            setData(data)
        }
      } catch (error: any) {
        // user unauthorized
      } finally {
        setLoading(false); // termina de cargar, ya se sabe si el usuario esta autorizado o no
      }
    };
    fetchData()
    setIsMobile(Platform.OS == 'web' ? false : true)
  }, []);



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingIndicator/>
      </SafeAreaView>
    );
  }
  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No items available</Text>
      </SafeAreaView>
    );
  }
  
  

 
  
    return (
      <SafeAreaView style={{ flex: 1,  backgroundColor: 'white'}}>
        {loadingAlg ? (
          <View style={{alignItems: 'center', justifyContent: 'center',  flex:1, backgroundColor: 'white'}}>
            <Text style={{fontSize:20, fontFamily: 'Helvetica Neue',textAlign: 'center', fontWeight: 'bold',}}>Se están preparando las recomendaciones...</Text>
            <LoadingIndicator/>
          </View>
        ) : (
          <>

          
          {isMobile ? (
            <Pressable style={styles.backButton} onPress={() => navBack()}>
              <Icon name="close" size={30} color="black" />
            </Pressable>
          ) : null}
          

          <View style={styles.container}>
            <Text style={styles.historyTitle}>¿Qué opinas de esta prenda?</Text>
            <View style={styles.imageScrollContainer}>
              <FlatList
                data={currentItem.photos_urls}
                horizontal
                removeClippedSubviews
                initialNumToRender={Platform.OS == 'web' ? 3 : 1}
                maxToRenderPerBatch={Platform.OS == 'web' ? 3 : 1}
                // getItemLayout={(data, index) => (
                //   {length:  300, offset: 200 * index, index}
                // )}

                keyExtractor={(item, index) => index.toString()}
                key={currentItem.photos_urls.length} 
                renderItem={({ item }) => (
                  <Image
                  style={styles.image}
                  source={{ uri: item }}
                  resizeMode='cover'
                />
                )}
              /> 
            </View>
            <View >
              <Text style={styles.title}>{currentItem.name}</Text>
              <Text style={styles.price}>{currentItem.price}</Text>
            </View>
    
            <View style={styles.buttonsContainer}>
              <TouchableOpacity onPress={() => handleLikeDislike('dislike', currentItem)} style={styles.primaryButton}>
                <Icon name="close" size={20} color="white" />
                <Text style={styles.primaryButtonText}> Dislike</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleLikeDislike('like', currentItem)} style={styles.primaryButton}>
                <Icon name="check" size={20} color="white" />
                <Text style={styles.primaryButtonText}> Like</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
        )}
      </SafeAreaView>
    );
  }

export default RecommendationScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20, 
    },
    textStyle: {
        fontSize: 18,    
    },
    textContainer: {
        justifyContent: 'center',
        flexDirection: 'row'
    },
    imageScrollContainer: {
      flex: 1,
      width: '100%',
      marginBottom: 30,
    },
    image: {
      width: Platform.OS == 'web' ? 600 : 350 ,
      marginRight: 10,
    },
    buttonsContainer: {
        paddingTop: 10,
        justifyContent: 'space-around',
        flexDirection: 'row'
    },
    primaryButton: {
      backgroundColor: 'black',
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center', 
      alignContent: 'center',
      padding: 15,
      marginVertical: 10,
      width: Platform.OS == 'web' ? '17%' : '30%',
      flexDirection: 'row'
    },
    backButton: {
      position: 'absolute',
      top: 10,
      right: 15,
      padding: 5,
      zIndex: 1,
      paddingTop:'10%',
    },
    primaryButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    title: {
      fontSize: 15,
      marginVertical: 8,
    },
    price: {
      fontSize: 16,
      marginVertical: 4,
    },
    historyTitle: {
      marginBottom: 20,
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
      paddingLeft:10,
    },
});