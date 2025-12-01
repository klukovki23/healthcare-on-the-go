let _savedAppointment: any | undefined = undefined;
let _savedAppointments: any[] | undefined = undefined;
let _patientNotes: { [patientId: string]: string[] } = {};
let _personalWorkspaceNotes: string[] = [];

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
