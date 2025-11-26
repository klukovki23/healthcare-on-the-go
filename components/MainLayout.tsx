import React from 'react';
import { View, StyleSheet } from 'react-native';
import TopNav from '../components/TopNav';


const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <View style={styles.container}>
            {/* Top spacer to create empty area above the TopNav */}
            <View style={styles.topSpacer} />
            <TopNav />
            <View style={styles.content}>
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
    topSpacer: {
        height: 20,
        backgroundColor: '#2563eb',
    },

    content: {
        flex: 1,
    },
});
