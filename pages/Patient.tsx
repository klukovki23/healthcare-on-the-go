import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MainLayout from '../components/MainLayout';


interface Patient {
    id: number;
    name: string;
    contact: string;
    notes: string[];
}

const PatientCard = () => {
    const route = useRoute<any>();
    const [patients] = useState<Patient[]>([
        { id: 1, name: 'Asiakas 1', contact: 'Asiakkaan henkilötiedot ja yhteystiedot', notes: [] },
        { id: 2, name: 'Asiakas 2', contact: 'Asiakkaan henkilötiedot ja yhteystiedot', notes: [] },
        { id: 3, name: 'Asiakas 3', contact: 'Asiakkaan henkilötiedot ja yhteystiedot', notes: [] },
    ]);

    // Potilaan nimi saadaan navigoinnista
    const patientNameFromSchedule = route.params?.patientName;
    const initialIndex = patientNameFromSchedule
        ? patients.findIndex((p) => p.name === patientNameFromSchedule)
        : 0;

    const [currentPatientIndex, setCurrentPatientIndex] = useState(
        initialIndex >= 0 ? initialIndex : 0
    );
    const [isRecording, setIsRecording] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [savedNotes, setSavedNotes] = useState<string[]>([]);
    const currentPatient = patients[currentPatientIndex];

    const handlePrevious = () => {
        setCurrentPatientIndex((prev) =>
            prev > 0 ? prev - 1 : patients.length - 1
        );
    };

    const handleNext = () => {
        setCurrentPatientIndex((prev) =>
            prev < patients.length - 1 ? prev + 1 : 0
        );
    };

    const handleVoiceInput = () => {
        if (!isRecording) {
            setIsRecording(true);
            Alert.alert('Äänitys', 'Äänitys aloitettu...');
            setTimeout(() => {
                setNoteText('Simuloitu äänimuistiinpano tästä potilaasta.');
                setIsRecording(false);
                Alert.alert('Äänitys', 'Äänitys valmis');
            }, 2000);
        } else {
            setIsRecording(false);
            Alert.alert('Äänitys', 'Äänitys pysäytetty');
        }
    };

    const handleSaveNote = () => {
        if (noteText.trim()) {
            setSavedNotes([...savedNotes, noteText]);
            setNoteText('');
            Alert.alert('Tallennettu', 'Muistiinpano tallennettu');
        }
    };

    const handleSOS = () => {
        Alert.alert(
            'Hätäapu',
            'Haluatko soittaa hätäavun paikalle?',
            [
                { text: 'Peruuta', style: 'cancel' },
                {
                    text: 'Soita',
                    onPress: () => {
                        Alert.alert('Hätäapu', 'Hätäpuhelu soitetaan...');
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    return (
        <MainLayout>
            <ScrollView style={styles.container}>
                {/* Header-napit */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerText}>{currentPatient.name}</Text>

                    <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* SOS-painike */}
                <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                    <Ionicons name="call" size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.sosText}>SOS</Text>
                </TouchableOpacity>

                {/* Potilastiedot */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Asiakkaan tiedot</Text>
                    <Text style={styles.cardText}>{currentPatient.contact}</Text>
                </View>

                {/* Päivän toimenpiteet */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Päivän toimenpiteet</Text>
                    <Text style={styles.cardText}>Ei toimenpiteitä tälle päivälle</Text>
                </View>

                {/* AI-yhteenveto */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>AI Yhteenveto</Text>
                    <Text style={styles.cardText}>Sairaudet: lääkitykset...</Text>
                </View>

                {/* Muistiinpanot */}
                <View style={styles.card}>
                    <View style={styles.noteHeader}>
                        <Text style={styles.cardTitle}>Omat muistiinpanot</Text>
                        <TouchableOpacity
                            style={[
                                styles.micButton,
                                isRecording ? styles.micActive : styles.micInactive,
                            ]}
                            onPress={handleVoiceInput}
                        >
                            <Ionicons name="mic" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.textarea}
                        placeholder="Kirjoita muistiinpanot tänne..."
                        multiline
                        value={noteText}
                        onChangeText={setNoteText}
                    />

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            !noteText.trim() && styles.saveButtonDisabled,
                        ]}
                        onPress={handleSaveNote}
                        disabled={!noteText.trim()}
                    >
                        <Text style={styles.saveText}>Tallenna muistiinpano</Text>
                    </TouchableOpacity>

                    {savedNotes.length > 0 && (
                        <View style={styles.notesList}>
                            <Text style={styles.savedTitle}>Tallennetut muistiinpanot:</Text>
                            {savedNotes.map((note, index) => (
                                <View key={index} style={styles.savedNote}>
                                    <Text style={styles.savedText}>{note}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </MainLayout>
    );
};

export default PatientCard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        borderRadius: 50,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    navButton: {
        backgroundColor: '#1e40af',
        padding: 8,
        borderRadius: 50,
    },
    headerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    sosButton: {
        flexDirection: 'row',
        backgroundColor: '#dc2626',
        borderRadius: 50,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 3,
    },
    sosText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#111827',
    },
    cardText: {
        color: '#4b5563',
        fontSize: 14,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    micButton: {
        padding: 10,
        borderRadius: 50,
    },
    micInactive: {
        backgroundColor: '#2563eb',
    },
    micActive: {
        backgroundColor: '#dc2626',
    },
    textarea: {
        minHeight: 100,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        marginTop: 8,
        marginBottom: 12,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
    },
    notesList: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginTop: 12,
        paddingTop: 8,
    },
    savedTitle: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    savedNote: {
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        padding: 8,
        marginBottom: 6,
    },
    savedText: {
        fontSize: 14,
        color: '#374151',
    },
});
