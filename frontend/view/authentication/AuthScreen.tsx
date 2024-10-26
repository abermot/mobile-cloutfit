import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ImageBackground, Modal} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextInputComponent} from '../components/TextInputComponent';
import { TextInput } from 'react-native-paper';
import { encode } from 'base-64';
import React from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/utils';
import { useAuth } from './AuthContext';

global.btoa = encode;


const AuthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [code_value, setCodeValue] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [elementVisible, setElementVisible] = React.useState(true);
  const [error, setError] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = React.useState(false);

  const [signUpToken, setSignUpToken] = React.useState(null);
  const { logIn } = useAuth();

  const onSignUp = async (data: any) => {
    const { token } = data;
    await logIn(token); // save token in asyncstorage
    // if authentication is correct -> navigate to startPage
    navigation.navigate('Start');
  };

  const onLogIn = async (response: { data: { token: any } }) => {
    const { token } = response.data;
    await logIn(token); // save token in asyncstorage
    // if authentication is correct -> navigate to startPage
    navigation.navigate('Start');
  };
  
  const handleAuth = async () => {
    setIsButtonDisabled(true); // Deshabilitar el botón inmediatamente
    if(email == '' || password == '') {
      setError("No puede haber campos vacios");
      setIsError(true);
      setIsButtonDisabled(false);
      return
    }
      
    try {
      let response;
      if (isSignUp) {
        const url = `${BASE_URL}/signup/mobile`;
        response = await axios.post(url, {
          username: username,
          email: email,
          password: password,
        }, {withCredentials: true});
      } else {
        const url = `${BASE_URL}/api/mobile/login`;
        response = await axios.post(url, {  withCredentials: true}, {
          auth: {
            username: email,
            password: password,
          },
          withCredentials: true
        });
      }
      if (response.status == 200) {
        if (isSignUp) {
          setError(' ');
          setIsError(false);
          setModalVisible(true);
          setElementVisible(!elementVisible);
          setSignUpToken(response.data);
        } else {
          onLogIn(response)
        }
      } else {
        setError("Usuario o contraseña son incorrectos");
        setIsError(true);
      }
    } catch (error: any) {
      handleError(error.response.data)
    } finally {
      setIsButtonDisabled(false);
    }
    
  };

  const handleError = (errorData: any) => {
    const errorMessages: { [key: string]: string } = {
      'DatabaseAccess': "El email no existe",
      'InvalidEmailInput': "Prueba otra vez con un email valido",
      'InvalidPasswordInput': "Contraseña inválida",
      'IncorrectEmail': "La contraseña o el email son incorrectos",
      'IncorrectPassword': "La contraseña o el email son incorrectos",
      'UserNotVerified': "No existe una cuenta con ese email",
      'UpdateUserFailed': "Codigo incorrecto",
      'FindUserFailed': "Codigo incorrecto",
    };

    setError(errorMessages[errorData] || errorData);
    setIsError(true);
  };


  const handleValidation = async () => {
    try {
      const response = await axios.put(`${BASE_URL}/validation`, JSON.stringify(code_value), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Respuesta del servidor:', response.data); 
      if (response.data) { // validation email has been sent successfully 
        setModalVisible(!modalVisible);
        onSignUp(signUpToken);
      } else {
        setError("Error al validar correo");
      }
    } catch (error: any) {
      console.error('Error:', error); 
      handleError(error.response?.data || 'Error desconocido');
    }
  };

  const changeScreen = async () => {
    setIsSignUp(!isSignUp);
    setIsError(false);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <View style={styles.container}>
    <ImageBackground source={require('../../assets/clothes_background.jpg')} resizeMode="cover" blurRadius={3} style={styles.image}>
      <View style={styles.overlay} />
    </ImageBackground>

    {elementVisible ? (
      <View style={styles.content}>
        <Image style={styles.imageLogo} source={require('../../assets/cloutfitlogo.png')} />
        <View style={styles.formContainer}>

          {isSignUp && <TextInputComponent label="Username" onValidate={setUsername}/>}

          <TextInputComponent label="Email" onValidate={setEmail}/>
          <Icon name={"home"} size={1} />
          <TextInputComponent label="Password" onValidate={setPassword}/>

          {isError ? (
            <View style={{ flexDirection: 'row' }}>
            <Icon name='alert-circle' size={18} color={"red"}/>
             <Text style={styles.errorText}> {error}</Text>
            </View>
          ): null}
          <TouchableOpacity style={[styles.primaryButton, {opacity: isButtonDisabled ? 0.5 : 1}]} onPress={handleAuth} disabled={isButtonDisabled}>
            <Text style={styles.primaryButtonText}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={changeScreen}>
            <Text style={styles.text}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={changeScreen}>
            <Text style={styles.secondaryButtonText}>{isSignUp ? 'Log In' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : null}

    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        Alert.alert('Modal has been closed.');
        setModalVisible(!modalVisible);
      }}>
      <View style={styles.centeredView}>
        <Image style={styles.imageLogo} source={require('../../assets/cloutfitlogo.png')} />
        <View style={styles.modalView}>
          <Text style={styles.modalTextBig}>Te enviamos un código</Text>
          <Text style={styles.modalTextSmall}>Introdúzcalo a continuación para verificar el correo: {email}</Text>
          <TextInput
            label="Verification code"
            value={code_value}
            mode='outlined'
            cursorColor='blue'
            onChangeText={text => {
              // only numbers
              const formattedText = text.replace(/[^0-9]/g, '');
              // only 4 digits
              if (formattedText.length <= 4) {
                setCodeValue(formattedText);
              }
            }}
          />
          {isError ? (
            <View style={{ flexDirection: 'row' }}>
            <Icon name='alert-circle' size={18} color={"red"}/>
             <Text style={styles.errorText}> {error}</Text>
            </View>
          ): null}
          <Text style={styles.modalTextLink}>No has recibido el correo?</Text>
          <TouchableOpacity style={[styles.primaryButton, { marginTop:30}]} onPress={handleValidation}>
            <Text style={styles.primaryButtonText}>Siguiente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
     
  </View>
  );
}

export default AuthScreen;


// -- Style --

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLogo: {
    width: 323,
    height: 86,
    marginBottom: 20,
  },
  text: {
    color: 'black',
    marginVertical: 10,
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'gray',
    opacity: 0.3,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    alignContent: 'flex-start'
  },
  primaryButton: {
    backgroundColor: 'black',
    borderRadius: 30,
    alignItems: 'center',
    padding: 15,
    marginVertical: 10,
    width: '100%',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderColor: 'black', 
    borderWidth: 1,
    borderRadius: 30,
    alignItems: 'center',
    padding: 15,
    marginVertical: 10,
    width: '100%',
  },
  secondaryButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalView: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 50,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTextBig: {
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalTextSmall: {
    marginBottom: 15,
  },
  modalTextLink: {
    color: "blue",
    marginTop: 7,
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize:15,
  },
});
