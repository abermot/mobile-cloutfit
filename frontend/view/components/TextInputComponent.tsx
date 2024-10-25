import React from 'react';
import { View, StyleSheet} from 'react-native';
import { TextInput } from 'react-native-paper';


export const TextInputComponent = ({label, onValidate}:any) => {
  const [text, onChangeText] = React.useState('');
  let isPassword = false;

  const handleTextChange = (newText: string) => {
    onChangeText(newText); 
    if(onValidate) {
      onValidate(newText); 
    }
  }
  if (label == "Password") {
    isPassword = true;
  }
 

  return(
    <View style={styles.inputView} >
      <TextInput 
        selectionColor='red'
        secureTextEntry={isPassword}
        style={styles.inputText}
        mode='outlined'
        onChangeText={handleTextChange} 
        placeholderTextColor="gray"
        label={label}
        value={text}
        autoCapitalize='none'
      />
    </View>
  );
}


const styles = StyleSheet.create({
  inputView: {
    marginVertical: 7,
    width: '100%',
    maxWidth: 400,
  },
  inputText: {
    color:"black",
  },
});