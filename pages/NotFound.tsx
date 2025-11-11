import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const NotFound = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();

    useEffect(() => {
        console.error('404 Error: User attempted to access non-existent route:', route.name);
    }, [route.name]);

    return (
        <View style={styles.container}>
            <View style={styles.inner}>
                <Text style={styles.title}>404</Text>
                <Text style={styles.subtitle}>Oops! Page not found</Text>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('Schedule')}
                >
                    <Text style={styles.homeText}>Return to Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default NotFound;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6', // vastaa bg-gray-100
        alignItems: 'center',
        justifyContent: 'center',
    },
    inner: {
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        color: '#4b5563',
        marginBottom: 20,
    },
    homeButton: {
        backgroundColor: '#2563eb', // sininen
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    homeText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
