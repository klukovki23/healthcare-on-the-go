import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        // Simple validation
        if (!username.trim()) {
            Alert.alert('Virhe', 'Syötä käyttäjätunnus');
            return;
        }
        if (!password.trim()) {
            Alert.alert('Virhe', 'Syötä salasana');
            return;
        }

        // For demo purposes, accept any non-empty credentials
        // In a real app, this would validate against a backend
        if (username.length >= 3 && password.length >= 4) {
            Alert.alert('Onnistui', 'Kirjautuminen onnistui!', [
                {
                    text: 'OK',
                    onPress: onLogin,
                },
            ]);
        } else {
            Alert.alert(
                'Virhe',
                'Virheelliset kirjautumistiedot.\nKäyttäjätunnus: vähintään 3 merkkiä\nSalasana: vähintään 4 merkkiä'
            );
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Logo/Header */}
                <View style={styles.header}>
                    <Ionicons name="medical" size={64} color="#2563eb" />
                    <Text style={styles.title}>Healthcare on the Go</Text>
                    <Text style={styles.subtitle}>Kirjaudu sisään</Text>
                </View>

                {/* Login Form */}
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="person-outline"
                            size={20}
                            color="#6b7280"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Käyttäjätunnus"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#6b7280"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Salasana"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>Kirjaudu sisään</Text>
                    </TouchableOpacity>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
                        <Text style={styles.infoText}>
                            Demo: Käyttäjätunnus min. 3 merkkiä, salasana min. 4 merkkiä
                        </Text>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 8,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#111827',
    },
    eyeIcon: {
        padding: 4,
    },
    loginButton: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        elevation: 2,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbeafe',
        borderRadius: 8,
        padding: 12,
        marginTop: 24,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#1e40af',
    },
});
