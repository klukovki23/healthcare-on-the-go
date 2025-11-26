import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MainLayout from '../components/MainLayout';
import { setSavedAppointment, setSavedAppointments } from '../utils/session';

interface Appointment {
    id: string;
    time: string;
    patient: string;
    address: string;
    serviceType: 'medication' | 'woundCare' | 'physiotherapy' | 'injection' | string;
}

const Schedule = () => {
    const navigation = useNavigation<any>();

    const [appointments, setAppointments] = useState<Appointment[]>([
        { id: '1', time: '08:00', patient: 'Anna Virtanen', address: 'Keskuskatu 1, Helsinki', serviceType: 'medication' },
        { id: '2', time: '08:30', patient: 'Mikko Korhonen', address: 'Rantatie 5, Espoo', serviceType: 'woundCare' },
        { id: '3', time: '09:00', patient: 'Laura Nieminen', address: 'Puistotie 12, Vantaa', serviceType: 'physiotherapy' },
        { id: '4', time: '09:30', patient: 'Jussi Mäkinen', address: 'Asemakatu 3, Helsinki', serviceType: 'injection' },
        { id: '5', time: '10:00', patient: 'Sari Lehtinen', address: 'Koulutie 8, Espoo', serviceType: 'medication' },
        { id: '6', time: '10:20', patient: 'Pekka Salmi', address: 'Raitatie 22, Vantaa', serviceType: 'woundCare' },
        { id: '7', time: '11:00', patient: 'Tiina Koskinen', address: 'Torikatu 7, Helsinki', serviceType: 'physiotherapy' },
        { id: '8', time: '11:40', patient: 'Mikko Korhonen', address: 'Rantatie 5, Espoo', serviceType: 'injection' },
        { id: '9', time: '12:00', patient: 'Oona Laakso', address: 'Kivitie 15, Vantaa', serviceType: 'medication' },
        { id: '10', time: '12:40', patient: 'Anna Virtanen', address: 'Keskuskatu 1, Helsinki', serviceType: 'woundCare' },
        { id: '11', time: '14:00', patient: 'Ville Hämäläinen', address: 'Satamatie 4, Espoo', serviceType: 'physiotherapy' },
        { id: '12', time: '14:30', patient: 'Laura Nieminen', address: 'Puistotie 12, Vantaa', serviceType: 'other' },
        { id: '13', time: '14:50', patient: 'Eero Räsänen', address: 'Kirkonkyläntie 9, Helsinki', serviceType: 'medication' },
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

    const handlePatientClick = (appointment: Appointment) => {
        if (!isEditMode) {
            // Persist selection in session so Patient can restore if unmounted
            setSavedAppointment(appointment);
            setSavedAppointments(appointments);
            // Pass the selected appointment and the whole appointments list
            navigation.navigate('Patient', { patient: appointment, appointments });
        }
    };

    const getServiceIconOrLabel = (serviceType: Appointment['serviceType']) => {
        switch (serviceType) {
            case 'medication':
                return <Ionicons name="medkit" size={20} color="#2563eb" style={{ marginRight: 6 }} />;
            case 'woundCare':
                return <Ionicons name="bandage" size={20} color="#10b981" style={{ marginRight: 6 }} />;
            case 'physiotherapy':
                return <Ionicons name="walk" size={20} color="#f59e42" style={{ marginRight: 6 }} />;
            case 'injection':
                return <Ionicons name="fitness" size={20} color="#ef4444" style={{ marginRight: 6, transform: [{ rotate: '45deg' }] }} />;
            default:
                return <Text style={styles.serviceLabel}>{serviceType}</Text>;
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Appointment>) => (
        <TouchableOpacity
            style={[styles.item, currentPatientId === item.id && styles.activeItem, isActive && styles.activeDragItem]}
            onPress={() => {
                if (!isEditMode) {
                    setCurrentPatientId(item.id);
                    handlePatientClick(item);
                }
            }}
        >
            <View style={styles.itemLeft}>
                <Text style={[styles.time, currentPatientId === item.id && styles.activeTime]}>
                    {item.time}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {getServiceIconOrLabel(item.serviceType)}
                    <View>
                        <Text style={[styles.patient, currentPatientId === item.id && styles.activePatient]}>
                            {item.patient}
                        </Text>
                        <Text style={styles.address}>{item.address}</Text>
                    </View>
                </View>
            </View>
            {isEditMode && (
                <View style={styles.itemButtons}>
                    <TouchableOpacity onPress={() => handleEdit(item)}>
                        <Ionicons name="create-outline" size={20} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                    <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
                        <Ionicons name="menu" size={24} color="#2563eb" />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
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

    return (
        <MainLayout>
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
                <DraggableFlatList
                    data={appointments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    style={styles.list}
                    // Ensure the last item can scroll up above the bottom spacer
                    contentContainerStyle={{ paddingBottom: 90 }}
                    onDragEnd={({ data, from, to }) => {
                        // Swap times between moved item and its new position
                        const newData = [...data];
                        if (from !== to) {
                            const tempTime = newData[to].time;
                            newData[to].time = newData[from].time;
                            newData[from].time = tempTime;
                        }
                        setAppointments(newData);
                    }}
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
        </MainLayout>
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
    dragHandle: {
        padding: 6,
        marginLeft: 4,
        borderRadius: 6,
        backgroundColor: '#e0e7ef',
    },
    activeDragItem: {
        opacity: 0.7,
        backgroundColor: '#dbeafe',
    },
    activeItem: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
        backgroundColor: '#e0f2fe',
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    time: { width: 60, fontWeight: 'bold', color: '#374151' },
    patient: { fontSize: 15, color: '#111827', fontWeight: 'bold' },
    address: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    serviceLabel: { fontSize: 13, color: '#64748b', marginRight: 6, fontStyle: 'italic' },
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

