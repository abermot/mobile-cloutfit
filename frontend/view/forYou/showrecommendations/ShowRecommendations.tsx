import { useCallback, useState} from 'react';
import { View, Text, StyleSheet, Image, Pressable, useWindowDimensions, FlatList} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Item } from '../../../utils/modals/interfaces';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';

const calcNumColumns = (width: number) => {
  const itemWidth = 100; 
  return Math.floor(width / itemWidth);
};

// this screen allows you to view new recommendations
const ShowRecommendations: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { params } = useRoute();
  const { recommendations } = params as { recommendations: Item[] };
  const {width} = useWindowDimensions();
  const [numColumns, setNumColumns] = useState(calcNumColumns(width));

  const handleNavigate = () => {
      navigation.navigate('ForYou')
      
  };

  const handleItemPress = (item : any) => {
    navigation.navigate('Details', {item: item })
  };


  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={styles.itemBoxStyle}>
      <Pressable onPress={() => handleItemPress(item)}>
        <Image source={{uri: item.photos_urls[0]}} style={[styles.imagesView, {minWidth: '30%', width: width/numColumns}]}/>
      </Pressable>
      <View style={[styles.textStyle, {maxWidth: width/numColumns}]}>
        <Text numberOfLines={1} style={styles.textStyle}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.textStyle}>{item.price}</Text>
      </View>
    </View>
  ), []);
  
  return (
    <SafeAreaView style={{ flex: 1,  backgroundColor: 'white' }}>
      <View style={styles.container}>
        <View>
          <Text style={{padding:20, fontSize:20, fontFamily: 'Helvetica Neue',textAlign: 'center', fontWeight: 'bold'}}>Tus recomendaciones</Text>
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
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          maxToRenderPerBatch={4}
          initialNumToRender={10}
          getItemLayout={(data, index) => (
            {length: 200, offset: 200 * index, index}
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
    height: 200,
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