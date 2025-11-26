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
import { Linking } from 'react-native';
import MainLayout from '../components/MainLayout';
import { getSavedAppointment, getSavedAppointments } from '../utils/session';


interface Patient {
    id: string | number;
    name: string;
    contact: string;
    notes?: string[];
}

const PatientCard = () => {
    const route = useRoute<any>();
    // Expecting navigation params from Schedule: `patient` and `appointments`
    // If the screen was unmounted and remounted without params, fall back
    // to the in-memory session store so we keep showing the correct patient.
    const initialPassedAppointment = route.params?.patient ?? getSavedAppointment();
    const initialPassedAppointments: any[] | undefined = route.params?.appointments ?? getSavedAppointments();

    // Persist params in component state so they survive navigation away/back
    const [savedAppointment, setSavedAppointment] = useState<any | undefined>(initialPassedAppointment);
    const [savedAppointments, setSavedAppointments] = useState<any[] | undefined>(initialPassedAppointments);

    const [patients, setPatients] = useState<Patient[]>(
        savedAppointments ? savedAppointments.map((a) => ({ id: a.id, name: a.patient, contact: a.address })) : []
    );

    const [currentPatientIndex, setCurrentPatientIndex] = useState<number>(0);

    // Update saved params if new params arrive (e.g. on first mount)
    useEffect(() => {
        if (route.params?.appointments) setSavedAppointments(route.params.appointments);
        if (route.params?.patient) setSavedAppointment(route.params.patient);
    }, [route.params]);

    // Rebuild patient list and set index when savedAppointments or savedAppointment change
    useEffect(() => {
        if (savedAppointments) {
            const newPatients = savedAppointments.map((a) => ({ id: a.id, name: a.patient, contact: a.address }));
            setPatients(newPatients);
            if (savedAppointment) {
                const idx = newPatients.findIndex((p) => String(p.id) === String(savedAppointment.id));
                setCurrentPatientIndex(idx >= 0 ? idx : 0);
            } else {
                setCurrentPatientIndex(0);
            }
        }
    }, [savedAppointments, savedAppointment]);
    const [isRecording, setIsRecording] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [savedNotes, setSavedNotes] = useState<string[]>([]);
    const currentPatient = patients.length
        ? patients[currentPatientIndex]
        : (savedAppointment ? { id: savedAppointment.id, name: savedAppointment.patient, contact: savedAppointment.address } : { id: 0, name: 'Tuntematon', contact: 'Ei lisätietoja' });

    const handlePrevious = () => {
        if (patients.length) {
            setCurrentPatientIndex((prev) => (prev > 0 ? prev - 1 : patients.length - 1));
        }
    };

    const handleNext = () => {
        if (patients.length) {
            setCurrentPatientIndex((prev) => (prev < patients.length - 1 ? prev + 1 : 0));
        }
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

    const coordinatorName = 'Maria Korhonen';
    const coordinatorPhoneNumber = '0501234567';
    const coordinatorPhoneDisplay = '050 123 4567';

    const handleSOS = () => {
        Alert.alert(
            'Hätäapu',
            `Soitetaanko ${coordinatorName}, ${coordinatorPhoneDisplay}?`,
            [
                { text: 'Peruuta', style: 'cancel' },
                {
                    text: 'Soita',
                    onPress: () => {
                        // Try to open the phone dialer
                        const tel = `tel:${coordinatorPhoneNumber}`;
                        Linking.canOpenURL(tel).then((supported) => {
                            if (supported) {
                                Linking.openURL(tel);
                            } else {
                                Alert.alert('Virhe', 'Puhelinsoittoa ei voida aloittaa tällä laitteella.');
                            }
                        });
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

                {/* Tilaa apua -ikoni ja teksti yhdistettynä yhdeksi napiksi; teksti saa vaaleamman taustan */}
                <View style={styles.sosContainer}>
                    <TouchableOpacity
                        style={styles.sosCombined}
                        onPress={handleSOS}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityRole="button"
                    >
                        <View style={styles.sosIconButton}>
                            <Ionicons name="call" size={20} color="#fff" />
                        </View>
                        <Text style={styles.sosLabelCombined}>Tilaa apua</Text>
                    </TouchableOpacity>
                </View>

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
        borderRadius: 30,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 3,
    },
    sosText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    sosRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sosContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    sosCombined: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e49191ff',
        borderRadius: 15,
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    sosIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosLabel: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        alignSelf: 'center',
    },
    sosLabelCombined: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        alignSelf: 'center',
    },
    coordinatorInfo: {
        marginLeft: 12,
    },
    coordinatorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    coordinatorPhone: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
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
