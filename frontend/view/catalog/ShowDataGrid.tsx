import {StyleSheet, View, FlatList, Dimensions, useWindowDimensions, Image, Text, Pressable} from 'react-native';
import {useEffect, useState} from 'react';
import { useFetchClothes } from './useFetchClothes';
import { Item } from '../../utils/modals/interfaces';
import { useCallback } from 'react';

const windowHeight = Dimensions.get('window').height;


const calcNumColumns = (width: number) => {
  let itemWidth = 150; 
  return Math.floor(width / itemWidth);
};

const ShowDataGrid: React.FC<{ gender: string; category: string, navigation: any }> = ({ gender, category, navigation }) => {
  const { data, fetchClothes, setData, setPage } = useFetchClothes(gender, category);
  const {width} = useWindowDimensions();
  const [numColumns, setNumColumns] = useState(calcNumColumns(width));
  

  const onItemPress = (item : any) => {
    navigation.navigate('Details', {item: item })
  };

  const renderItem = useCallback(({ item }: { item: Item }) => {
    return(
      <View style={styles.itemBoxStyle}>
        <View>
          <Pressable onPress={() => onItemPress(item)}>
            <Image source={{uri: item.photos_urls[0]}} style={[styles.itemStyle, {width: width/numColumns}]} resizeMode="cover"/>
          </Pressable>
        </View>
        <View style={[styles.textView, {maxWidth: width/numColumns}]}>
          <Text numberOfLines={1} style={styles.textStyle}>{item.name}</Text>
          <Text numberOfLines={1} style={styles.textStyle}>{item.price}</Text>
        </View>
      </View>
    );
  }, []);

  useEffect(() => {
    setNumColumns(calcNumColumns(width));
  }, [width]);

  useEffect(() => {
    setData([]);
    setPage(1);
    fetchClothes(true);
  }, [gender, category]);
  
  
  return (
    <View style={styles.container}>
        <FlatList
          style = {styles.flatlistStyle}
          data={data}
          renderItem={renderItem}
          numColumns={numColumns}
          onEndReached={() => fetchClothes()}
          onEndReachedThreshold={0.5}
          key={numColumns}
          keyExtractor={item => item.id.toString()}
          maxToRenderPerBatch={4}
          initialNumToRender={10}
          getItemLayout={(data, index) => (
            {length: windowHeight * 0.5, offset: windowHeight * 0.5 * index, index}
          )}
        />
      </View> 
    );
  }

  export default ShowDataGrid;

  
// -- Style --

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    backgroundColor: 'white',
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
  itemStyle: {
    height: windowHeight * 0.35,
  },
  textStyle: {
    fontSize: 12,
    padding: 10,
    marginLeft: 3,
  },
});