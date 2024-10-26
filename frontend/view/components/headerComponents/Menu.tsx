import { StyleSheet, Text, FlatList, ListRenderItem, TouchableOpacity} from 'react-native';
import * as React from 'react';


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
      showsVerticalScrollIndicator={false}
    />
  );
};

// -- Style --

const styles = StyleSheet.create({
  textmenu: {
    padding: 5,
    fontSize: 15,
  },
});



