import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Schedule from './pages/Schedule';
import Patient from './pages/Patient';
import Reports from './pages/Reports';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />

          <View style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Schedule" component={Schedule} />
              <Stack.Screen name="Patient" component={Patient} />
              <Stack.Screen name="Reports" component={Reports} />
            </Stack.Navigator>
          </View>

        </SafeAreaView>
      </NavigationContainer>
    </QueryClientProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
