import {StyleSheet, View, FlatList, Dimensions, useWindowDimensions, Image, Text, Pressable, Platform} from 'react-native';
import * as React from 'react';
import { useFetchClothes } from './useFetchClothes';
import { Item } from '../../utils/modals/interfaces';
import { useCallback } from 'react';

const windowHeight = Dimensions.get('window').height;



const calcNumColumns = (width: number) => {
  let itemWidth = 300; 
  Platform.OS != 'web' ? itemWidth = 150 : null
  return Math.floor(width / itemWidth);
};

const ShowDataGrid: React.FC<{ gender: string; category: string, navigation: any }> = ({ gender, category, navigation }) => {
  const { data, fetchClothes, setData, setPage } = useFetchClothes(gender, category);
  const {width} = useWindowDimensions();
  const [numColumns, setNumColumns] = React.useState(calcNumColumns(width));
  

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
          {/* <Text numberOfLines={1} style={styles.textStyle}>{item.more_colours}</Text> */}
        </View>
      </View>
    );
  }, []);

  React.useEffect(() => {
    console.log("Esta cambiando con el de with")
    setNumColumns(calcNumColumns(width));
  }, [width]);

  React.useEffect(() => {
    setData([...data]);
    //setPage(1);
    console.log("Esta cambiando con el que pone la data a 0 xsssss")
    fetchClothes(false);
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
          maxToRenderPerBatch={Platform.OS == 'web' ? 10 : 4}
          initialNumToRender={10}
          getItemLayout={(data, index) => (
            {length: windowHeight * 0.5, offset: windowHeight * 0.5 * index, index}
          )}
        />
      </View> 
    );
  }

  export default ShowDataGrid;

  
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
      height:  Platform.OS == 'web' ? windowHeight * 0.5 : windowHeight * 0.35,
     
    },
    textStyle: {
      fontSize: 12,
      padding: 10,
      marginLeft: 3,
    },
    noDataText: {
      fontSize: 18,
      textAlign: 'center',
    },
  });