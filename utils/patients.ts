let _patients: any[] | undefined = undefined;

// Initial seed moved here so the schedule no longer embeds patient strings.
export const INITIAL_PATIENTS = [
    { id: 'p-1', name: 'Eero Räsänen', contact: 'Kirkonkyläntie 9, Helsinki', henkilotunnus: '010190-123A' },
    { id: 'p-2', name: 'Sari Lehtinen', contact: 'Koulutie 8, Helsinki', henkilotunnus: '020280-234B' },
    { id: 'p-3', name: 'Anna Virtanen', contact: 'Keskuskatu 1, Helsinki', henkilotunnus: '030370-345C' },
    { id: 'p-4', name: 'Mikko Korhonen', contact: 'Rantatie 5, Helsinki', henkilotunnus: '040460-456D' },
    { id: 'p-5', name: 'Laura Nieminen', contact: 'Puistotie 12, Helsinki', henkilotunnus: '050550-567E' },
    { id: 'p-6', name: 'Jussi Mäkinen', contact: 'Asemakatu 3, Helsinki', henkilotunnus: '060640-678F' },
    { id: 'p-7', name: 'Pekka Salmi', contact: 'Raitatie 22, Helsinki', henkilotunnus: '070730-789G' },
    { id: 'p-8', name: 'Tiina Koskinen', contact: 'Torikatu 7, Helsinki', henkilotunnus: '080820-890H' },
    { id: 'p-9', name: 'Oona Laakso', contact: 'Kivitie 15, Helsinki', henkilotunnus: '090910-901J' },
    { id: 'p-10', name: 'Ville Hämäläinen', contact: 'Satamatie 4, Helsinki', henkilotunnus: '101000-012K' },
];

export const setPatients = (p: any[] | undefined) => {
    _patients = p;
};

export const getPatients = () => {
    if (!_patients) {
        // initialize with seed when nothing set yet
        _patients = INITIAL_PATIENTS.slice();
    }
    return _patients;
};

export const getPatientById = (id: string | number) => {
    const list = getPatients();
    return list.find((x) => String(x.id) === String(id));
};

export const setPatient = (patient: any) => {
    if (!_patients) _patients = INITIAL_PATIENTS.slice();
    const idx = _patients.findIndex((p) => String(p.id) === String(patient.id));
    if (idx === -1) _patients.push(patient);
    else _patients[idx] = patient;
};

export const clearPatients = () => {
    _patients = undefined;
};
