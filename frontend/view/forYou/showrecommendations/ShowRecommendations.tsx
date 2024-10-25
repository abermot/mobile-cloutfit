import { useCallback, useState} from 'react';
import { View, Text, StyleSheet, Image, Pressable, useWindowDimensions, Platform, FlatList} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Item } from '../../../utils/modals/interfaces';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';

// this screen allows you to run the algorithm and view the history of recommendations
const ShowRecommendations: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { params } = useRoute();
  const { recommendations } = params as { recommendations: Item[] };

  const handleNavigate = () => {
      navigation.navigate('ForYou')
      
  };
  const calcNumColumns = (width: number) => {
    const itemWidth = 100; 
    return Math.floor(width / itemWidth);
  };

  const handleItemPress = (item : any) => {
    navigation.navigate('Details', {item: item })
  };
  const {width} = useWindowDimensions();
  const [numColumns, setNumColumns] = useState(calcNumColumns(width));
  const mobileText = "Tus recomendaciones";
  const webText = "Aquí puedes ver las recomendaciones que se han hecho para ti";


  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={styles.itemBoxStyle}>
      <Pressable onPress={() => handleItemPress(item)}>
        <Image source={{uri: item.photos_urls[0]}} style={[styles.imagesView, {minWidth: '30%', width: width/numColumns}]}/>
      </Pressable>
      <View style={[styles.textStyle, {maxWidth: width/numColumns}]}>
        <Text numberOfLines={1} style={styles.textStyle}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.textStyle}>{item.price}</Text>
        {/* <Text numberOfLines={1} style={styles.textStyle}>{item.more_colours}</Text> */}
      </View>
    </View>
  ), []);
  
  return (
    <SafeAreaView style={{ flex: 1,  backgroundColor: 'white' }}>
      <View style={styles.container}>
        <View>
          <Text style={{padding:20, fontSize:20, fontFamily: 'Helvetica Neue',textAlign: 'center', fontWeight: 'bold'}}> {Platform.OS == 'web' ? webText : mobileText}</Text>
          <Pressable onPress={() => handleNavigate()} style={styles.removeIcon}>
            <Icon name="close" size={24} color="black" />
          </Pressable>
        </View>
        <FlatList
          style={styles.flatlistStyle}
          data={recommendations}
          renderItem={renderItem}
          numColumns={numColumns}
          key={numColumns}
          showsVerticalScrollIndicator={Platform.OS == 'web' ? true : false }
          keyExtractor={item => item.id.toString()}
          maxToRenderPerBatch={Platform.OS == 'web' ? 10 : 4}
          initialNumToRender={10}
          getItemLayout={(data, index) => (
            {length:  Platform.OS == 'web' ? 400: 200, offset: Platform.OS == 'web' ? 400: 200 * index, index}
          )}
        />
      </View>
    </SafeAreaView>
  
  );
}

export default ShowRecommendations

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imagesView: {
      padding: 0.5,
      height: Platform.OS == 'web' ? 400: 200,
      backgroundColor: 'white',
      maxHeight:'100%',
    },
    itemBoxStyle: {
      padding: 0.5,
    },
    textStyle: {
      fontSize: 12,
      padding: 10,
      marginLeft: 3,
    },
    flatlistStyle: {
      width: '100%',
      zIndex: 0,
    },
    removeIcon: {
      position: 'absolute',
      top: 5,
      right: 5,
      zIndex: 1,
      padding: 5,
    },
});