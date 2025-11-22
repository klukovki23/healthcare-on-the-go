let _savedAppointment: any | undefined = undefined;
let _savedAppointments: any[] | undefined = undefined;

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
