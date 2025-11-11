import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const TopNav = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();

    const navItems = [
        { path: 'Schedule', icon: 'calendar-outline', label: 'Työlista' },
        { path: 'Patient', icon: 'person-circle-outline', label: 'Potilas' },
        { path: 'Reports', icon: 'clipboard-outline', label: 'Raportit' },
    ];

    return (
        <View style={styles.navbar}>
            {navItems.map((item) => {
                const isActive = route.name === item.path;
                return (
                    <TouchableOpacity
                        key={item.path}
                        style={[styles.navButton, isActive && styles.activeButton]}
                        onPress={() => navigation.navigate(item.path)}
                    >
                        <Ionicons
                            name={item.icon as any}
                            size={24}
                            color={isActive ? '#ffffff' : '#cbd5e1'}
                        />
                        <Text style={[styles.label, isActive && styles.activeLabel]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default TopNav;

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 64,
        backgroundColor: '#2563eb', // sama kuin "bg-primary"
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
    },
    navButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeButton: {},
    label: {
        fontSize: 12,
        color: '#cbd5e1', // vaaleanharmaa teksti
        marginTop: 4,
    },
    activeLabel: {
        color: '#ffffff', // valkoinen aktiivinen
        fontWeight: '600',
    },
});
