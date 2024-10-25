import { View, Text, StyleSheet,Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListItem, Icon, Avatar } from '@rneui/themed';
import { useAuth } from '../authentication/AuthContext';
import React from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/utils';
import LoadingIndicator from '../../utils/LoadingIndicator';


export const ListItemComponent = ({title, iconName, onPress}:any) => {
  return(
    <Pressable onPress={onPress}>
      <ListItem bottomDivider  >
        <Icon name={iconName} type="material-community" color="grey" />
        <ListItem.Content>
          <ListItem.Title>{title}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    </Pressable>
    )
}


export default function AccountScreen(){
  const [userData, setUserData] = React.useState("null");
  const [loading, setLoading] = React.useState(true);
  const { token, logOut } = useAuth();
  const initials = userData.split(' ').map((word: string) => word.charAt(0)).join('');
 
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/user_data`, {
          headers: {
            'Authorization': `Bearer ${token}`,// obtenemos el token del contexto
          },
        },);
        if (response.status === 200) {
            const userData = JSON.parse(response.data);
            setUserData(userData.username);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 401) {
              console.log('User not logged in');
          } else {
              console.error('Error fetching user data:', error.response.status, error.response.data);
          }
      } else {
          console.error('Network or other error:', error);
      }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
  }, []);


  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión', 
      '¿Estás seguro de que quieres salir?', 
      [
        {
          text: 'Cancelar',
          onPress: () => console.log('Cancelado'), 
          style: 'cancel',
        },
        {
          text: 'Salir',
          onPress: () => logOutAccount(),
          style: 'destructive', 
        },
      ],
      { cancelable: true } 
    );
  };


  const logOutAccount = async () => {
    try {
      await logOut(); // eliminamos el token de async-storage
      await axios.get(`${BASE_URL}/api/mobile/logout`, { // eliminamos el token de las sesiones
        headers: {
          'Authorization': `Bearer ${token}`, // obtenemos el token del contexto
        },
      },);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };


  const deleteAccount = async () => {
    try {
      await axios.delete(`${BASE_URL}/user`, { // eliminamos el token de las sesiones y la cuenta
        headers: {
          'Authorization': `Bearer ${token}`, // obtenemos el token del contexto
        },
      },);
      await logOut(); // eliminamos el token de async-storage
    } catch (error) {
      console.error('Error during delete account:', error);
    }
  };


  const handleDeleteAccount = async () => {
    Alert.alert(
      'Borrar cuenta',
      '¿Estás seguro de que quieres borrar tu cuenta?', 
      [
        {
          text: 'Cancelar',
          onPress: () => console.log('Cancelado'), 
          style: 'cancel',
        },
        {
          text: 'Borrar',
          onPress: () => deleteAccount(), 
          style: 'destructive',
        },
      ],
      { cancelable: true } 
    );
  };


  if (loading) {
    return (
      <LoadingIndicator/>
    );
  }

  if (!userData) {
    return (
      <LoadingIndicator/>
    );
  }



  return(
    <SafeAreaView style={{flexDirection: 'column', flex:1, backgroundColor:'white'}}>
      
      <View style={{flex: 1, alignItems:'center', justifyContent:'center'}} >
        <Avatar
          size={64}
          rounded
          title={initials.toUpperCase()}
          containerStyle={{ backgroundColor: 'black',}}
        />
        <Text style={{paddingTop:20}}>Hola, {userData.charAt(0).toUpperCase()+ userData.slice(1)}</Text>
      </View>
      <View style={{flex: 2,}} >
        <ListItemComponent title = "Borrar cuenta" iconName= "trash-can-outline" onPress={handleDeleteAccount}/>
        <ListItemComponent title = "Salir" iconName= "exit-to-app" onPress={handleLogout}/>
      </View>
  
    </SafeAreaView>
  );
  }
  

  const styles = StyleSheet.create({
    container: {
      flex:1,
      padding: 20,
      alignContent: 'center',
      justifyContent: 'center',
    },
  });
  

