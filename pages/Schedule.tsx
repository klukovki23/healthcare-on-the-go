import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    Image,
    Animated,
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
    visitNotes?: string; // short description of what will happen during the visit
    medication?: string; // medication name (if any)
    dosage?: string; // dosage or instructions (if any)
}

const Schedule = () => {
    const navigation = useNavigation<any>();

    const PRESET_VISITS = [
        'Suonen sisäiset hoidot',
        'Katetri- ja kanyylitoimenpiteet',
        'Haavanhoito',
        'Hengityshoito',
        'Syöpähoito',
        'Tutkimukset ja seuranta',
        'Saattohoito',
    ];

    const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', time: '08:00', patient: 'Eero Räsänen', address: 'Kirkonkyläntie 9, Helsinki', visitNotes: 'Syöpähoito', medication: 'Cisplatin', dosage: '70 mg/m² i.v.' },
    { id: '2', time: '08:30', patient: 'Sari Lehtinen', address: 'Koulutie 8, Helsinki', visitNotes: 'Saattohoito', medication: 'Morphine', dosage: '5 mg s.c. PRN' },
    { id: '3', time: '09:00', patient: 'Anna Virtanen', address: 'Keskuskatu 1, Helsinki', visitNotes: 'Tutkimukset ja seuranta', medication: 'Paracetamol', dosage: '500 mg p.o.' },
    { id: '4', time: '09:30', patient: 'Mikko Korhonen', address: 'Rantatie 5, Helsinki', visitNotes: 'Haavanhoito', medication: 'Paikallinen antiseptinen', dosage: 'Levitä tarvittaessa' },
    { id: '5', time: '10:00', patient: 'Laura Nieminen', address: 'Puistotie 12, Helsinki', visitNotes: 'Fysioterapia', medication: 'Ei lääkettä', dosage: '' },
    { id: '6', time: '10:30', patient: 'Jussi Mäkinen', address: 'Asemakatu 3, Helsinki', visitNotes: 'Suonen sisäiset hoidot', medication: 'Influenssarokote', dosage: '0.5 ml i.m.' },
    { id: '7', time: '11:00', patient: 'Pekka Salmi', address: 'Raitatie 22, Helsinki', visitNotes: 'Haavanhoito', medication: 'Hydrokortisonivoide', dosage: 'Levitä ohuelti' },
    { id: '8', time: '11:40', patient: 'Tiina Koskinen', address: 'Torikatu 7, Helsinki', visitNotes: 'Tutkimukset ja seuranta', medication: 'Ei lääkettä', dosage: '' },
    { id: '9', time: '12:00', patient: 'Mikko Korhonen', address: 'Rantatie 5, Helsinki', visitNotes: 'Tutkimukset ja seuranta', medication: 'Insuliini', dosage: 'Katso potilastiedot' },
    { id: '10', time: '12:40', patient: 'Oona Laakso', address: 'Kivitie 15, Helsinki', visitNotes: 'Hengityshoito', medication: 'Salbutamol-inhalaattori', dosage: '2 puffia PRN' },
    { id: '11', time: '13:30', patient: 'Anna Virtanen', address: 'Keskuskatu 1, Helsinki', visitNotes: 'Haavanhoito', medication: 'Ei lääkettä', dosage: '' },
    { id: '12', time: '14:00', patient: 'Ville Hämäläinen', address: 'Satamatie 4, Helsinki', visitNotes: 'Tutkimukset ja seuranta', medication: 'Ei lääkettä', dosage: '' },
    { id: '13', time: '14:30', patient: 'Laura Nieminen', address: 'Puistotie 12, Helsinki', visitNotes: 'Rokotukset', medication: 'Tetanusrokote', dosage: '0.5 ml i.m.' },
    { id: '14', time: '14:50', patient: 'Eero Räsänen', address: 'Kirkonkyläntie 9, Helsinki', visitNotes: 'Lääkkeiden jako', medication: 'Amoxicillin', dosage: '500 mg p.o. TID' },
]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTime, setEditTime] = useState('');
    const [editPatient, setEditPatient] = useState('');
    const [editVisitNotes, setEditVisitNotes] = useState('');
    const [editMedication, setEditMedication] = useState('');
    const [editDosage, setEditDosage] = useState('');
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentPatientId, setCurrentPatientId] = useState<string>('1');

    // Map image handling: try local asset, fall back to remote placeholder. Compute intrinsic size and scale down but never scale up.
    const [mapImgSource, setMapImgSource] = useState<any>(null);
    const [intrinsicSize, setIntrinsicSize] = useState<{ width: number; height: number } | null>(null);
    const [mapDisplaySize, setMapDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [headerHeight, setHeaderHeight] = useState<number>(48);
    // Toast/snackbar state + animation
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastAnim = useRef(new Animated.Value(0)).current;
    const toastTimerRef = useRef<any>(null);
    const [recentlyDeleted, setRecentlyDeleted] = useState<{ item: Appointment; index: number } | null>(null);

    const showToast = (msg: string) => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
            toastTimerRef.current = null;
        }
        setToastMessage(msg);
        setToastVisible(true);
        Animated.timing(toastAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start(() => {
            toastTimerRef.current = setTimeout(() => {
                Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
                    setToastVisible(false);
                    setRecentlyDeleted(null);
                });
            }, 2200);
        });
    };

    const hideToastImmediately = () => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
            toastTimerRef.current = null;
        }
        Animated.timing(toastAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
            setToastVisible(false);
            setRecentlyDeleted(null);
        });
    };

    const undoDelete = () => {
        if (!recentlyDeleted) return;
        setAppointments((prev) => {
            const next = [...prev];
            // clamp index
            const idx = Math.min(Math.max(0, recentlyDeleted.index), next.length);
            next.splice(idx, 0, recentlyDeleted.item);
            return next;
        });
        setRecentlyDeleted(null);
        hideToastImmediately();
    };

    React.useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        // Try to require local asset. If it fails (rare), use a remote placeholder.
        try {
            const local = require('../assets/map.png');
            const src = Image.resolveAssetSource(local);
            setMapImgSource(local);
            setIntrinsicSize({ width: src.width || 800, height: src.height || 600 });
        } catch (e) {
            const uri = 'https://via.placeholder.com/800x600.png?text=Map+Preview';
            setMapImgSource({ uri });
            Image.getSize(uri, (w, h) => setIntrinsicSize({ width: w, height: h }), () => setIntrinsicSize({ width: 800, height: 600 }));
        }
    }, []);

    const handleEdit = (appointment: Appointment) => {
        setEditingId(appointment.id);
        setEditTime(appointment.time);
        setEditPatient(appointment.patient);
        setEditVisitNotes(appointment.visitNotes || '');
        setEditMedication(appointment.medication || '');
        setEditDosage(appointment.dosage || '');
    };

    const handleSave = () => {
        if (editingId) {
            setAppointments((prev) =>
                prev.map((apt) =>
                    apt.id === editingId
                        ? { ...apt, time: editTime, patient: editPatient, visitNotes: editVisitNotes, medication: editMedication, dosage: editDosage }
                        : apt
                )
            );
            Alert.alert('Tallennettu', 'Aikataulu päivitetty');
            setEditingId(null);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Vahvista poisto',
            'Oletko varma, että haluat poistaa varauksen?',
            [
                { text: 'Ei', style: 'cancel' },
                {
                    text: 'Kyllä',
                    onPress: () => {
                        setAppointments((prev) => {
                            const idx = prev.findIndex((a) => a.id === id);
                            if (idx === -1) return prev;
                            const deleted = prev[idx];
                            const next = prev.filter((apt) => apt.id !== id);
                            // store recently deleted so undo can restore
                            setRecentlyDeleted({ item: deleted, index: idx });
                            return next;
                        });
                        showToast('Varaus poistettu');
                    },
                },
            ],
            { cancelable: true }
        );
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

    const renderVisitInfo = (appt: Appointment) => {
        return (
            <View style={{ flexDirection: 'column' }}>
                {appt.visitNotes ? (
                    <Text style={styles.visitNotes} numberOfLines={1} ellipsizeMode="tail">{appt.visitNotes}</Text>
                ) : null}
                {appt.medication ? (
                    <Text style={styles.medication} numberOfLines={1} ellipsizeMode="tail">{appt.medication}{appt.dosage ? ` — ${appt.dosage}` : ''}</Text>
                ) : null}
            </View>
        );
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
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.patient, currentPatientId === item.id && styles.activePatient]}>
                            {item.patient}
                        </Text>
                        <Text style={styles.address}>{item.address}</Text>
                        {renderVisitInfo(item)}
                    </View>
                </View>
            </View>
            {isEditMode && (
                <View style={styles.itemButtons}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginLeft: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="create-outline" size={20} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                    <TouchableOpacity onLongPress={drag} style={styles.dragHandle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="menu" size={24} color="#2563eb" />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
    const openMap = () => setIsMapOpen(true);
    const closeMap = () => setIsMapOpen(false);

    return (
        <MainLayout>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Aikataulu</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            onPress={openMap}
                            style={[
                                styles.iconButton,
                                { backgroundColor: '#2563eb' },
                            ]}
                        >
                            <Ionicons name="map" size={20} color="#fff" />
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

                {/* Toast / snackbar rendered under header */}
                <Animated.View
                    pointerEvents="auto"
                    style={[
                        styles.toast,
                        {
                            opacity: toastAnim,
                            transform: [
                                {
                                    translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
                                },
                            ],
                        },
                    ]}
                >
                    {toastVisible ? (
                        <View style={styles.toastInner}>
                            <Text style={styles.toastText}>{toastMessage}</Text>
                            {recentlyDeleted ? (
                                <TouchableOpacity onPress={undoDelete} style={styles.toastAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Text style={styles.toastActionText}>Kumoa</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ) : null}
                </Animated.View>

                {/* List */}
                <DraggableFlatList
                    data={appointments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    style={styles.list}
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

                            <Text style={styles.label}>Vierailun tyyppi (pika-valinta)</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                                            {PRESET_VISITS.map((p) => (
                                                <TouchableOpacity
                                                    key={p}
                                                    style={[styles.chip, editVisitNotes === p && styles.chipActive]}
                                                    onPress={() => setEditVisitNotes(p)}
                                                >
                                                    <Text style={[styles.chipText, editVisitNotes === p && styles.chipTextActive]}>{p}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>

                            <Text style={styles.label}>Lisätieto / kuvaus</Text>
                            <TextInput
                                style={styles.input}
                                value={editVisitNotes}
                                onChangeText={setEditVisitNotes}
                                placeholder="Mitä tehdään (vapaa teksti)"
                            />

                            <Text style={styles.label}>Lääke</Text>
                            <TextInput
                                style={styles.input}
                                value={editMedication}
                                onChangeText={setEditMedication}
                                placeholder="Lääke (esim. Paracetamol)"
                            />

                            <Text style={styles.label}>Annostus / ohjeet</Text>
                            <TextInput
                                style={styles.input}
                                value={editDosage}
                                onChangeText={setEditDosage}
                                placeholder="Annostus tai ohjeet"
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

                {/* Map Modal (image placeholder) */}
                <Modal visible={isMapOpen} transparent animationType="fade">
                    <View style={styles.mapOverlay}>
                        <View style={styles.mapContainer}>
                            <View
                                style={styles.mapImageWrapper}
                                onLayout={(e) => {
                                    const { width: wrapW, height: wrapH } = e.nativeEvent.layout;
                                    if (!intrinsicSize) return;
                                    const imgW = intrinsicSize.width || wrapW;
                                    const imgH = intrinsicSize.height || wrapH;
                                    // subtract header height so the image doesn't overlap or push the header out
                                    const availableH = Math.max(0, wrapH - headerHeight);
                                    // allow a modest upscale but never huge
                                    const maxUpscale = 1.15;
                                    const scale = Math.min(maxUpscale, wrapW / imgW, availableH / imgH);
                                    setMapDisplaySize({ width: Math.round(imgW * scale), height: Math.round(imgH * scale) });
                                }}
                            >
                                <View style={styles.mapHeader} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
                                    <Text style={styles.mapTitle}>Kartta</Text>
                                    <TouchableOpacity style={styles.mapClose} onPress={closeMap}>
                                        <Text style={styles.mapCloseText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                {mapImgSource ? (
                                    <Image source={mapImgSource} style={[styles.mapImage, { width: mapDisplaySize.width, height: mapDisplaySize.height }]} />
                                ) : null}
                            </View>
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
    headerButtons: { flexDirection: 'row' },
    iconButton: {
        padding: 10,
        borderRadius: 100,
        marginRight: 8,
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
        alignItems: 'center',
        justifyContent: 'center',
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
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    time: { width: 60, fontWeight: 'bold', color: '#374151' },
    patient: { fontSize: 15, color: '#111827', fontWeight: 'bold' },
    address: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    serviceLabel: { fontSize: 13, color: '#64748b', marginRight: 6, fontStyle: 'italic' },
    activeTime: { color: '#2563eb' },
    activePatient: { color: '#111827' },
    itemButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginLeft: 8,
        width: 110,
        flexShrink: 0,
    },
    visitNotes: { fontSize: 13, color: '#374151', marginTop: 6 },
    medication: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
    },
    chipActive: { backgroundColor: '#2563eb' },
    chipText: { fontSize: 12, color: '#0f172a' },
    chipTextActive: { color: '#fff' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    
    mapImage: { borderRadius: 8, alignSelf: 'center' },
    mapHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e6eef9' },
    mapTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    mapImageWrapper: { width: '100%', height: 420, padding: 0, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    mapContainer: { width: '96%', backgroundColor: 'transparent', borderRadius: 12, padding: 0, alignItems: 'center', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
    mapClose: { padding: 6 },
    mapCloseText: { fontSize: 20, color: '#111827' },
    
    toast: { position: 'relative', alignSelf: 'center', backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginTop: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 6 },
    toastText: { color: '#fff', fontWeight: '600' },
    toastInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    toastAction: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
    toastActionText: { color: '#fff', fontWeight: '700' },
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

