let _savedAppointment: any | undefined = undefined;
let _savedAppointments: any[] | undefined = undefined;
let _patientNotes: { [patientId: string]: string[] } = {};
let _personalWorkspaceNotes: string[] = [];
let _helpRequests: Array<{
    id: string;
    appointmentId?: string;
    patientId?: string | number;
    requester?: string;
    message?: string;
    status?: 'pending' | 'accepted' | 'declined';
    createdAt?: number;
}> = [];

// Demo notification cooldown timestamp (ms since epoch). If set, schedule should
// not insert a new demo until Date.now() >= this value. Null means no cooldown.
let _demoCooldownUntil: number | null = null;

export const setDemoCooldownUntil = (ts: number | null) => { _demoCooldownUntil = ts; };
export const getDemoCooldownUntil = () => _demoCooldownUntil;

// Transient global toast/message for simple cross-screen notifications.
let _globalToastMessage: string | null = null;
export const setGlobalToastMessage = (msg: string | null) => { _globalToastMessage = msg; };
export const getGlobalToastMessage = () => _globalToastMessage;

export const setSavedAppointment = (a: any | undefined) => {
    _savedAppointment = a;
};

export const getSavedAppointment = () => _savedAppointment;

export const setSavedAppointments = (a: any[] | undefined) => {
    _savedAppointments = a;
};

export const getSavedAppointments = () => _savedAppointments;

export const clearSession = () => {
    _savedAppointment = undefined;
    _savedAppointments = undefined;
};

export const setPatientNotes = (patientId: string | number, notes: string[] | undefined) => {
    if (patientId == null) return;
    if (!notes || notes.length === 0) {
        delete _patientNotes[String(patientId)];
    } else {
        _patientNotes[String(patientId)] = notes;
    }
};

export const getPatientNotes = (patientId: string | number) => {
    if (patientId == null) return undefined;
    return _patientNotes[String(patientId)];
};

export const addPersonalWorkspaceNote = (note: string) => {
    if (!note || !note.trim()) return;
    _personalWorkspaceNotes.unshift(note);
};

export const getPersonalWorkspaceNotes = () => _personalWorkspaceNotes;

export const clearPersonalWorkspaceNotes = () => { _personalWorkspaceNotes = []; };

export const addHelpRequest = (req: { appointmentId?: string; patientId?: string | number; requester?: string; message?: string }) => {
    const id = `help-${Date.now()}`;
    _helpRequests.unshift({ id, appointmentId: req.appointmentId, patientId: req.patientId, requester: req.requester || 'Tuntematon', message: req.message || '', status: 'pending', createdAt: Date.now() });
    return id;
};

export const getHelpRequests = () => _helpRequests;

export const removeHelpRequest = (id: string) => { _helpRequests = _helpRequests.filter((h) => h.id !== id); };

export const updateHelpRequestStatus = (id: string, status: 'pending' | 'accepted' | 'declined') => {
    _helpRequests = _helpRequests.map((h) => (h.id === id ? { ...h, status } : h));
};

export const clearHelpRequests = () => { _helpRequests = []; };
