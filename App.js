import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, StyleSheet, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Login from './pages/Login';
import Schedule from './pages/Schedule';
import Patient from './pages/Patient';
import Reports from './pages/Reports';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={{ flex: 1 }}>
              {!isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Schedule" component={Schedule} />
                  <Stack.Screen name="Patient" component={Patient} />
                  <Stack.Screen name="Reports" component={Reports} />
                </Stack.Navigator>
              )}
            </View>
          </SafeAreaView>
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
