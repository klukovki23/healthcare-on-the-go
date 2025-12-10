import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    Image,
    Animated,
    Modal,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MainLayout from '../components/MainLayout';
import { setSavedAppointment, setSavedAppointments, getSavedAppointments, getSavedAppointment, getHelpRequests, removeHelpRequest, addHelpRequest, updateHelpRequestStatus, getDemoCooldownUntil, setDemoCooldownUntil, getGlobalToastMessage, setGlobalToastMessage } from '../utils/session';
import { getPatients, setPatients, getPatientById } from '../utils/patients';

interface Appointment {
    id: string;
    time: string;
    patientId: string; // reference to patient entity
    visitNotes?: string; // short description of what will happen during the visit
    medication?: string; // medication name (if any)
    dosage?: string; // dosage or instructions (if any)
    completed?: boolean; // whether the visit has been completed (kuitattu)
    keywords?: string[];
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

    // Use patients store for authoritative patient data. Patients store provides initial seed.
    const existingPatients = getPatients();
    const initialPatients = existingPatients || [];

    // Initial appointments reference patient IDs from patients store.
    // Times are set hourly starting at 08:00 to simplify daily view.
    const INITIAL_APPOINTMENTS: Appointment[] = [
        { id: '1', time: '08:00', patientId: 'p-1', visitNotes: 'Syöpähoito', medication: 'Cisplatin', dosage: '70 mg/m² i.v.' },
        { id: '2', time: '09:00', patientId: 'p-2', visitNotes: 'Saattohoito', medication: 'Morphine', dosage: '5 mg s.c. PRN' },
        { id: '3', time: '10:00', patientId: 'p-3', visitNotes: 'Tutkimukset ja seuranta', medication: 'Paracetamol', dosage: '500 mg p.o.' },
        { id: '4', time: '11:00', patientId: 'p-4', visitNotes: 'Haavanhoito', medication: 'Paikallinen antiseptinen', dosage: 'Levitä tarvittaessa' },
        { id: '5', time: '12:00', patientId: 'p-5', visitNotes: 'Fysioterapia', medication: 'Ei lääkettä', dosage: '' },
        { id: '6', time: '13:00', patientId: 'p-6', visitNotes: 'Suonen sisäiset hoidot', medication: 'Influenssarokote', dosage: '0.5 ml i.m.' },
        { id: '7', time: '14:00', patientId: 'p-7', visitNotes: 'Haavanhoito', medication: 'Hydrokortisonivoide', dosage: 'Levitä ohuelti' },
        { id: '8', time: '15:00', patientId: 'p-8', visitNotes: 'Tutkimukset ja seuranta', medication: 'Ei lääkettä', dosage: '' },
        { id: '9', time: '16:00', patientId: 'p-4', visitNotes: 'Tutkimukset ja seuranta', medication: 'Insuliini', dosage: 'Katso potilastiedot' },
        { id: '10', time: '17:00', patientId: 'p-9', visitNotes: 'Hengityshoito', medication: 'Salbutamol-inhalaattori', dosage: '2 puffia PRN' },
        { id: '11', time: '18:00', patientId: 'p-3', visitNotes: 'Haavanhoito', medication: 'Ei lääkettä', dosage: '' },
        { id: '12', time: '19:00', patientId: 'p-10', visitNotes: 'Tutkimukset ja seuranta', medication: 'Ei lääkettä', dosage: '' },
        { id: '13', time: '20:00', patientId: 'p-5', visitNotes: 'Rokotukset', medication: 'Tetanusrokote', dosage: '0.5 ml i.m.' },
        { id: '14', time: '21:00', patientId: 'p-1', visitNotes: 'Lääkkeiden jako', medication: 'Amoxicillin', dosage: '500 mg p.o. TID' },
    ];

    let initialAppointments: Appointment[] = [];
    const storedAppointments = getSavedAppointments();
    if (storedAppointments && storedAppointments.length) {
        initialAppointments = storedAppointments as Appointment[];
    } else {
        initialAppointments = INITIAL_APPOINTMENTS;
        setSavedAppointments(initialAppointments as any);
    }

    const [patientsState, setPatientsState] = useState<any[]>(initialPatients || []);
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTime, setEditTime] = useState('');
    const [editPatient, setEditPatient] = useState('');
    const [editVisitNotes, setEditVisitNotes] = useState('');
    const [editMedication, setEditMedication] = useState('');
    const [editDosage, setEditDosage] = useState('');
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [mapFocusPatientAddress, setMapFocusPatientAddress] = useState<string | undefined>(undefined);
    const [isEditMode, setIsEditMode] = useState(false);
    // `autoHighlightedId` is the appointment id determined by schedule/time (the visual highlight).
    // `selectedAppointmentId` is the user-selected appointment (navigations, edits) and should not override the automatic highlight.
    const [autoHighlightedId, setAutoHighlightedId] = useState<string>(initialAppointments && initialAppointments.length ? String(initialAppointments[0].id) : '1');
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(() => {
        const sa = getSavedAppointment();
        return sa ? String(sa.id) : null;
    });
    const [helpRequests, setHelpRequests] = useState<any[]>(() => getHelpRequests() || []);
    const [mapFocusPatientName, setMapFocusPatientName] = useState<string | undefined>(undefined);
    const [demoDisabled, setDemoDisabled] = useState(false);

    // Highlight logic: automatically highlight the appointment whose effective start has passed.
    // Effective start = scheduled time - 20 minutes. We update every 30 seconds.
    React.useEffect(() => {
        let timer: any = null;

        const parseTimeToToday = (timeStr: string) => {
            const [hh, mm] = timeStr.split(':').map((s) => parseInt(s, 10));
            const d = new Date();
            d.setHours(hh, mm, 0, 0);
            return d;
        };

        const updateHighlight = () => {
            if (!appointments || appointments.length === 0) return;
            // Sort appointments by time ascending (in case order changes)
            const sorted = [...appointments].sort((a, b) => {
                const at = parseTimeToToday(a.time).getTime();
                const bt = parseTimeToToday(b.time).getTime();
                return at - bt;
            });

            const now = new Date();
            let selectedId = sorted[0].id;

            for (const appt of sorted) {
                const start = parseTimeToToday(appt.time);
                const effective = new Date(start.getTime() - 20 * 60 * 1000);
                if (now >= effective) {
                    selectedId = appt.id;
                } else {
                    // since sorted ascending, no later appointments will match either
                    break;
                }
            }

            if (!isEditMode) setAutoHighlightedId(selectedId);
        };

        // initial run
        updateHighlight();
        timer = setInterval(updateHighlight, 30 * 1000);
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [appointments, isEditMode]);

    // Compute highlighted patient's name for display in the map header
    const getPatientNameForId = (pid: string | undefined | null) => {
        if (!pid) return undefined;
        // first try local patients state
        const pLocal = patientsState.find((p) => String(p.id) === String(pid));
        if (pLocal && pLocal.name) return pLocal.name;
        // fall back to authoritative store helper
        try {
            const pStore = getPatientById ? getPatientById(pid) : null;
            if (pStore && pStore.name) return pStore.name;
        } catch (e) {
            // ignore
        }
        return undefined;
    };

    const getPatientAddressForId = (pid: string | undefined | null) => {
        if (!pid) return undefined;
        const pLocal = patientsState.find((p) => String(p.id) === String(pid));
        if (pLocal && pLocal.contact) return pLocal.contact;
        try {
            const pStore = getPatientById ? getPatientById(pid) : null;
            if (pStore && pStore.contact) return pStore.contact;
        } catch (e) {
            // ignore
        }
        return undefined;
    };

    const highlightedAppointment = appointments.find((a) => String(a.id) === String(autoHighlightedId));
    const highlightedPatientName = getPatientNameForId(highlightedAppointment ? highlightedAppointment.patientId : undefined);
    const highlightedPatientAddress = getPatientAddressForId(highlightedAppointment ? highlightedAppointment.patientId : undefined);
    // treat demo or any accepted help slot as an active help notification for map and badge purposes
    const hasHelpNotification = (appointments || []).some((a) => String(a.id) === 'h-demo' || String(a.id).startsWith('h-accepted-')) || (helpRequests && helpRequests.length > 0);

    // Map image handling: try local asset, fall back to remote placeholder. Compute intrinsic size and scale down but never scale up.
    const [mapImgSource, setMapImgSource] = useState<any>(null);
    const [alertImgSource, setAlertImgSource] = useState<any>(null);
    const [intrinsicSize, setIntrinsicSize] = useState<{ width: number; height: number } | null>(null);
    const [alertIntrinsicSize, setAlertIntrinsicSize] = useState<{ width: number; height: number } | null>(null);
    const [mapDisplaySize, setMapDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [headerHeight, setHeaderHeight] = useState<number>(48);
    // Toast/snackbar state + animation
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastAnim = useRef(new Animated.Value(0)).current;
    const toastTimerRef = useRef<any>(null);
    const [recentlyDeleted, setRecentlyDeleted] = useState<{ item: Appointment; index: number } | null>(null);
    const listRef = useRef<any>(null);

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
            setSavedAppointments(next as any);
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

    // Sync help requests from session periodically (simple polling for demo)
    React.useEffect(() => {
        const sync = () => setHelpRequests(getHelpRequests() || []);
        sync();
        const id = setInterval(sync, 2000);
        return () => clearInterval(id);
    }, []);

    // Demo: insert a demo patient + a help-notification appointment row above the current highlighted appointment
    // Demo scheduling and insertion logic driven by a cooldown timestamp in session.
    React.useEffect(() => {
        let timer: any = null;
        const scheduleTimer = () => {
            // If there is already a demo or an accepted slot, do nothing (no new notifications)
            const hasDemo = appointments.some((a) => String(a.id) === 'h-demo');
            const hasAccepted = appointments.some((a) => String(a.id).startsWith('h-accepted-'));
            if (hasDemo || hasAccepted) return;

            const cooldown = getDemoCooldownUntil();
            const now = Date.now();
            if (!cooldown) {
                // No cooldown set: set initial 1-minute timer on fresh app open
                const t = now + 60 * 1000;
                try { setDemoCooldownUntil(t); } catch (e) { }
                timer = setTimeout(tryInsertDemo, 60 * 1000);
            } else if (cooldown <= now) {
                // cooldown already reached: insert immediately
                tryInsertDemo();
            } else {
                // schedule for remaining time
                timer = setTimeout(tryInsertDemo, cooldown - now);
            }
        };

        const tryInsertDemo = () => {
            const hasDemoNow = appointments.some((a) => String(a.id) === 'h-demo');
            const hasAcceptedNow = appointments.some((a) => String(a.id).startsWith('h-accepted-'));
            if (hasDemoNow || hasAcceptedNow) {
                // Nothing to do while an active notification exists
                try { setDemoCooldownUntil(null); } catch (e) { }
                return;
            }

            // ensure demo patient exists in store and state
            const demoPatientId = 'p-demo';
            const existingDemoLocal = patientsState.find((p) => String(p.id) === demoPatientId);
            const existingDemoStore = (() => {
                try { return getPatientById ? getPatientById(demoPatientId) : null; } catch (e) { return null; }
            })();

            if (!existingDemoLocal && !existingDemoStore) {
                const demoPatient = {
                    id: demoPatientId,
                    name: 'Tero Mäkinen',
                    contact: 'Mannerheimintie 10, Helsinki',
                    notes: 'Demo-potilas apupyynnön esittelyä varten',
                } as any;
                try { setPatients([...(getPatients() || []), demoPatient]); } catch (e) { /* ignore */ }
                setPatientsState((prev) => [...prev, demoPatient]);
            }

            // find insertion index: above current highlighted appointment
            const idx = appointments.findIndex((a) => String(a.id) === String(autoHighlightedId));
            const insertAt = idx >= 0 ? idx : 0;
            const timeForRow = appointments[insertAt] ? appointments[insertAt].time : new Date().toTimeString().slice(0, 5);

            const demoAppt: Appointment = {
                id: 'h-demo',
                time: timeForRow,
                patientId: demoPatientId,
                visitNotes: 'Apupyyntö — tarvitsee apua',
                medication: undefined,
                dosage: undefined,
            };

            setAppointments((prev) => {
                const next = [...prev];
                next.splice(insertAt, 0, demoAppt);
                try { setSavedAppointments(next as any); } catch (e) { }
                return next;
            });

            // Clear cooldown (no further notifications while this demo exists)
            try { setDemoCooldownUntil(null); } catch (e) { }
        };

        scheduleTimer();

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [appointments, autoHighlightedId, patientsState]);

    // When the automatic highlight changes, scroll it to the top of the list
    React.useEffect(() => {
        if (!listRef.current || isEditMode) return;
        // prefer to scroll to live help notification or accepted help slot when present
        let targetId = autoHighlightedId;
        if (appointments.find((a) => String(a.id) === 'h-demo')) {
            targetId = 'h-demo';
        } else {
            const accepted = appointments.find((a) => String(a.id).startsWith('h-accepted-'));
            if (accepted) targetId = accepted.id;
        }

        const idx = appointments.findIndex((a) => String(a.id) === String(targetId));
        if (idx >= 0 && typeof listRef.current.scrollToIndex === 'function') {
            // small delay to allow layout to stabilize
            setTimeout(() => {
                try { listRef.current.scrollToIndex({ index: idx, viewPosition: 0 }); } catch (e) { /* ignore */ }
            }, 80);
        }
    }, [autoHighlightedId, appointments, isEditMode]);

    React.useEffect(() => {
        // Try to require local assets. If it fails (rare), use remote placeholder for map only.
        try {
            const localMap = require('../assets/map.png');
            const srcMap = Image.resolveAssetSource(localMap);
            setMapImgSource(localMap);
            setIntrinsicSize({ width: srcMap.width || 800, height: srcMap.height || 600 });
        } catch (e) {
            const uri = 'https://via.placeholder.com/800x600.png?text=Map+Preview';
            setMapImgSource({ uri });
            Image.getSize(uri, (w, h) => setIntrinsicSize({ width: w, height: h }), () => setIntrinsicSize({ width: 800, height: 600 }));
        }

        try {
            // require local alert asset (relative to this file)
            const alertImg = require('../assets/image2.jpg');
            const srcAlert = Image.resolveAssetSource(alertImg);
            console.log('Loaded local alert image', srcAlert);
            setAlertImgSource(alertImg);
            setAlertIntrinsicSize({ width: srcAlert.width || 800, height: srcAlert.height || 600 });
        } catch (e) {
            console.warn('Local alert image not found or failed to load:', e);
            // fallback to a remote placeholder so the map can still render something
            const uri = 'https://via.placeholder.com/800x600.png?text=Alert+Image';
            setAlertImgSource({ uri });
            Image.getSize(uri, (w, h) => setAlertIntrinsicSize({ width: w, height: h }), () => setAlertIntrinsicSize({ width: 800, height: 600 }));
        }
    }, []);

    const handleEdit = (appointment: Appointment) => {
        setEditingId(appointment.id);
        setEditTime(appointment.time);
        const p = patientsState.find((x) => String(x.id) === String(appointment.patientId));
        setEditPatient(p ? p.name : '');
        setEditVisitNotes(appointment.visitNotes || '');
        setEditMedication(appointment.medication || '');
        setEditDosage(appointment.dosage || '');
    };

    // When returning from Patient screen we should refresh appointments from session
    useFocusEffect(
        React.useCallback(() => {
            const stored = getSavedAppointments();
            if (stored) {
                setAppointments(stored);
            }
            const storedSel = getSavedAppointment();
            if (storedSel) {
                setSelectedAppointmentId(storedSel.id);
            }
            // If a transient global toast message exists (e.g. "Hätätehtävä kuitattu"), show it now
            try {
                const m = getGlobalToastMessage();
                if (m) {
                    showToast(m);
                    setGlobalToastMessage(null);
                }
            } catch (e) {
                // ignore
            }
            // after restoring appointments/select, scroll the highlighted appointment into view
            setTimeout(() => {
                if (listRef.current && !isEditMode) {
                    // prefer demo notification, then accepted help slot, then selected appointment from session, else autoHighlightedId
                    let targetId = autoHighlightedId;
                    const current = (stored || appointments) as Appointment[];
                    if (current.find((a) => String(a.id) === 'h-demo')) {
                        targetId = 'h-demo';
                    } else {
                        const accepted = current.find((a) => String(a.id).startsWith('h-accepted-'));
                        if (accepted) targetId = accepted.id;
                        else if (storedSel && current.find((a) => String(a.id) === String(storedSel.id))) {
                            targetId = storedSel.id;
                        }
                    }

                    const idx = current.findIndex((a: Appointment) => String(a.id) === String(targetId));
                    if (idx >= 0 && typeof listRef.current.scrollToIndex === 'function') {
                        try { listRef.current.scrollToIndex({ index: idx, viewPosition: 0 }); } catch (e) { /* ignore */ }
                    }
                }
            }, 80);
        }, [])
    );

    const handleSave = () => {
        if (editingId) {
            const next = appointments.map((apt) =>
                apt.id === editingId ? { ...apt, time: editTime, visitNotes: editVisitNotes, medication: editMedication, dosage: editDosage } : apt
            );

            // Reorder appointments by time so the edited slot moves to its correct position
            const timeToMinutes = (t: string) => {
                const parts = (t || '').split(':').map((s) => parseInt(s, 10));
                if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return 0;
                return parts[0] * 60 + parts[1];
            };

            const nextSorted = [...next].sort((a, b) => {
                return timeToMinutes(a.time) - timeToMinutes(b.time);
            });

            setAppointments(nextSorted);
            setSavedAppointments(nextSorted as any);
            // show animated toast instead of blocking alert
            showToast('Muutokset tallennettu');
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
                            setSavedAppointments(next as any);
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
            // Pass the selected appointmentId and patientId so Patient screen can load the patient entity
            navigation.navigate('Patient', { patientId: appointment.patientId, appointmentId: appointment.id });
        }
    };

    const acceptHelpRequest = (req: any) => {
        // convert help request into a normal appointment slot (demo: insert a new appointment after the target)
        const newAppt: Appointment = {
            id: `h-${Date.now()}`,
            time: req.scheduledTime ?? (appointments.find((a) => a.id === req.appointmentId)?.time ?? ''),
            patientId: req.patientId ?? (appointments.find((a) => a.id === req.appointmentId)?.patientId ?? ''),
            visitNotes: `Apupyynnön vastaanotto — ${req.requester || 'Hoitaja'}`,
            keywords: req.keywords ?? ['Tajuton potilas'],
            medication: undefined,
            dosage: undefined,
        };

        // insert after the referenced appointment where possible
        setAppointments((prev) => {
            const idx = prev.findIndex((a) => String(a.id) === String(req.appointmentId));
            const next = [...prev];
            if (idx >= 0) next.splice(idx + 1, 0, newAppt);
            else next.push(newAppt);
            setSavedAppointments(next as any);
            return next;
        });

        // mark request accepted and remove it
        updateHelpRequestStatus(req.id, 'accepted');
        removeHelpRequest(req.id);
        setHelpRequests(getHelpRequests() || []);
        showToast('Apupyyntö hyväksytty');
    };

    const declineHelpRequest = (req: any) => {
        updateHelpRequestStatus(req.id, 'declined');
        removeHelpRequest(req.id);
        setHelpRequests(getHelpRequests() || []);
        showToast('Apupyyntö hylätty');
    };

    // Demo handlers for the demo appointment row
    const acceptDemo = (demo: Appointment) => {
        const newAppt: Appointment = {
            id: `h-accepted-${Date.now()}`,
            time: demo.time,
            patientId: demo.patientId,
            visitNotes: `Avunpyyntö vastaanotettu`,
            keywords: ['Tajuton potilas'],
            medication: undefined,
            dosage: undefined,
        };

        setAppointments((prev) => {
            // find where the demo was so we can replace it with the accepted slot
            const idx = prev.findIndex((a) => String(a.id) === String(demo.id));
            const next = prev.filter((a) => String(a.id) !== String(demo.id));
            if (idx >= 0) {
                next.splice(idx, 0, newAppt);
            } else {
                next.push(newAppt);
            }
            try { setSavedAppointments(next as any); } catch (e) { }
            return next;
        });
        // Clear any cooldown so no new notification is scheduled while accepted slot exists
        try { setDemoCooldownUntil(null); } catch (e) { }
        showToast('Avunpyyntö hyväksytty');
    };

    const declineDemo = (demo: Appointment) => {
        // Remove demo appointment and persist updated schedule
        setAppointments((prev) => {
            const next = prev.filter((a) => String(a.id) !== String(demo.id));
            try { setSavedAppointments(next as any); } catch (e) { }
            return next;
        });

        // Remove demo patient from local state and persistent store if present
        try {
            const persisted = getPatients() || [];
            const withoutDemo = persisted.filter((p: any) => String(p.id) !== 'p-demo');
            setPatients(withoutDemo as any);
        } catch (e) {
            // ignore persistence errors
        }
        setPatientsState((prev) => prev.filter((p) => String(p.id) !== 'p-demo'));

        // Start a 2-minute cooldown so a new notification arrives after 2 minutes
        try { setDemoCooldownUntil(Date.now() + 2 * 60 * 1000); } catch (e) { }

        showToast('Avunpyyntö hylätty');
    };

    // Confirmation wrappers to avoid accidental taps
    const confirmAcceptDemo = (demo: Appointment) => {
        Alert.alert('Oletko varma', 'Haluatko hyväksyä avunpyynnön?', [
            { text: 'Ei', style: 'cancel' },
            { text: 'Kyllä', onPress: () => acceptDemo(demo) },
        ], { cancelable: true });
    };

    const confirmDeclineDemo = (demo: Appointment) => {
        Alert.alert('Oletko varma', 'Haluatko hylätä apupyynnön?', [
            { text: 'Ei', style: 'cancel' },
            { text: 'Kyllä', onPress: () => declineDemo(demo) },
        ], { cancelable: true });
    };

    const renderVisitInfo = (appt: Appointment) => {
        return (
            <View style={{ flexDirection: 'column' }}>
                {/* If appointment has keywords, render them above the visit note */}
                {Array.isArray((appt as any).keywords) && (appt as any).keywords.length ? (
                    <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' }}>
                        {((appt as any).keywords as string[]).map((k) => (
                            <View key={k} style={styles.demoKeywordChipSmall}>
                                <Text style={styles.demoKeywordTextSmall}>{k}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
                {appt.visitNotes ? (
                    <Text style={styles.visitNotes} numberOfLines={1} ellipsizeMode="tail">{appt.visitNotes}</Text>
                ) : null}
                {appt.medication ? (
                    <Text style={styles.medication} numberOfLines={1} ellipsizeMode="tail">{appt.medication}{appt.dosage ? ` — ${appt.dosage}` : ''}</Text>
                ) : null}
            </View>
        );
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Appointment>) => {
        const isDemo = String(item.id) === 'h-demo';

        if (isDemo) {
            const p = patientsState.find((x) => String(x.id) === String(item.patientId));
            const patientName = p ? p.name : getPatientNameForId(item.patientId) ?? 'Tuntematon';
            const patientAddress = p ? p.contact : getPatientAddressForId(item.patientId) ?? '';
            // derive short note suffix from visitNotes (e.g. 'tarvitsee apua')
            let noteSuffix = '';
            if (item.visitNotes) {
                const parts = item.visitNotes.split('—');
                if (parts.length > 1) noteSuffix = parts.slice(1).join('—').trim();
                else {
                    const partsDash = item.visitNotes.split('-');
                    noteSuffix = partsDash.length > 1 ? partsDash.slice(1).join('-').trim() : item.visitNotes;
                }
            }
            if (!noteSuffix) noteSuffix = 'tarvitsee apua';

            return (
                <View style={[styles.demoWrapper, { marginBottom: 8 }]}>
                    <View style={[styles.card, styles.demoItem]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.cardTitle, { color: '#7f1d1d' }]}>{`Avunpyyntö`}</Text>
                            <View style={styles.demoKeywordChip}>
                                <Text style={styles.demoKeywordText}>{(item as any).keywords && (item as any).keywords.length ? (item as any).keywords[0] : 'Tajuton potilas'}</Text>
                            </View>
                        </View>
                        <Text style={styles.demoPatientName}>{patientName}</Text>
                        {patientAddress ? <Text style={styles.demoAddress}>{patientAddress}</Text> : null}

                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                            <TouchableOpacity onPress={() => confirmAcceptDemo(item)} style={[styles.demoActionButton, { backgroundColor: '#10b981', marginRight: 12 }]}>
                                <Text style={styles.saveText}>Hyväksy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => confirmDeclineDemo(item)} style={[styles.demoActionButton, { backgroundColor: '#ef4444' }]}>
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Hylkää</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        const isAccepted = String(item.id).startsWith('h-accepted-');
        const isCompleted = Boolean((item as any).completed === true);

        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    isCompleted ? styles.completedItem : (isAccepted ? styles.acceptedItem : null),
                    autoHighlightedId === item.id && styles.activeItem,
                    isActive && styles.activeDragItem,
                ]}
                onPress={() => {
                    if (!isEditMode) {
                        setSelectedAppointmentId(item.id);
                        handlePatientClick(item);
                    }
                }}
            >
                <View style={styles.itemLeft}>
                    <Text style={[styles.time, isCompleted ? styles.completedTime : (isAccepted ? styles.acceptedTime : (autoHighlightedId === item.id && styles.activeTime))]}>
                        {item.time}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ flex: 1 }}>
                            {
                                (() => {
                                    const p = patientsState.find((x) => String(x.id) === String(item.patientId));
                                    return (
                                        <>
                                            <Text style={[styles.patient, autoHighlightedId === item.id && styles.activePatient]}>{p ? p.name : 'Tuntematon'}</Text>
                                            <Text style={styles.address}>{p ? p.contact : ''}</Text>
                                        </>
                                    );
                                })()
                            }
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
    };
    const openMap = (patientIdOrName?: string) => {
        // If a help notification exists, prioritize showing the notification's patient/address
        if (hasHelpNotification) {
            // Prefer the demo appointment if present, otherwise prefer any accepted help slot, then helpRequests
            const demoAppt = appointments.find((a) => String(a.id) === 'h-demo');
            if (demoAppt) {
                const p = patientsState.find((x) => String(x.id) === String(demoAppt.patientId));
                if (p) {
                    setMapFocusPatientName(p.name);
                    setMapFocusPatientAddress(p.contact);
                } else {
                    const pname = getPatientNameForId(demoAppt.patientId);
                    const paddr = getPatientAddressForId(demoAppt.patientId);
                    setMapFocusPatientName(pname);
                    setMapFocusPatientAddress(paddr);
                }
                setIsMapOpen(true);
                return;
            }

            const accepted = appointments.find((a) => String(a.id).startsWith('h-accepted-'));
            if (accepted) {
                const p = patientsState.find((x) => String(x.id) === String(accepted.patientId));
                if (p) {
                    setMapFocusPatientName(p.name);
                    setMapFocusPatientAddress(p.contact);
                } else {
                    const pname = getPatientNameForId(accepted.patientId);
                    const paddr = getPatientAddressForId(accepted.patientId);
                    setMapFocusPatientName(pname);
                    setMapFocusPatientAddress(paddr);
                }
                setIsMapOpen(true);
                return;
            }

            // fallback: if there are helpRequests we might map them to an appointment patient id
            if (helpRequests && helpRequests.length > 0) {
                const hr = helpRequests[0];
                const p = patientsState.find((x) => String(x.id) === String(hr.patientId));
                if (p) {
                    setMapFocusPatientName(p.name);
                    setMapFocusPatientAddress(p.contact);
                } else {
                    const pname = getPatientNameForId(hr.patientId);
                    const paddr = getPatientAddressForId(hr.patientId);
                    setMapFocusPatientName(pname);
                    setMapFocusPatientAddress(paddr);
                }
                setIsMapOpen(true);
                return;
            }
        }

        // If an id or name was provided, use that
        if (patientIdOrName) {
            const byId = patientsState.find((p) => String(p.id) === String(patientIdOrName));
            if (byId) {
                setMapFocusPatientName(byId.name);
                setMapFocusPatientAddress(byId.contact);
            } else {
                setMapFocusPatientName(patientIdOrName);
                setMapFocusPatientAddress(undefined);
            }
            setIsMapOpen(true);
            return;
        }

        // otherwise fall back to the highlighted appointment's patient
        const highlighted = highlightedAppointment;
        if (highlighted) {
            const pname = getPatientNameForId(highlighted.patientId);
            const paddr = getPatientAddressForId(highlighted.patientId);
            setMapFocusPatientName(pname);
            setMapFocusPatientAddress(paddr);
        } else {
            setMapFocusPatientName(undefined);
            setMapFocusPatientAddress(undefined);
        }
        setIsMapOpen(true);
    };

    const closeMap = () => { setIsMapOpen(false); setMapFocusPatientName(undefined); setMapFocusPatientAddress(undefined); };

    return (
        <MainLayout>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Aikataulu</Text>
                    <View style={styles.headerButtons}>
                        <View style={{ position: 'relative' }}>
                            <TouchableOpacity
                                onPress={() => openMap()}
                                style={[
                                    styles.iconButton,
                                    { backgroundColor: '#2563eb' },
                                ]}
                            >
                                <Ionicons name="map" size={20} color="#fff" />
                            </TouchableOpacity>
                            {hasHelpNotification ? (
                                <View style={styles.mapIconDot} pointerEvents="none" />
                            ) : null}
                        </View>
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
                    ref={listRef}
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
                            <Text style={styles.modalPatientName}>{editPatient}</Text>

                            <Text style={styles.label}>Aika</Text>
                            <TextInput
                                style={styles.input}
                                value={editTime}
                                onChangeText={setEditTime}
                                placeholder="HH:MM"
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
                                    const chosenIntrinsic = hasHelpNotification ? alertIntrinsicSize : intrinsicSize;
                                    if (!chosenIntrinsic) return;
                                    const imgW = chosenIntrinsic.width || wrapW;
                                    const imgH = chosenIntrinsic.height || wrapH;
                                    // subtract header height so the image doesn't overlap or push the header out
                                    const availableH = Math.max(0, wrapH - headerHeight);
                                    // allow a modest upscale but never huge
                                    const maxUpscale = 1.15;
                                    const scale = Math.min(maxUpscale, wrapW / imgW, availableH / imgH);
                                    setMapDisplaySize({ width: Math.round(imgW * scale), height: Math.round(imgH * scale) });
                                }}
                            >
                                <View style={styles.mapHeader} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
                                    <View>
                                        <Text style={styles.mapTitle}>{mapFocusPatientName ?? highlightedPatientName ?? 'Kartta'}</Text>
                                        {(mapFocusPatientAddress ?? highlightedPatientAddress) ? (
                                            <Text style={styles.mapSubtitle}>{mapFocusPatientAddress ?? highlightedPatientAddress}</Text>
                                        ) : null}
                                    </View>
                                    <TouchableOpacity style={styles.mapClose} onPress={closeMap}>
                                        <Text style={styles.mapCloseText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                {hasHelpNotification && alertImgSource ? (
                                    <Image source={alertImgSource} style={[styles.mapImage, { width: mapDisplaySize.width, height: mapDisplaySize.height }]} />
                                ) : mapImgSource ? (
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
    mapSubtitle: { fontSize: 13, color: '#374151', marginTop: 2 },
    mapImageWrapper: { width: '100%', height: 420, padding: 0, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    mapContainer: { width: '96%', backgroundColor: 'transparent', borderRadius: 12, padding: 0, alignItems: 'center', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
    mapClose: { padding: 6 },
    mapCloseText: { fontSize: 20, color: '#111827' },
    mapIconDot: {
        position: 'absolute',
        // place the dot over the icon so it overlaps rather than sits beside it
        top: 6,
        right: 6,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#ef4444',
        borderWidth: 1.5,
        borderColor: '#fff',
        zIndex: 20,
    },


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
    modalPatientName: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#111827' },
    // Card styles used for inline help notifications
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#111827' },
    moveButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center' },
    moveButtonText: { color: '#2563eb', fontWeight: '700' },
    demoItem: { backgroundColor: '#fee2e2', borderColor: '#fca5a5', borderWidth: 1 },
    demoWrapper: { width: '100%', paddingHorizontal: 0 },
    demoPatientName: { fontSize: 13, color: '#7f1d1d', marginTop: 6, fontWeight: '600' },
    demoAddress: { fontSize: 12, color: '#5b6b6b', marginTop: 4 },
    demoActionButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    demoKeywordChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fca5a5',
    },
    demoKeywordText: { color: '#7f1d1d', fontSize: 13, fontWeight: '600' },
    demoKeywordChipSmall: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 16,
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        alignSelf: 'flex-start',
    },
    demoKeywordTextSmall: { color: '#7f1d1d', fontSize: 12 },
    // Accepted help request slot styling (more noticeable red background and accent)
    acceptedItem: { backgroundColor: '#fee2e2', borderLeftWidth: 4, borderLeftColor: '#dc2626' },
    acceptedTime: { color: '#dc2626' },
    // Completed (kuitattu) slot styling: muted/grey to indicate finished visit
    completedItem: { backgroundColor: '#f3f4f6', borderLeftWidth: 4, borderLeftColor: '#9ca3af' },
    completedTime: { color: '#6b7280' },
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

