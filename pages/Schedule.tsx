import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Appointment {
    id: string;
    time: string;
    patient: string;
}

const Schedule = () => {
    const navigation = useNavigation<any>();

    const [appointments, setAppointments] = useState<Appointment[]>([
        { id: '1', time: '08:00', patient: 'Asiakas 1' },
        { id: '2', time: '08:30', patient: 'Asiakas 2' },
        { id: '3', time: '09:00', patient: 'Asiakas 3' },
        { id: '4', time: '09:30', patient: 'Asiakas 4' },
        { id: '5', time: '10:00', patient: 'Asiakas 5' },
        { id: '6', time: '10:20', patient: 'Asiakas 6' },
        { id: '7', time: '11:00', patient: 'Asiakas 7' },
        { id: '8', time: '11:40', patient: 'Asiakas 2' },
        { id: '9', time: '12:00', patient: 'Asiakas 8' },
        { id: '10', time: '12:40', patient: 'Asiakas 1' },
        { id: '11', time: '14:00', patient: 'Asiakas 9' },
        { id: '12', time: '14:30', patient: 'Asiakas 3' },
        { id: '13', time: '14:50', patient: 'Asiakas 10' },
    ]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTime, setEditTime] = useState('');
    const [editPatient, setEditPatient] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentPatientId, setCurrentPatientId] = useState<string>('1');

    const handleEdit = (appointment: Appointment) => {
        setEditingId(appointment.id);
        setEditTime(appointment.time);
        setEditPatient(appointment.patient);
    };

    const handleSave = () => {
        if (editingId) {
            setAppointments((prev) =>
                prev.map((apt) =>
                    apt.id === editingId
                        ? { ...apt, time: editTime, patient: editPatient }
                        : apt
                )
            );
            Alert.alert('Tallennettu', 'Aikataulu päivitetty');
            setEditingId(null);
        }
    };

    const handleDelete = (id: string) => {
        setAppointments((prev) => prev.filter((apt) => apt.id !== id));
        Alert.alert('Poistettu', 'Varaus poistettu');
    };

    const handlePatientClick = (patientName: string) => {
        if (!isEditMode) {
            navigation.navigate('Patient', { patientName });
        }
    };

    const handleVoiceInput = () => {
        if (!isRecording) {
            setIsRecording(true);
            Alert.alert('Äänitys', 'Äänitys aloitettu...');
            setTimeout(() => {
                setIsRecording(false);
                Alert.alert('Valmis', 'Äänitys valmis');
            }, 2000);
        } else {
            setIsRecording(false);
            Alert.alert('Äänitys pysäytetty');
        }
    };

    const renderItem = ({ item }: { item: Appointment }) => (
        <TouchableOpacity
            style={[
                styles.item,
                currentPatientId === item.id && styles.activeItem,
            ]}
            onPress={() => {
                if (!isEditMode) {
                    setCurrentPatientId(item.id);
                    handlePatientClick(item.patient);
                }
            }}
        >
            <View style={styles.itemLeft}>
                <Text
                    style={[
                        styles.time,
                        currentPatientId === item.id && styles.activeTime,
                    ]}
                >
                    {item.time}
                </Text>
                <Text
                    style={[
                        styles.patient,
                        currentPatientId === item.id && styles.activePatient,
                    ]}
                >
                    {item.patient}
                </Text>
            </View>

            {isEditMode && (
                <View style={styles.itemButtons}>
                    <TouchableOpacity onPress={() => handleEdit(item)}>
                        <Ionicons name="create-outline" size={20} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Aikataulu</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        onPress={handleVoiceInput}
                        style={[
                            styles.iconButton,
                            { backgroundColor: isRecording ? '#ef4444' : '#2563eb' },
                        ]}
                    >
                        <Ionicons name="mic" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsEditMode(!isEditMode)}
                        style={[
                            styles.iconButton,
                            { backgroundColor: isEditMode ? '#6b7280' : '#2563eb' },
                        ]}
                    >
                        <Ionicons name="pencil" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                style={styles.list}
            />

            {/* Edit Modal */}
            <Modal visible={!!editingId} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Muokkaa varausta</Text>

                        <Text style={styles.label}>Aika</Text>
                        <TextInput
                            style={styles.input}
                            value={editTime}
                            onChangeText={setEditTime}
                            placeholder="HH:MM"
                        />

                        <Text style={styles.label}>Asiakas</Text>
                        <TextInput
                            style={styles.input}
                            value={editPatient}
                            onChangeText={setEditPatient}
                            placeholder="Asiakkaan nimi"
                        />

                        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                            <Text style={styles.saveText}>Tallenna</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setEditingId(null)}>
                            <Text style={styles.cancelText}>Peruuta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Schedule;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    headerButtons: { flexDirection: 'row', gap: 8 },
    iconButton: {
        padding: 10,
        borderRadius: 100,
    },
    list: { marginTop: 8 },
    item: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activeItem: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
        backgroundColor: '#e0f2fe',
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    time: { width: 60, fontWeight: 'bold', color: '#374151' },
    patient: { fontSize: 15, color: '#6b7280' },
    activeTime: { color: '#2563eb' },
    activePatient: { color: '#111827' },
    itemButtons: { flexDirection: 'row', gap: 12 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    label: { fontSize: 14, color: '#374151', marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 8,
        marginBottom: 12,
    },
    saveButton: {
        backgroundColor: '#2563eb',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveText: { color: '#fff', fontWeight: 'bold' },
    cancelText: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 8,
    },
});
