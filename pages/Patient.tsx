import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MainLayout from '../components/MainLayout';
import { getSavedAppointment, getSavedAppointments, setSavedAppointment as setSessionAppointment, setSavedAppointments as setSessionAppointments, getPatientNotes, setPatientNotes, addPersonalWorkspaceNote, setDemoCooldownUntil, setGlobalToastMessage } from '../utils/session';
import { getPatients, getPatientById, setPatient as setPatientEntity, setPatients as setPatientsStore } from '../utils/patients';
export const PATIENT_SUMMARIES: { [id: string]: string } = {
    'p-1': "Lääkitys: Cisplatin 70 mg/m² i.v., Amoxicillin 500 mg p.o. TID. Eero Räsänen, 33-vuotias mies, jolla on diagnosoitu keuhkosyöpä. Hänelle annetaan syöpähoitoa kemoterapiana. Lisäksi lääkkeiden jako ja seuranta kotioloissa. Hoitoon liittyy säännöllinen veriarvojen tarkkailu ja mahdollisten haittavaikutusten seuranta.",
    'p-2': "Lääkitys: Morphine 5 mg s.c. PRN. Sari Lehtinen, 43-vuotias, saattohoidossa. Hänellä on diagnosoitu edennyt maksasyöpä, ja hoito keskittyy kivunhallintaan ja elämänlaadun ylläpitämiseen. Kotikäynnit sisältävät lääkityksen tarkistusta ja oireiden lievitystä.",
    'p-3': "Lääkitys: Paracetamol 500 mg p.o. Anna Virtanen, 53-vuotias, jolla on lievä nivelrikko ja ihottumaa. Hän käy tutkimuksissa ja seurannassa, ja tarvittaessa haavanhoitoon liittyvä tuki kotona. Painopiste on oireiden hallinnassa ja yleisen terveydentilan ylläpidossa.",
    'p-4': "Lääkitys: Paikallinen antiseptinen tarvittaessa, Insuliini (katso potilastiedot). Mikko Korhonen, 63-vuotias, jolla on krooninen haava jalassa ja tyypin 2 diabetes. Hänelle tehdään säännöllistä haavanhoitoa sekä insuliinin annostuksen tarkistusta. Seuranta keskittyy haavan paranemiseen ja verensokerin hallintaan.",
    'p-5': "Lääkitys: Ei lääkettä, Tetanusrokote 0.5 ml i.m. Laura Nieminen, 73-vuotias, jolla on polvien nivelrikko ja lievä osteoporoosi. Hän käy fysioterapiassa ja saa tarvittaessa rokotuksia. Hoidon tavoitteena on toimintakyvyn ylläpitäminen ja kipujen vähentäminen.",
    'p-6': "Lääkitys: Influenssarokote 0.5 ml i.m. Jussi Mäkinen, 83-vuotias, jolla on lievä kognitiivinen heikentyminen ja suonen sisäiset hoidot. Hänelle annetaan rokotuksia ja seurataan verenkierron toimintaa sekä yleistä terveydentilaa kotikäynneillä.",
    'p-7': "Lääkitys: Hydrokortisonivoide ohuelti levitettynä. Pekka Salmi, 93-vuotias, jolla on krooninen haava käsivarressa. Hoitoon kuuluu haavan säännöllinen tarkistus ja kotihoito-ohjeistus, jotta paraneminen etenee mahdollisimman hyvin.",
    'p-8': "Lääkitys: Ei lääkettä. Tiina Koskinen, 103-vuotias, jolla ei ole merkittäviä kroonisia sairauksia, mutta ikään liittyvää kuulon ja näön heikkenemistä. Hän käy säännöllisesti tutkimuksissa ja seurannassa kotona yleisen terveydentilan tarkistamiseksi.",
    'p-9': "Lääkitys: Salbutamol-inhalaattori 2 puffia PRN. Oona Laakso, 23-vuotias, jolla on astma. Hänelle annetaan hengityshoitoa tarvittaessa ja säännöllistä seurantaa kotona hengityksen hallinnan ylläpitämiseksi.",
    'p-10': "Lääkitys: Ei lääkettä. Ville Hämäläinen, 33-vuotias, jolla on aiempia urheiluvammoja, mukaan lukien polven eturistisidevamma ja toistuvat nilkan nyrjähdykset. Hän käy tutkimuksissa ja seurannassa, ja hoito keskittyy kuntoutukseen ja vammojen ehkäisyyn.",
};
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface Patient {
    id: string | number;
    name: string;
    contact: string;
    notes?: string[];
    henkilotunnus?: string;
}

const Patient = () => {
    const route = useRoute<any>();
    // New navigation params: `patientId` and `appointmentId` (Schedule passes these)
    // Fall back to session store when params are missing.
    const appointmentIdParam = route.params?.appointmentId;
    const patientIdParam = route.params?.patientId;

    const initialPassedAppointments: any[] | undefined = route.params?.appointments ?? getSavedAppointments();

    const [savedAppointment, setSavedAppointment] = useState<any | undefined>(() => {
        const sessionApp = getSavedAppointment();
        if (appointmentIdParam) return (initialPassedAppointments || []).find((a) => String(a.id) === String(appointmentIdParam)) ?? sessionApp;
        return route.params?.appointment ?? sessionApp;
    });

    const [savedAppointments, setSavedAppointments] = useState<any[] | undefined>(initialPassedAppointments);

    // Local patients array: prefer authoritative patients store when available
    const [patients, setPatients] = useState<Patient[]>(() => {
        const store = getPatients();
        if (store) return store;
        return (initialPassedAppointments || []).map((a) => ({ id: a.patientId ?? a.id, name: a.patient ?? '', contact: a.address ?? '' }));
    });

    const [currentPatientIndex, setCurrentPatientIndex] = useState<number>(0);

    // Sync route params -> local state on param changes
    useEffect(() => {
        const all = route.params?.appointments ?? getSavedAppointments();
        if (all) setSavedAppointments(all);

        let appt: any | undefined = undefined;
        if (route.params?.appointmentId) {
            appt = (all || []).find((a) => String(a.id) === String(route.params.appointmentId));
        }
        // If no explicit appointmentId, try to find appointment by patientId (useful when navigation only provides patientId)
        if (!appt && (route.params?.patientId || patientIdParam)) {
            const pid = route.params?.patientId ?? patientIdParam;
            appt = (all || []).find((a) => String(a.patientId) === String(pid));
        }

        if (!appt) appt = route.params?.appointment ?? getSavedAppointment();
        if (appt) setSavedAppointment(appt);

        // Load patients from store if present, else build from appointments
        const store = getPatients();
        if (store) {
            setPatients(store);
        } else if (all) {
            const built = all.map((a) => ({ id: a.patientId ?? a.id, name: a.patient ?? '', contact: a.address ?? '' }));
            setPatients(built);
            setPatientsStore(built);
        }
    }, [route.params]);

    // Recompute current patient index when patients or savedAppointment change
    useEffect(() => {
        if (patients && patients.length) {
            // Prefer explicit patientId params, then appointment.patientId, then appointment.id
            const pid = patientIdParam ?? savedAppointment?.patientId ?? savedAppointment?.id;
            const idx = patients.findIndex((p) => String(p.id) === String(pid));
            setCurrentPatientIndex(idx >= 0 ? idx : 0);
        } else {
            setCurrentPatientIndex(0);
        }
    }, [patients, savedAppointment, patientIdParam]);
    const [isRecording, setIsRecording] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [savedNotes, setSavedNotes] = useState<string[]>([]);
    const [movedMessage, setMovedMessage] = useState<string>('');
    const movedTimerRef = useRef<any>(null);
    const [movedFlag, setMovedFlag] = useState<boolean>(false);
    const [showNameEditor, setShowNameEditor] = useState<boolean>(false);
    const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
    const [addressInput, setAddressInput] = useState<string>('');
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [detailsText, setDetailsText] = useState<string>('');

    const HELP_KEYWORDS = [
        'Sairaskohtaus',
        'Tajuton potilas',
        'Vainaja',
        'Itseen kohdistuva uhka',
        'Puuttuva väline',
        'Muu syy',
    ];

    const toggleKeyword = (k: string) => {
        setSelectedKeywords((prev) => {
            if (prev.includes(k)) return prev.filter((x) => x !== k);
            return [...prev, k];
        });
    };

    const handleCancelHelp = () => {
        setShowHelpModal(false);
        setSelectedKeywords([]);
        setDetailsText('');
        setAddressInput(currentPatient?.contact || '');
    };

    const handleSendHelp = () => {
        // For now, don't create a schedule entry. Just close the modal and confirm sending.
        setShowHelpModal(false);
        // Reset inputs
        setSelectedKeywords([]);
        setDetailsText('');
    };
    // Editable fields for patient info
    const [nameInput, setNameInput] = useState<string>('');
    const [contactInput, setContactInput] = useState<string>('');
    const [pvVisitNotes, setPvVisitNotes] = useState<string>('');
    const [pvMedication, setPvMedication] = useState<string>('');
    const [pvDosage, setPvDosage] = useState<string>('');
    const [henkilotunnusInput, setHenkilotunnusInput] = useState<string>('');
    const currentPatient = patients && patients.length
        ? patients[currentPatientIndex]
        : (savedAppointment ? { id: savedAppointment.patientId ?? savedAppointment.id, name: savedAppointment.patient ?? 'Tuntematon', contact: savedAppointment.address ?? 'Ei lisätietoja', henkilotunnus: savedAppointment.henkilotunnus ?? '' } : { id: 0, name: 'Tuntematon', contact: 'Ei lisätietoja', henkilotunnus: '' });

    // Populate inputs when currentPatient or savedAppointment change
    useEffect(() => {
        if (currentPatient) {
            setNameInput(currentPatient.name || '');
            setContactInput(currentPatient.contact || '');
            setHenkilotunnusInput(currentPatient.henkilotunnus || '');
            // load per-patient notes from session
            try {
                const pid = currentPatient?.id ?? (savedAppointment ? savedAppointment.patientId ?? savedAppointment.id : undefined);
                const notes = pid ? getPatientNotes(pid) || [] : [];
                setSavedNotes(notes);
                setNoteText(notes && notes.length ? notes[0] : '');
            } catch (e) {
                setSavedNotes([]);
            }
        } else if (savedAppointment) {
            setNameInput(savedAppointment.patient || '');
            setContactInput(savedAppointment.address || '');
        }
        if (savedAppointment) {
            setPvVisitNotes(savedAppointment.visitNotes || '');
            setPvMedication(savedAppointment.medication || '');
            setPvDosage(savedAppointment.dosage || '');
        }
    }, [currentPatient, savedAppointment]);

    useEffect(() => {
        return () => {
            if (movedTimerRef.current) clearTimeout(movedTimerRef.current);
        };
    }, []);

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

    const handleVoiceInput = async () => {
        if (!isRecording) {
            const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!granted) {
                Alert.alert('Virhe', 'Puheentunnistus vaatii luvat.');
                return;
            }
            // mark as edited (not moved) and persist immediately
            setMovedFlag(false);
            // persist the current note text before clearing it for recording
            persistCurrentNote(noteText);

            setIsRecording(true);
            setNoteText('');

            ExpoSpeechRecognitionModule.start({
                lang: 'fi-FI',
                interimResults: false,
                continuous: false,
            });
        } else {
            ExpoSpeechRecognitionModule.stop();
            setIsRecording(false);
        }
    };

    // Listen to speech recognition results
    useSpeechRecognitionEvent('result', (event) => {
        const text = event.results[0]?.transcript ?? '';
        setNoteText(text);
    });

    useSpeechRecognitionEvent('end', () => {
        setIsRecording(false);

    });

    useSpeechRecognitionEvent('error', (event) => {
        console.log('SpeechRecognition error:', event);
        setIsRecording(false);
        Alert.alert('Virhe', 'Puheentunnistuksessa tapahtui virhe');
    });

    const handleMoveToWorkspace = () => {
        const t = (noteText || '').trim();
        if (!t) return;
        try {
            addPersonalWorkspaceNote(t);
            // Keep the editor text visible but mark it as moved (greyed out)
            setMovedFlag(true);
            // Show inline confirmation message
            setMovedMessage('Siirretty paikalliseen järjestelmään');
            if (movedTimerRef.current) clearTimeout(movedTimerRef.current);
            movedTimerRef.current = setTimeout(() => setMovedMessage(''), 2500);
        } catch (e) {
            // ignore failures silently
        }
    };

    const persistCurrentNote = (text: string) => {
        // store active note at index 0
        const nextSaved = savedNotes && savedNotes.length ? [...savedNotes] : [''];
        nextSaved[0] = text;
        setSavedNotes(nextSaved);
        // Notes are personal (for the clinician's own reporting) and should remain local.
        // Persist per-patient notes in the in-memory session so notes don't mix between patients.
        try {
            const pid = patientIdParam ?? savedAppointment?.patientId ?? savedAppointment?.id ?? currentPatient?.id;
            if (!pid) return;
            setPatientNotes(pid, nextSaved);
        } catch (e) {
            // non-fatal
        }
    };

    const handleSOS = () => {
        // Open help clarification modal instead of directly creating a schedule entry
        setShowHelpModal(true);
    };

    const navigation = useNavigation<any>();

    const handleCompleteVisit = () => {
        if (!savedAppointment) return;
        try {
            const all = getSavedAppointments() || savedAppointments || [];
            // Remove the completed appointment from the schedule
            const updatedAll = (all || []).filter((a: any) => String(a.id) !== String(savedAppointment.id));
            // persist updates
            setSessionAppointments(updatedAll);
            // start 2-minute cooldown so a new demo notification appears after completion
            try { setDemoCooldownUntil(Date.now() + 2 * 60 * 1000); } catch (e) { }
            // set transient message so Schedule can show animated confirmation on focus
            try { setGlobalToastMessage('Hätätehtävä kuitattu'); } catch (e) { }
            // clear the single-saved appointment selection
            try { setSessionAppointment(undefined); } catch (e) { }
            // update local state
            setSavedAppointment(undefined);
            setSavedAppointments(updatedAll);
        } catch (e) {
            // ignore persistence failures
        }
        // return to schedule view
        try { navigation.navigate('Schedule'); } catch (e) { /* ignore */ }
    };

    const handleSavePatient = () => {
        if (!savedAppointment) {
            Alert.alert('Virhe', 'Ei tallennettavaa potilasta');
            return;
        }

        const updated: any = {
            ...savedAppointment,
            patient: nameInput,
            address: contactInput,
            visitNotes: pvVisitNotes,
            medication: pvMedication,
            dosage: pvDosage,
        };

        // Update session appointments list
        const all = getSavedAppointments() || savedAppointments || [];
        const updatedAll = all.map((a: any) => (String(a.id) === String(updated.id) ? updated : a));
        setSessionAppointments(updatedAll);
        setSessionAppointment(updated);

        // Update local state so UI refreshes
        setSavedAppointment(updated);
        setSavedAppointments(updatedAll);

        // Also persist the authoritative patient entity (patient-centric model)
        const patientId = patientIdParam ?? savedAppointment.patientId ?? savedAppointment.id;
        const patientEntity = { id: patientId, name: nameInput, contact: contactInput, henkilotunnus: currentPatient?.henkilotunnus ?? '' };
        try {
            setPatientEntity(patientEntity);
            // keep local store in sync
            const existing = getPatients() || [];
            const replaced = existing.filter((p: any) => String(p.id) !== String(patientEntity.id));
            const nextPatients = [patientEntity, ...replaced];
            setPatients(nextPatients as any);
            setPatientsStore(nextPatients as any);
        } catch (e) {
            // non-fatal
        }

        Alert.alert('Tallennettu', 'Potilastiedot päivitetty');
    };

    const handleSavePatientInfo = () => {
        // Only persist patient-level fields (patient-centric model)
        const patientId = patientIdParam ?? savedAppointment?.patientId ?? savedAppointment?.id ?? currentPatient?.id;
        if (!patientId) {
            Alert.alert('Virhe', 'Potilaan tunnusta ei löydy');
            return;
        }

        const patientEntity: any = {
            id: patientId,
            name: nameInput,
            contact: contactInput,
            henkilotunnus: henkilotunnusInput,
        };

        try {
            // Persist to patients store
            setPatientEntity(patientEntity);
            const existing = getPatients() || [];
            const replaced = existing.filter((p: any) => String(p.id) !== String(patientEntity.id));
            const nextPatients = [patientEntity, ...replaced];
            setPatients(nextPatients as any);
            setPatientsStore(nextPatients as any);

            // Also update any saved appointments that carry embedded patient/address fields
            const all = getSavedAppointments() || savedAppointments || [];
            const updatedAll = all.map((a: any) => {
                if (String(a.patientId ?? a.id) === String(patientEntity.id)) {
                    return { ...a, patient: patientEntity.name, address: patientEntity.contact, henkilotunnus: patientEntity.henkilotunnus };
                }
                return a;
            });
            setSessionAppointments(updatedAll);

            // Update currently loaded appointment in session if applicable
            if (savedAppointment) {
                const updatedSaved = { ...savedAppointment };
                if (String(updatedSaved.patientId ?? updatedSaved.id) === String(patientEntity.id)) {
                    updatedSaved.patient = patientEntity.name;
                    updatedSaved.address = patientEntity.contact;
                    updatedSaved.henkilotunnus = patientEntity.henkilotunnus;
                    setSessionAppointment(updatedSaved);
                    setSavedAppointment(updatedSaved);
                }
                setSavedAppointments(updatedAll);
            }

            setShowNameEditor(false);
        } catch (e) {
            Alert.alert('Virhe', 'Tallenuksessa tapahtui virhe');
        }
    };

    return (
        <MainLayout>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 88 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header-napit */}
                <View style={styles.header}>
                    <Text style={styles.title}>{currentPatient.name}</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity onPress={() => setShowNameEditor((s) => !s)} style={[styles.iconButton, { backgroundColor: showNameEditor ? '#6b7280' : '#2563eb' }]} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                            <Ionicons name="pencil" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.headerInfoRow}>
                    <Text style={styles.henkilotunnus}>{currentPatient.henkilotunnus ?? ''}</Text>
                    <Text style={styles.headerContact} numberOfLines={1} ellipsizeMode="tail">{currentPatient.contact}</Text>
                </View>

                {/* (Removed large 'Tilaa apua' button - now available as small 'Pyydä apua' in header) */}

                {/* Potilastiedot editor (modal) */}
                <Modal visible={showNameEditor} transparent animationType="slide" onRequestClose={() => setShowNameEditor(false)}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 60} style={{ flex: 1, width: '100%' }}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                                <View style={styles.modalCard}>
                                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
                                        <Text style={styles.cardTitle}>Muokkaa potilastietoja</Text>
                                        <Text style={styles.cardLabel}>Nimi</Text>
                                        <TextInput style={styles.input} value={nameInput} onChangeText={setNameInput} placeholder="Nimi" />
                                        <Text style={[styles.cardLabel, { marginTop: 8 }]}>Henkilötunnus</Text>
                                        <TextInput style={styles.input} value={henkilotunnusInput} onChangeText={setHenkilotunnusInput} placeholder="Henkilötunnus" />
                                        <Text style={[styles.cardLabel, { marginTop: 8 }]}>Osoite</Text>
                                        <TextInput style={styles.input} value={contactInput} onChangeText={setContactInput} placeholder="Osoite" />

                                        <TouchableOpacity onPress={handleSavePatientInfo} style={[styles.saveButton, { marginTop: 12 }]}>
                                            <Text style={styles.saveText}>Tallenna</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => setShowNameEditor(false)} style={styles.modalButtonFull}>
                                            <Text style={styles.modalCancelText}>Peruuta</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                {/* Päivän toimenpiteet (read-only) */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Päivän toimenpiteet</Text>
                    {savedAppointment && Array.isArray((savedAppointment as any).keywords) && (savedAppointment as any).keywords.length ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                            {((savedAppointment as any).keywords as string[]).map((k) => (
                                <View key={k} style={styles.keywordChip}>
                                    <Text style={styles.keywordText}>{k}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                    <Text style={styles.cardText}>{pvVisitNotes || 'Ei toimenpiteitä tällä hetkellä'}</Text>
                    {pvMedication ? <Text style={[styles.cardText, { marginTop: 8 }]}>{pvMedication}{pvDosage ? ` — ${pvDosage}` : ''}</Text> : null}
                </View>

                {/* Potilashistorian yhteenveto */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Potilashistorian yhteenveto</Text>
                    <Text style={styles.cardText}>{PATIENT_SUMMARIES[String(currentPatient.id)] ?? 'Ei yhteenvetoa saatavilla.'}</Text>
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
                        style={[
                            styles.textarea,
                            movedFlag ? { color: '#6b7280' } : { color: '#111827' },
                        ]}
                        placeholder="Puhu ja kirjoita muistiinpanot tänne..."
                        placeholderTextColor="#9ca3af"
                        multiline
                        value={noteText}
                        onChangeText={(t) => { setNoteText(t); setMovedFlag(false); persistCurrentNote(t); }}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={handleMoveToWorkspace}
                            style={styles.moveButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.75}
                            accessibilityLabel="Siirrä muistiinpano"
                            accessibilityRole="button"
                        >
                            <Text style={[styles.moveButtonText, { marginRight: 8 }]}>Siirrä</Text>
                            <Ionicons name="arrow-forward" size={16} color="#2563eb" />
                        </TouchableOpacity>
                    </View>

                    {movedMessage ? <Text style={styles.movedMessage}>{movedMessage}</Text> : null}
                    {/* Saved notes list removed — notes are only visible/edited in the editor */}
                </View>

                {/* Action button: show 'Kuittaa käynti' for accepted help slots, otherwise 'Hälyytä apua' */}
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                    {savedAppointment && String(savedAppointment.id).startsWith('h-accepted-') && !((savedAppointment as any).completed) ? (
                        <TouchableOpacity style={styles.completeButton} onPress={handleCompleteVisit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={styles.completeButtonText}>Kuittaa käynti</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.helpButton} onPress={handleSOS} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="call" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.helpButtonText}>Hälytä apua</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Help clarification modal (address, keywords, details) */}
                <Modal visible={showHelpModal} transparent animationType="slide" onRequestClose={handleCancelHelp}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 60} style={{ flex: 1, width: '100%' }}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                                <View style={styles.modalCard}>
                                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
                                        <Text style={styles.cardTitle}>Lisätiedot avunpyynnölle</Text>

                                        <Text style={styles.cardLabel}>Osoite</Text>
                                        <TextInput value={addressInput || currentPatient?.contact || ''} onChangeText={setAddressInput} style={styles.addressInput} placeholder="Osoite" />

                                        <Text style={[styles.cardLabel, { marginTop: 10 }]}>Syy (valitse yksi tai useampi)</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keywordScroll}>
                                            {HELP_KEYWORDS.map((k) => {
                                                const selected = selectedKeywords.includes(k);
                                                return (
                                                    <TouchableOpacity key={k} onPress={() => toggleKeyword(k)} style={[styles.keywordChip, selected ? styles.keywordChipSelected : null]}>
                                                        <Text style={selected ? styles.keywordTextSelected : styles.keywordText}>{k}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>

                                        <Text style={[styles.cardLabel, { marginTop: 12 }]}>Lisätiedot</Text>
                                        <TextInput value={detailsText} onChangeText={setDetailsText} style={styles.detailsTextarea} placeholder="Kerro lisätietoja..." multiline />

                                        <View style={[styles.modalActions, { marginTop: 12 }]}>
                                            <TouchableOpacity onPress={handleCancelHelp} style={[styles.modalButtonRow, { flex: 1, marginRight: 8 }]}>
                                                <Text style={styles.cancelText}>Peruuta</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleSendHelp} style={[styles.sendButton, { minWidth: 120 }]}>
                                                <Text style={styles.sendText}>Lähetä</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
            </ScrollView>
        </MainLayout>
    );
};

export default Patient;


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
        marginBottom: 12,
        paddingHorizontal: 0,
    },
    headerOuter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    headerBox: {
        flex: 1,
        backgroundColor: '#2563eb',
        borderRadius: 50,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    headerButtons: { flexDirection: 'row' },
    iconButton: {
        padding: 10,
        borderRadius: 100,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sideNavButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    infoBox: {
        display: 'none',
    },
    infoTitle: { color: '#111827', fontSize: 18, fontWeight: '700' },
    infoText: { color: '#6b7280', marginTop: 6 },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 12,
    },
    headerSubText: {
        color: '#dbeafe',
        fontSize: 12,
        marginTop: 4,
    },
    editNameButton: {
        marginTop: 6,
    },
    editNameText: {
        color: '#bfdbfe',
        fontSize: 12,
    },
    headerInfoRow: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    henkilotunnus: { color: '#6b7280', fontSize: 13, marginBottom: 4 },
    headerContact: { color: '#6b7280', fontSize: 13 },
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
    sosMini: {
        // deprecated: using iconButton for SOS now
        display: 'none',
    },
    sosMiniText: {
        display: 'none',
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
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e5e7eb',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
    },
    cancelText: {
        color: '#374151',
        fontWeight: '600',
    },
    cancelButtonModal: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        alignSelf: 'stretch',
        width: '100%',
        marginTop: 12,
    },
    moveButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
    },
    moveButtonText: {
        color: '#2563eb',
        fontWeight: '700',
    },
    movedMessage: {
        color: '#10b981',
        marginTop: 8,
        textAlign: 'right',
        fontWeight: '600',
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dc2626',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 180,
        justifyContent: 'center',
    },
    helpButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 720,
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        elevation: 6,
    },
    modalButtonRow: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonFull: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginTop: 12,
    },
    modalCancelText: {
        color: '#374151',
        fontWeight: '600',
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 12,
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
    cardLabel: { fontSize: 13, color: '#374151', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 8,
        backgroundColor: '#fff',
    },
    addressInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 8,
        backgroundColor: '#fff',
    },
    keywordRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    keywordScroll: {
        paddingVertical: 6,
        paddingRight: 12,
        alignItems: 'center',
    },
    keywordChip: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    keywordChipSelected: {
        backgroundColor: '#fee2e2',
        borderColor: '#fca5a5',
    },
    keywordText: {
        color: '#374151',
        fontSize: 13,
    },
    keywordTextSelected: {
        color: '#991b1b',
        fontSize: 13,
    },
    detailsTextarea: {
        minHeight: 80,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        marginTop: 6,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    sendButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
    },
    sendText: {
        color: '#fff',
        fontWeight: '700',
    },
    completeButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});

