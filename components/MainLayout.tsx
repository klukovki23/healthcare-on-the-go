import React from 'react';
import { View, StyleSheet } from 'react-native';
import TopNav from '../components/TopNav';


const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <View style={styles.container}>
            <TopNav />
            <View style={{ flex: 1 }}>
                {children}
            </View>
        </View>
    );
};

export default MainLayout;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
