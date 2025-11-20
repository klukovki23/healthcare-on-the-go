import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import MainLayout from '../components/MainLayout';

type Medicine = {
    name: string;
    barcode: string;
    quantity: number;
};

const initialMedicines: Medicine[] = [
    { name: "Lääke A", barcode: "1234567890", quantity: 0 },
    { name: "Lääke B", barcode: "0987654321", quantity: 0 },
];

const Reports: React.FC = () => {
    const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isScanning, setIsScanning] = useState<boolean>(false);

    const handleScan = () => {
        setIsScanning(true);
        Alert.alert("Info", "Viivakoodi skannaus...");
        setTimeout(() => {
            const randomBarcode = Math.floor(Math.random() * 1_000_000_000)
                .toString()
                .padStart(9, "0");
            setSearchTerm(randomBarcode);
            setIsScanning(false);
            Alert.alert("Onnistui", "Viivakoodi skannattu!");
        }, 1500);
    };

    const handleIncrement = (index: number) => {
        setMedicines((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], quantity: next[index].quantity + 1 };
            Alert.alert("Päivitetty", `${next[index].name}: ${next[index].quantity} kpl`);
            return next;
        });
    };

    const handleDecrement = (index: number) => {
        setMedicines((prev) => {
            const next = [...prev];
            if (next[index].quantity > 0) {
                next[index] = { ...next[index], quantity: next[index].quantity - 1 };
                Alert.alert("Päivitetty", `${next[index].name}: ${next[index].quantity} kpl`);
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

                    {/* Scanner Card */}
                    <View style={styles.scannerCard}>
                        <View style={styles.scannerBox}>
                            {isScanning ? (
                                <ActivityIndicator size="large" />
                            ) : (
                                <Text style={styles.scanIcon}>📷</Text>
                            )}
                        </View>
                        <Text style={styles.scanText}>Skannaa lääkkeen viivakoodi</Text>
                        <TouchableOpacity style={styles.scanButton} onPress={handleScan} disabled={isScanning}>
                            <Text style={styles.scanButtonText}>{isScanning ? "Skannataan..." : "Skannaa"}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Hae lääkettä..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        <TouchableOpacity style={styles.scanIconButton} onPress={handleScan} disabled={isScanning}>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F7FA" },
    inner: { padding: 16, flex: 1 },
    heading: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: "#111827" },

    scannerCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        marginBottom: 12,
        elevation: 2,
    },
    scannerBox: {
        width: 140,
        height: 140,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    scanIcon: { fontSize: 40, color: "#6B7280" },
    scanText: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
    scanButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
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
    scanIconButton: {
        marginLeft: 8,
        backgroundColor: "#111827",
        borderRadius: 8,
        padding: 10,
    },
    scanIconButtonText: { color: "#fff", fontWeight: "600" },

    card: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 12,
        elevation: 1,
    },
    cardHeader: { marginBottom: 8 },
    name: { fontSize: 16, fontWeight: "600", color: "#111827" },
    barcode: { fontSize: 13, color: "#6B7280" },

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

    submitButton: {
        marginTop: 12,
        backgroundColor: "#0EA5A9",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
