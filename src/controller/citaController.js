const jwt = require('jsonwebtoken');
const Sentry = require('@sentry/node');

const Cita = require('../model/Cita');
const Doctor = require('../model/Doctor');
const Paciente = require('../model/Paciente');
const Usuario = require('../model/Usuario');

const PsiqueError = require("../services/routes/errors/PsiqueError");
const { logDebug, logInfo } = require('./../helpers/logger');


const citaGET = async (req, res, next) => {
    try {
        Sentry.captureMessage(`GET petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("GET access from /api/citas");

        // * Comprobamos si el usuario que accede es un doctor o un paciente
        const token = req.header('JWT');
        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

        // * Almaceno el usuario asociado al token
        const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

        let cita;

        // * Si el usuario es un doctor, devolvemos solo las citas que tenga asociadas como doctor
        // * Si el usuario es un paciente, devolvemos solo las citas que tenga asociadas como paciente
        if (usuario.rol == 'ROLE_DOCTOR') {
            cita = await Cita.findOne({ id: req.params.id, nifDoctor: usuario.nif, activa: true });
        } else if (usuario.rol == 'ROLE_PACIENTE') {
            cita = await Cita.findOne({ id: req.params.id, nifPaciente: usuario.nif, activa: true });
        }

        if (cita) {
            logInfo("Operation succeed");

            res.status(200).json(cita);
        } else {
            return next(new PsiqueError("No existe la cita solicitada o no puedes acceder a ella", 404))
        }
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n GET", 400));
    }
};

const citasGET = async (req, res, next) => {
    try {
        Sentry.captureMessage(`GET petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("GET access from /api/citas");

        // * Comprobamos si el usuario que accede es un doctor o un paciente
        const token = req.header('JWT');
        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

        // * Almaceno el usuario asociado al token
        const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

        let citas;

        // * Si el usuario es un doctor, devolvemos solo las citas que tenga asociadas como doctor
        // * Si el usuario es un paciente, devolvemos solo las citas que tenga asociadas como paciente
        if (usuario.rol == 'ROLE_DOCTOR') {
            citas = await Cita.find({ nifDoctor: usuario.nif, activa: true });
        } else if (usuario.rol == 'ROLE_PACIENTE') {
            citas = await Cita.find({ nifPaciente: usuario.nif, activa: true });
        }

        logInfo("Operation succeed");

        res.status(200).json(citas);
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n GET", 400));
    }
};

const citasPOST = async (req, res, next) => {
    try {
        Sentry.captureMessage(`POST petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("POST access from /api/citas");

        let hasUsuario = false;
        let isPaciente = false;

        let { nifPaciente, nombreP, apellido1P, apellido2P, nifDoctor, nombreD, apellido1D, apellido2D, fecha, hora, telefono, especialidad, mensaje } = req.body;

        // * Comprobamos si existe token para ver si quien pide la cita es un doctor o un paciente
        const token = req.header('JWT');

        if (token) {
            const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

            // * Almaceno el usuario asociado al token
            const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

            hasUsuario = true;

            if (usuario.rol == 'ROLE_DOCTOR') {
                // * Se asignará la cita al doctor que la solicita
                const doctor = await Doctor.findOne({ nif: usuario.nif });
                if (doctor) {
                    nifDoctor = doctor.nif;
                    nombreD = doctor.nombre;
                    apellido1D = doctor.apellido1;
                    apellido2D = doctor.apellido2;
                    especialidad = doctor.especialidad;
                }

                if (nifPaciente) {
                    // * Los datos del paciente se rellenarán automáticamente si existe ese paciente en la BD
                    const paciente = await Paciente.findOne({ nif: nifPaciente });
                    if (paciente) {
                        nombreP = paciente.nombre;
                        apellido1P = paciente.apellido1;
                        apellido2P = paciente.apellido2;
                        telefono = paciente.telefono;
                    }
                }
            }
            else if (usuario.rol == 'ROLE_PACIENTE') {
                isPaciente = true;

                const paciente = await Paciente.findOne({ nif: usuario.nif });
                if (paciente) {
                    nifPaciente = paciente.nif;
                    nombreP = paciente.nombre;
                    apellido1P = paciente.apellido1;
                    apellido2P = paciente.apellido2;
                    telefono = paciente.telefono;
                } else {
                    nifPaciente = usuario.nif;
                }
            } else if (usuario.rol == 'ROLE_ADMIN') {
                isPaciente = true;
            }
        } else {
            // * Si es anónimo, debe incluir el nifPaciente
            if (!nifPaciente)
                return next(new PsiqueError("Es necesario el NIF para solicitar una cita", 400));
        }

        // * Si no se especifica una especialidad, retornamos error
        if (!especialidad || (especialidad != "Psicología" && especialidad != "Psiquiatría"))
            return next(new PsiqueError("Es necesario que especifiques una especialidad válida para solicitar una cita", 400));

        // * Si la cita la solicita un paciente o alguien anónimo se le asignará un doctor al azar en la especialidad
        if (isPaciente || !hasUsuario) {
            // * Obtenemos un valor random
            let count = await Doctor.countDocuments({ especialidad });
            let random = Math.floor(Math.random() * count);

            // * Para evitar un error OutOfRange
            if (random == count && random != 0)
                random = random - 1;

            // * Recuperamos un doctor al azar
            const doctor = await Doctor.findOne({ especialidad }).skip(random);

            if (doctor) {
                nifDoctor = doctor.nif;
                nombreD = doctor.nombre;
                apellido1D = doctor.apellido1;
                apellido2D = doctor.apellido2;
            } else {
                return next(new PsiqueError("No existe ning\u00FAn doctor en esta especialidad", 404));
            }
        }

        if (!nifValido(nifPaciente))
            return next(new PsiqueError("El NIF del paciente no es v\u00E1lido", 400));
        if (!nifValido(nifDoctor))
            return next(new PsiqueError("El NIF del doctor no es v\u00E1lido", 400));

        // * Recuperamos la última cita
        const ultimaCita = await Cita.findOne().sort({ $natural: -1 });

        // * Declaramos la variable id
        let id;

        // * Si la última cita tiene el id definido, lo incrementaremos en 1
        // * Si no lo tiene, le daremos un valor, por ejemplo 1000
        if (ultimaCita.id) {
            id = ultimaCita.id + 1;
        } else {
            id = 1000;
        }

        const newCita = new Cita({ id, nifPaciente, nombreP, apellido1P, apellido2P, nifDoctor, nombreD, apellido1D, apellido2D, fecha, hora, telefono, especialidad, mensaje });
        await newCita.save();

        logInfo("Operation succeed");

        res.status(201).json({
            "status": `Creada la nueva cita para el paciente ${newCita.nifPaciente} con el doctor ${newCita.nifDoctor}`,
            "cita": newCita
        });
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n POST", 400));
    }
};

const citasPUT = async (req, res, next) => {
    try {
        Sentry.captureMessage(`PUT petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("PUT access from /api/citas");

        // * Extraemos lo que se va a actualizar y filtramos los valores nulos
        const { nifDoctor, ...update } = req.body;

        let toUpdate = {};

        for (let value in update) {
            if (update[value]) {
                toUpdate[value] = update[value]
            }
        }

        // * Recuperamos el token para ver si quien modifica la cita es un doctor o un paciente
        const token = req.header('JWT');
        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

        // * Almaceno el usuario asociado al token
        const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

        // * Comprobamos, si existen, que los NIFs son válidos
        if (toUpdate.nifPaciente)
            if (!nifValido(toUpdate.nifPaciente))
                return next(new PsiqueError("El NIF del paciente no es v\u00E1lido", 400));
        if (nifDoctor)
            if (!nifValido(nifDoctor))
                return next(new PsiqueError("El NIF del doctor no es v\u00E1lido", 400));

        // * Comprobamos si existe la cita a modificar
        const cita = await Cita.findOne({ id: req.params.id });

        if (cita) {
            let modCita;

            // * Un paciente no podrá modificar el NIF del doctor
            if (usuario.rol == 'ROLE_DOCTOR') {
                if (nifDoctor) {
                    // * Comprobamos si el doctor al que queremos reasignar la cita existe y si su especialidad es la de la cita
                    const existeDoctor = await Doctor.findOne({ nif: nifDoctor, especialidad: cita.especialidad });

                    if (existeDoctor) {
                        modCita = await Cita.findOneAndUpdate({ id: req.params.id }, { nifDoctor, nombreD: existeDoctor.nombre, apellido1D: existeDoctor.apellido1, apellido2D: existeDoctor.apellido2, toUpdate }, { new: true });
                    } else {
                        return next(new PsiqueError("No existe el doctor al que reasignar la cita o no pertenece a la especialidad necesaria", 404))
                    }
                } else {
                    modCita = await Cita.findOneAndUpdate({ id: req.params.id }, toUpdate, { new: true });
                }
            } else if (usuario.rol == 'ROLE_PACIENTE') {
                modCita = await Cita.findOneAndUpdate({ id: req.params.id }, toUpdate, { new: true });
            } else {
                return next(new PsiqueError("No tienes permisos para modificar esta cita", 403));
            }

            logInfo("Operation succeed");

            res.status(200).json({
                "status": "MODIFICADO",
                "cita": modCita
            });
        } else {
            return next(new PsiqueError("No existe la cita solicitada", 404))
        }
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n PUT", 400));
    }
};

const citasDELETE = async (req, res, next) => {
    try {
        Sentry.captureMessage(`DELETE petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("DELETE access from /api/citas");

        // * Comprobamos si el usuario que accede es un doctor o un paciente
        const token = req.header('JWT');
        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

        // * Almaceno el usuario asociado al token
        const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

        // * Comprobamos si existe la cita
        const cita = await Cita.findOne({ id: req.params.id });

        if (cita) {
            let delCita;

            // * Si el usuario es un doctor, devolvemos la cita si la tiene asociada como doctor
            // * Si el usuario es un paciente, devolvemos la cita si la tiene asociada como paciente
            if (usuario.rol == 'ROLE_DOCTOR') {
                delCita = await Cita.findOneAndUpdate({ id: req.params.id, nifDoctor: usuario.nif }, { activa: false }, { new: true });
            } else if (usuario.rol == 'ROLE_PACIENTE') {
                delCita = await Cita.findOneAndUpdate({ id: req.params.id, nifPaciente: usuario.nif }, { activa: false }, { new: true });
            } else {
                return next(new PsiqueError("No tienes permisos para eliminar esta cita", 403));
            }

            if (delCita) {
                logInfo("Operation succeed");

                res.status(200).json({
                    "status": "ELIMINADO",
                    "cita": delCita
                });
            } else {
                return next(new PsiqueError("No tienes permiso para eliminar esta cita", 403))
            }
        } else {
            return next(new PsiqueError("No existe la cita solicitada", 404))
        }
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n DELETE", 400));
    }
};


// * VALIDAR NIF
function nifValido(nif) {
    const regExp = /^[0-9]{8}[A-Z]$/;

    if (regExp.test(String(nif).toUpperCase())) {
        let letras = "TRWAGMYFPDXBNJZSQVHLCKE";
        let nums = nif.substring(0, nif.length - 1);

        return letras.charAt(nums % 23) == nif.slice(-1);
    }

    return false;
}


module.exports = {
    citaGET,
    citasGET,
    citasPOST,
    citasPUT,
    citasDELETE
};
