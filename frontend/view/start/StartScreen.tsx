import { StyleSheet, View, ActivityIndicator, Alert} from 'react-native';
import * as React from 'react';
import ShowDataGrid from '../catalog/ShowDataGrid';
import MobileHeader from '../components/headerComponents/MobileHeader'
import RecommendationScreen from '../forYou/recommendation/RecommendationScreen';
import { useAuth } from '../authentication/AuthContext';
let AuthContext = false;

export default function StartScreen({navigation}:any) {
  const [genderValue, setGenderValue] = React.useState<string>('mujer');
  const [categoryValue, setCategoryValue] = React.useState<string>('all');
  const { getToken } = useAuth();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  AuthContext = isAuthenticated;

  const handleGetValueGender = (value: string) => {
      setGenderValue(value); 
      setCategoryValue('all'); 
      navigation.navigate('Start', { category_route: value });
  };
  
  const handleGetValueCategory = (value: string) => {
      setCategoryValue(value); 
  };

  React.useEffect(() => {
    const checkAuth = async () => {
        try {
            const token = await getToken();
            if (token) {
                // token exists, user is authenticated
                setIsAuthenticated(true);
            } else {
                // no token, user is not authenticated
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error checking authentication', error);
            Alert.alert('Error', 'Error checking authentication status');
            setIsAuthenticated(false);
        } finally {
            setLoading(false);  // stop loading once the check is done
        }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }
  
  return (
    <View style={styles.container}>
      <MobileHeader onGetValueGender={handleGetValueGender} onGetValueCategory ={handleGetValueCategory}/>
      {genderValue == "parati" ?
        <RecommendationScreen navigation={navigation}/>
      :
        <ShowDataGrid gender = {genderValue} category = {categoryValue} navigation={navigation}/>
      }
    </View>
  );
}
 
// -- Style --
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
