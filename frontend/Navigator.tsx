import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StartScreenMobile from './view/start/StartScreenMobile';
import AuthScreen from './view/authentication/AuthScreen'
import DetailScreen from './view/detailScreen/DetailScreen'
import ForYouScreen from './view/forYou/ForYouScreen';
import FavoritesScreen from './view/favourites/FavoritesScreen';
import RecommendationScreen from './view/forYou/recommendation/RecommendationScreen';

import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from './view/authentication/AuthContext';
import AccountScreen from './view/profile/AccountScreen';
import ShowRecommendations from './view/forYou/showrecommendations/ShowRecommendations';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();





const AuthenticatedTabs = () => {
    return (
        <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
            let iconName = "help";
            if (route.name === 'Start') {
                iconName = "home";
            } else if (route.name === 'Profile') {
                iconName = "account";
            } else if (route.name == 'ForYou') {
                iconName = "creation";
            } else if (route.name == 'Favourites') {
                iconName = "heart";
            }
            return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarLabel: () => null, // oculta los nombres de los iconos
            headerShown:false,
            tabBarActiveTintColor: 'black',
            tabBarInactiveTintColor: 'gray',
        })}
        >
        <Tab.Screen name="Start" component={StartScreenMobile} />
        <Tab.Screen name="ForYou" component={ForYouScreen}/>
        <Tab.Screen name="Favourites" component={FavoritesScreen} />
        <Tab.Screen name="Profile" component={AccountScreen} />
        </Tab.Navigator>
    );
};

  

const TabNavigatior = () => {
    return (
        <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
            let iconName = "help";
            if (route.name === 'Start') {
                iconName = "home";
            } else if (route.name === 'Auth') {
                iconName = "account";
            } else if (route.name == 'ForYou') {
                iconName = "creation";
            } else if (route.name == 'Favourites') {
                iconName = "heart";
            }
            return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarLabel: () => null, // oculta los nombres de los iconos
            headerShown:false,
            tabBarActiveTintColor: 'black',
            tabBarInactiveTintColor: 'gray',
        })}
        >
        <Tab.Screen name="Start" component={StartScreenMobile} />
        <Tab.Screen name="ForYou" component={ForYouScreen}/>
        <Tab.Screen name="Favourites" component={FavoritesScreen} />
        <Tab.Screen name="Auth" component={AuthScreen} />
        </Tab.Navigator>
    );
};


const MobileNavigator = () => {
    const { isAuthenticated } = useAuth();
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
            {isAuthenticated ? (
                <Stack.Screen name="TabAuth" component={AuthenticatedTabs}/>
            ) : (
                <Stack.Screen name="Tab" component={TabNavigatior}/>
                )
            }
            <Stack.Screen name="Details" component={DetailScreen} />
            <Stack.Screen name="Recommendation" component={RecommendationScreen} />
            <Stack.Screen name="ShowRecommendations" component={ShowRecommendations} />

            </Stack.Navigator>
        </NavigationContainer>
    );
};
export default MobileNavigator;