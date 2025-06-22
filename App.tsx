import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import TimerScreen from './screens/TimerScreen';
import SettingScreen from './screens/SettingScreen';

export type RootStackParamList = {
  Timer: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Timer"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Timer"
          component={TimerScreen}
          options={{ title: 'RhythMark' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingScreen}
          options={{ title: 'Timer Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
