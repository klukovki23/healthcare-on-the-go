import React from 'react';
import { View, StyleSheet } from 'react-native';
import TopNav from '../components/TopNav';
import EmergencyNotice from './EmergencyNotice';


const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <View style={styles.container}>
            {/* Top spacer to create empty area above the TopNav */}
            <View style={styles.topSpacer} />
            <TopNav />
            {/* Emergency banner under TopNav for Patient and Reports */}
            <EmergencyNotice showOnRoutes={['Patient', 'Reports']} />
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
