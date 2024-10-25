import { StyleSheet, View, Image, Text, Modal, SafeAreaView, Platform, StatusBar, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as React from 'react';
import { Menu } from './Menu'


const SetUpModal: React.FC<{ isMenuVisible: boolean; toggleMenu: () => void; handleMenuClick: (category: string) => void; activeCategory: string; onGetValueCategory: () => void;}> = ({ isMenuVisible, toggleMenu, handleMenuClick, activeCategory, onGetValueCategory }) => {
  return (
    <Modal visible={isMenuVisible} >
      <SafeAreaView>
        <View style={{padding:20}}>
          <Pressable onPress={() => toggleMenu()}>
            <Icon name="close" size={24} color="black" />
          </Pressable>

          <View style={styles.horizontalMenuModal}>
            <Pressable onPress={() => handleMenuClick('mujer')}>
              <Text style={activeCategory == 'mujer' ? {fontWeight: 'bold'} : null}>Mujer</Text>
            </Pressable>
            <Pressable onPress={() => handleMenuClick('hombre')}>
              <Text  style={activeCategory == 'hombre' ? {fontWeight: 'bold'} : null}>Hombre</Text>
            </Pressable>
          </View>

          <View style={styles.verticalMenuModal}>
            <Menu category={activeCategory} onGetValueCategory={onGetValueCategory} closeModal={toggleMenu}/> 
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
};

export default function MobileHeader({onGetValueGender, onGetValueCategory} : any) {
  const [activeCategory, setActiveCategory] = React.useState('mujer');
  const [isMenuVisible, setMenuVisible] = React.useState(false);

const toggleMenu = () => {
  setMenuVisible(!isMenuVisible);
};



const handleMenuClick = (category: any) => { // always select one
  setActiveCategory(category);
  onGetValueGender(category)
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Pressable onPress={toggleMenu} style={styles.menuIcon}>
          <Icon name="menu" size={24} />
        </Pressable>
  
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/cloutfitlogo.png')} style={styles.logo} />
        </View>
      
      <SetUpModal isMenuVisible={isMenuVisible} toggleMenu={toggleMenu} handleMenuClick={handleMenuClick} activeCategory={activeCategory} onGetValueCategory ={onGetValueCategory} />
      </View>
    </SafeAreaView>
  );
};

  const styles = StyleSheet.create({
    container: {
      backgroundColor: "white",
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
    headerContainer: {
      backgroundColor: 'white',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
    menuIcon: {
      padding: 10,
    },
    logoContainer: {
      flex: 1,
      alignItems: 'center',
    },
    logo: {
      width: 120,
      height: 30,
      resizeMode: 'contain',
    },
    iconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWithText: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10,
    },

    horizontalMenuModal: {
      justifyContent: 'space-around',
      flexDirection: 'row',
      borderBottomWidth: 1,
      padding:10,
    },

    verticalMenuModal: {
      borderBottomWidth: 1,
      padding:10,
      flexDirection: 'column',
    },
  });