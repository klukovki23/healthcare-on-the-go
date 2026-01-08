import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSavedAppointments, getHelpRequests } from '../utils/session';

type Props = {
    showOnRoutes?: string[];
};

const EmergencyNotice: React.FC<Props> = ({ showOnRoutes = ['Patient', 'Reports'] }) => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const [visible, setVisible] = useState<boolean>(false);

    const computeVisible = () => {
        // Only show on the configured routes
        if (!showOnRoutes.includes(route.name as string)) return false;
        const saved = getSavedAppointments() || [];
        const help = getHelpRequests() || [];
        const pendingHelp = (help || []).some((h: any) => !h.status || h.status === 'pending');
        const hasDemo = saved.some((a: any) => String(a.id) === 'h-demo');
        return hasDemo || pendingHelp;
    };

    useEffect(() => {
        // Initial check
        setVisible(computeVisible());
        // Poll lightly to reflect session changes while staying on the same screen
        const id = setInterval(() => setVisible(computeVisible()), 1500);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.name]);

    if (!visible) return null;

    return (
        <View style={styles.container} accessibilityRole="alert">
            <View style={styles.contentRow}>
                <View style={styles.leftRow}>
                    <Ionicons name="alert-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.title}>Hätäpotilas</Text>
                </View>
            </View>
            <Text style={styles.subtitle}>Uusi hätätilanne – tarkista työlista!</Text>
        </View>
    );
};

export default EmergencyNotice;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ef4444',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomColor: '#dc2626',
        borderBottomWidth: 1,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    subtitle: {
        color: '#f0ede1ff',
        marginTop: 4,
        fontSize: 12,
    },
    ctaButton: {
        backgroundColor: '#b91c1c',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    ctaText: {
        color: '#fff',
        fontWeight: '700',
    },
});
