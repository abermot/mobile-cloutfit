import { StyleSheet, Text, FlatList, ListRenderItem, View, TouchableOpacity} from 'react-native';
import * as React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../../utils/utils';


const menuItems = {
  mujer: [
    'Nuevo', 'Vestidos', 'Blazers', 'Basicos', 'Bolsos', 'Pantalones',
    'Camisas', 'Tops', 'Jeans', 'Punto', 'Beachwear', 'Eterior',
    'Sudaderas',
    'Camisetas', 'Faldas', 'Shorts', 'Zapatos', 'Accesorios'
  ],
  hombre: [
    'Nuevo', 'Camisas', 'Camisetas','Blazers', 'Polos', 'Lino',
    'Pantalones', 'Jeans', 'Bermudas', 'Sobrecamisas',  'Bolsos',
    'Punto', 'Sudaderas', 'Zapatos', 'Chaquetas', 'Beachwear',
    'Accesorios'
  ], 

  session: [
    'Cerrar sesión',
    'Borrar cuenta'
  ]
};


interface MenuItemProps {
    title: string;
    onPress: (title: string) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ title, onPress }) => (
    <TouchableOpacity onPress={() => onPress(title)}>
        <Text style={styles.textmenu}>{title}</Text>
    </TouchableOpacity>
);

interface MenuProps {
    category: string;
    onGetValueCategory: (title: string) => void;
    closeModal: () => void;
}

interface MenuSessionProps {
  name: string;
}

export const Menu: React.FC<MenuProps> = ({ category, onGetValueCategory, closeModal } : any) => {
  const items = menuItems[category as keyof typeof menuItems];

  if (!items) {
    return null;
  }


  const handlePress = (title: string) => {
    onGetValueCategory(title.toLowerCase());
    closeModal();
  }

  const renderItem: ListRenderItem<string> = ({ item }) => (
    <MenuItem title={item} onPress={handlePress} />
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item}
    />
  );
};

export const MenuSession: React.FC<MenuSessionProps> = ({ name } : any) => {
  const items = menuItems['session' as keyof typeof menuItems];
  const navigate = useNavigate();


  if (!items) {
    return null;
  }

  const handlePress = async (title: string) => {
    if (title == 'Cerrar sesión') {
      logout_request()
    } else if (title == 'Borrar cuenta') {
      delete_account_request()
    }
  };

  const logout_request = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/logout`, { withCredentials: true });
      if (response.status === 200) {
        // cuando un usuario hace logout se recarga la pagina
        navigate("/mujer")
        window.location.reload();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  const delete_account_request = async () => {
    try {
      const response = await axios.delete(`${BASE_URL}/user`, { withCredentials: true });
      if (response.status === 200) {
        // cuando un usuario hace logout se recarga la pagina
        navigate("/mujer")
        window.location.reload();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  const renderItem: ListRenderItem<string> = ({ item }) => (
    <MenuItem title={item} onPress={handlePress} />
  );

  return (
    <View style={styles.container}>
      <View style={{alignItems:'center'}}>
        <Text style={styles.helloText}>Hola {name}!</Text>
      </View>
      <View style={styles.separator} />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};


const styles = StyleSheet.create({
    textmenu: {
      padding: 5,
      fontSize: 15,
    },
    container: {
      backgroundColor: '#f8f8f8',
      justifyContent:'center'
    },
    helloText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10,
    },
    separator: {
      height: 1,
      backgroundColor: '#cccccc', 
      marginVertical: 10, 
    },
});



