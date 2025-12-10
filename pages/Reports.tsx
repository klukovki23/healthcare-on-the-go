import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import MainLayout from "../components/MainLayout";
import * as MediaLibrary from "expo-media-library";
import { useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { getPatients } from '../utils/patients';
import { getSavedAppointments } from '../utils/session';

type Medicine = {
    name: string;
    barcode: string;
    quantity: number;
};

const initialMedicines: Medicine[] = [
    { name: "Parasetamoli", barcode: "6400012345678", quantity: 0 },
    { name: "Ibuprofeeni", barcode: "6400022345679", quantity: 0 },
    { name: "Amoksisilliini", barcode: "6400032345680", quantity: 0 },
    { name: "Furosemidi", barcode: "6400042345681", quantity: 0 },
    { name: "Metformiini", barcode: "6400052345682", quantity: 0 },
    { name: "Insuliini (kertaruisku)", barcode: "6400062345683", quantity: 0 },
    { name: "Nitroglyseriini", barcode: "6400072345684", quantity: 0 },
    { name: "Prednisoloni", barcode: "6400082345685", quantity: 0 },
    { name: "Oksikodoni", barcode: "6400092345686", quantity: 0 },
    { name: "Salbutamoli (inhalaattori)", barcode: "6400102345687", quantity: 0 },
];

const Reports: React.FC = () => {
    const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [cameraActive, setCameraActive] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [scannerCollapsed, setScannerCollapsed] = useState<boolean>(false);
    const [patientsList, setPatientsList] = useState<any[]>(() => getPatients());
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [patientPickerVisible, setPatientPickerVisible] = useState<boolean>(false);
    const [cameraPermissionStatus, requestCameraPermission] = useCameraPermissions();
    const [mediaPermissionStatus, requestMediaPermission] = MediaLibrary.usePermissions();
    // Use dynamic require to avoid typing/runtime mismatches across expo-camera versions
    const ExpoCamera: any = (() => {
        try {
            return require("expo-camera");
        } catch (e) {
            return null;
        }
    })();

    // Resolve the actual Camera component reliably across different module shapes.
    const resolveCameraComponent = (mod: any) => {
        if (!mod) return null;
        // If the module itself is a component
        if (typeof mod === "function") return mod;
        // If module has Camera export
        if (mod.Camera) {
            if (typeof mod.Camera === "function") return mod.Camera;
            if (mod.Camera.default && typeof mod.Camera.default === "function") return mod.Camera.default;
        }
        // If module has default export
        if (mod.default) {
            if (typeof mod.default === "function") return mod.default;
            if (mod.default.Camera && typeof mod.default.Camera === "function") return mod.default.Camera;
        }
        return null;
    };

    const CameraComponent: any = resolveCameraComponent(ExpoCamera);
    const cameraRef = useRef<any>(null);

    // Some expo-camera versions expose camera type constants on Camera.Constants.Type,
    // but TypeScript typings or runtime builds may not always include that namespace.
    // Compute a safe fallback value at runtime to avoid "Cannot read property 'back' of undefined".
    const BACK_CAMERA_TYPE = ExpoCamera?.Constants?.Type?.back ?? "back";

    // Käynnistä kamera luvan pyynnön jälkeen
    const handleScan = async () => {
        try {
            const cam = await requestCameraPermission();
            const ml = await requestMediaPermission();

            console.log('ExpoCamera module present?', !!ExpoCamera);
            console.log('CameraComponent present?', !!CameraComponent);

            if (!cam.granted) {
                Alert.alert("Virhe", "Kameran käyttö estetty. Salli kamera asetuksista.");
                return;
            }

            // If running in Expo Go, prefer ImagePicker.launchCameraAsync because some dev-client
            // / runtime module shapes may make the native Camera component unavailable.
            const ownership = Constants?.appOwnership ?? (Constants as any)?.manifest?.appOwnership;
            if (ownership === 'expo' || !CameraComponent) {
                // Fallback to ImagePicker camera capture
                const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false, aspect: [4, 3] });
                // Newer expo-image-picker returns { canceled: boolean, assets: [{ uri, ... }] }
                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const uri = result.assets[0].uri;
                    setPhotoUri(uri);
                    if (mediaPermissionStatus?.granted) {
                        await MediaLibrary.createAssetAsync(uri);
                    }
                    const randomBarcode = Math.floor(Math.random() * 1_000_000_000)
                        .toString()
                        .padStart(9, "0");
                    // Add scanned barcode to medicines list so it appears in the summary
                    addScannedMedicine(randomBarcode);
                    setSearchTerm(randomBarcode);
                }
                return;
            }

            setCameraActive(true);
        } catch (e) {
            console.warn("Camera permission error", e);
            Alert.alert("Virhe", "Kameran käyttö epäonnistui: " + String(e));
        }
    };

    // Kuvaus
    const takePicture = async () => {
        if (!cameraRef.current) {
            Alert.alert("Virhe", "Kamera ei ole saatavilla");
            setCameraActive(false);
            return;
        }

        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            const uri = photo.uri;

            if (uri) {
                setPhotoUri(uri);
                if (mediaPermissionStatus?.granted) {
                    await MediaLibrary.createAssetAsync(uri);
                }
                const randomBarcode = Math.floor(Math.random() * 1_000_000_000)
                    .toString()
                    .padStart(9, "0");
                // Add scanned barcode to medicines list so it appears in the summary
                addScannedMedicine(randomBarcode);
                setSearchTerm(randomBarcode);
            }
        } catch (err) {
            console.warn("takePicture error", err);
            Alert.alert("Virhe", "Kuvan ottaminen epäonnistui");
        } finally {
            setCameraActive(false);
        }
    };

    // Insert or increment a scanned medicine by barcode so scanned items are
    // included in the summary with manually added medicines.
    const addScannedMedicine = (barcode: string) => {
        setMedicines((prev) => {
            const idx = prev.findIndex((m) => m.barcode === barcode);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                return next;
            }
            const newMed: Medicine = { name: `${barcode}`, barcode, quantity: 1 };
            return [newMed, ...prev];
        });
    };

    // Helpers to adjust quantities by barcode so the summary (which shows
    // medicines with quantity > 0) can manage scanned items as well.
    const incrementByBarcode = (barcode: string) => {
        setMedicines((prev) => prev.map((m) => (m.barcode === barcode ? { ...m, quantity: m.quantity + 1 } : m)));
    };

    const decrementByBarcode = (barcode: string) => {
        setMedicines((prev) =>
            prev.map((m) => {
                if (m.barcode !== barcode) return m;
                const nextQty = Math.max(0, (m.quantity || 0) - 1);
                return { ...m, quantity: nextQty };
            })
        );
    };

    // Add or increment a medicine by exact name (used when importing patient medications)
    const addMedicineByName = (name: string) => {
        if (!name || !name.trim()) return;
        const normalized = name.trim().toLowerCase();
        setMedicines((prev) => {
            const idx = prev.findIndex((m) => m.name.trim().toLowerCase() === normalized);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                return next;
            }
            const newMed: Medicine = { name: name.trim(), barcode: `med-${Date.now()}`, quantity: 1 };
            return [newMed, ...prev];
        });
    };

    const importPatientMeds = () => {
        if (!selectedPatientId) {
            Alert.alert('Valitse potilas', 'Valitse ensin potilas, jonka lääkkeet haluat tuoda.');
            return;
        }
        const all = getSavedAppointments() || [];
        const meds = all
            .filter((a: any) => String(a.patientId) === String(selectedPatientId) && a.medication)
            .map((a: any) => a.medication)
            .filter(Boolean)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0 && s.toLowerCase() !== 'ei lääkettä');

        if (!meds || meds.length === 0) {
            Alert.alert('Ei lääkkeitä', 'Tälle potilaalle ei löytynyt lääkkeitä aiemmista varauksista.');
            return;
        }

        meds.forEach((m: string) => addMedicineByName(m));

    };

    // Määrän muokkaus
    const handleIncrement = (index: number) => {
        setMedicines((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], quantity: next[index].quantity + 1 };
            return next;
        });
    };

    const handleDecrement = (index: number) => {
        setMedicines((prev) => {
            const next = [...prev];
            if (next[index].quantity > 0) {
                next[index] = { ...next[index], quantity: next[index].quantity - 1 };
            }
            return next;
        });
    };

    const handleSubmit = () => {
        const usedMedicines = medicines.filter((m) => m.quantity > 0);
        if (usedMedicines.length > 0) {
            Alert.alert("Onnistui", "Raportti lähetetty!");
            setMedicines((prev) => prev.map((m) => ({ ...m, quantity: 0 })));
        } else {
            Alert.alert("Virhe", "Lisää vähintään yksi lääke");
        }
    };

    const usedMedicines = medicines.filter((m) => m.quantity > 0);

    const filteredMedicines = searchTerm
        ? medicines.filter(
            (m) =>
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.barcode.includes(searchTerm)
        )
        : medicines;

    const renderMedicine = ({ item, index }: { item: Medicine; index: number }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.barcode}>Viivakoodi: {item.barcode}</Text>
            </View>
            <View style={styles.rowBetween}>
                <Text style={styles.label}>Määrä:</Text>
                <View style={styles.counter}>
                    <TouchableOpacity
                        style={[styles.iconButton, item.quantity === 0 && styles.disabledButton]}
                        onPress={() => handleDecrement(index)}
                        disabled={item.quantity === 0}
                    >
                        <Text style={styles.iconText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleIncrement(index)}>
                        <Text style={styles.iconText}>＋</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <MainLayout>
            <KeyboardAvoidingView
                behavior={Platform.select({ ios: "padding", android: undefined })}
                style={styles.container}
            >
                <View style={styles.inner}>
                    <Text style={styles.heading}>Raportit</Text>

                    {/* Visible toggle for scanner (always shown) */}
                    <TouchableOpacity
                        style={styles.collapseButton}
                        onPress={() => setScannerCollapsed((s) => !s)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.collapseButtonText}>{scannerCollapsed ? 'Näytä skanneri' : 'Piilota skanneri'}</Text>
                    </TouchableOpacity>

                    {/* Patient selector + import button */}
                    <View style={styles.patientSelectorRow}>
                        <TouchableOpacity style={styles.patientSelector} onPress={() => setPatientPickerVisible(true)}>
                            <Text style={styles.patientSelectorLabel}>Potilas</Text>
                            <Text style={styles.patientNameText}>{selectedPatientId ? (patientsList.find((p) => String(p.id) === String(selectedPatientId))?.name ?? 'Tuntematon') : 'Valitse potilas'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.importButton} onPress={importPatientMeds}>
                            <Text style={styles.importButtonText}>Tuo lääkkeet</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Scanner Card (hidden when collapsed) */}
                    {!scannerCollapsed && (
                        <View style={styles.scannerCard}>
                            <View style={styles.scannerBox}>
                                <Text style={styles.scanIcon}>𝄃𝄃𝄂𝄂𝄀𝄁𝄃𝄂𝄂𝄃</Text>
                            </View>
                            <Text style={styles.scanText}>Skannaa lääkkeen viivakoodi</Text>
                            <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
                                <Text style={styles.scanButtonText}>Skannaa</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Patient picker modal (simple in-line list) */}
                    {patientPickerVisible && (
                        <View style={styles.patientPicker}>
                            {patientsList.map((p) => (
                                <TouchableOpacity key={p.id} style={styles.patientPickerItem} onPress={() => { setSelectedPatientId(p.id); setPatientPickerVisible(false); }}>
                                    <Text style={{ fontWeight: '700' }}>{p.name}</Text>
                                    <Text style={{ color: '#6b7280' }}>{p.contact}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={[styles.patientPickerItem, { backgroundColor: '#f3f4f6' }]} onPress={() => setPatientPickerVisible(false)}>
                                <Text style={{ color: '#374151', textAlign: 'center' }}>Peruuta</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {cameraActive && (
                        <View style={styles.cameraOverlay}>
                            {CameraComponent ? (
                                <CameraComponent
                                    style={styles.cameraView}
                                    ref={cameraRef}
                                    type={BACK_CAMERA_TYPE as any}
                                >
                                    <View style={styles.cameraControls}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => setCameraActive(false)}
                                        >
                                            <Text style={{ color: "#fff" }}>Peruuta</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                                            <Text style={{ color: "#fff", fontWeight: "700" }}>OTA</Text>
                                        </TouchableOpacity>
                                    </View>
                                </CameraComponent>
                            ) : (
                                <View style={[styles.cameraView, { alignItems: "center", justifyContent: "center" }]}>
                                    <Text style={{ color: "#fff" }}>Kamera ei ole saatavilla</Text>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setCameraActive(false)}>
                                        <Text style={{ color: "#fff" }}>Sulje</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Search */}
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Hae lääkettä..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        <TouchableOpacity style={styles.scanIconButton} onPress={handleScan}>
                            <Text style={styles.scanIconButtonText}>🔍</Text>
                        </TouchableOpacity>
                    </View>

                    {/* List */}
                    <FlatList
                        data={filteredMedicines}
                        keyExtractor={(_, idx) => String(idx)}
                        renderItem={renderMedicine}
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />

                    {/* Summary of added medicines (distinct visual card) */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryHeader}>Lisätyt lääkkeet</Text>
                        {usedMedicines.length > 0 ? (
                            usedMedicines.map((m) => (
                                <View key={m.barcode} style={styles.summaryItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.summaryName}>{m.name}</Text>
                                        <Text style={styles.summaryBarcode}>{m.barcode}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity
                                            style={[styles.iconButton, m.quantity === 0 && styles.disabledButton]}
                                            onPress={() => decrementByBarcode(m.barcode)}
                                            disabled={m.quantity === 0}
                                        >
                                            <Text style={styles.iconText}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={[styles.quantityText, { marginHorizontal: 8 }]}>{m.quantity}</Text>
                                        <TouchableOpacity style={styles.iconButton} onPress={() => incrementByBarcode(m.barcode)}>
                                            <Text style={styles.iconText}>＋</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: '#6B7280' }}>Ei lisättyjä lääkkeitä</Text>
                        )}
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Lähetä raportti</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </MainLayout>
    );
};

export default Reports;

// Styles (samat kuin alkuperäinen)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F7FA" },
    inner: { padding: 16, flex: 1 },
    heading: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: "#111827" },
    scannerCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
        marginBottom: 8,
        elevation: 2,
    },
    scannerBox: {
        width: 96,
        height: 96,
        borderRadius: 6,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
    },
    scanIcon: { fontSize: 24, lineHeight: 28, color: "#6B7280", textAlign: 'center', letterSpacing: -0.5 },
    scanText: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
    scanButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#0EA5A9",
        borderRadius: 8,
    },
    scanButtonText: { color: "#fff", fontWeight: "600" },
    searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    input: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        elevation: 1,
    },
    scanIconButton: { marginLeft: 8, backgroundColor: "#3b3772ff", borderRadius: 8, padding: 10 },
    scanIconButtonText: { color: "#fff", fontWeight: "600" },
    card: { backgroundColor: "#fff", borderRadius: 10, padding: 12, elevation: 1 },
    cardHeader: { marginBottom: 8 },
    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomColor: '#F3F4F6', borderBottomWidth: 1 },
    summaryName: { fontSize: 15, color: '#111827' },
    summaryQty: { fontSize: 14, color: '#374151', fontWeight: '600' },
    summaryCard: { backgroundColor: '#ecfeff', borderRadius: 10, padding: 12, marginTop: 10, borderLeftWidth: 4, borderLeftColor: '#0ea5a9' },
    summaryHeader: { fontSize: 16, fontWeight: '700', color: '#065f46', marginBottom: 8 },
    summaryBarcode: { fontSize: 12, color: '#374151', fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo', marginTop: 2 },
    patientSelectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    patientSelector: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef9' },
    patientSelectorLabel: { fontSize: 12, color: '#6b7280' },
    patientNameText: { fontSize: 14, color: '#111827', fontWeight: '700' },
    importButton: { marginLeft: 8, backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
    importButtonText: { color: '#fff', fontWeight: '700' },
    patientPicker: { backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 8, elevation: 2 },
    patientPickerItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    collapseButton: { backgroundColor: '#37787aff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
    collapseButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    name: { fontSize: 16, fontWeight: "600", color: "#111827" },
    barcode: { fontSize: 12, color: "#6B7280", fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo', flexShrink: 1 },
    rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    label: { fontSize: 14, color: "#6B7280" },
    counter: { flexDirection: "row", alignItems: "center" },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
    },
    disabledButton: { opacity: 0.4 },
    iconText: { fontSize: 20, fontWeight: "600", color: "#111827" },
    quantityText: { width: 48, textAlign: "center", fontSize: 18, fontWeight: "700" },
    submitButton: { marginTop: 12, backgroundColor: "#0EA5A9", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
    submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cameraOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
    cameraView: { width: "100%", height: "100%" },
    cameraControls: { position: "absolute", bottom: 40, left: 0, right: 0, flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 24 },
    cancelButton: { backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    captureButton: { backgroundColor: "#ef4444", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
});
