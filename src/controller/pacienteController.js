const Sentry = require('@sentry/node');

const Cita = require('../model/Cita');
const Paciente = require('../model/Paciente');
const Usuario = require('../model/Usuario');

const PsiqueError = require("../services/routes/errors/PsiqueError");
const { logDebug, logInfo } = require('./../helpers/logger');


const pacienteGET = async (req, res) => {
    try {
        Sentry.captureMessage(`GET petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("GET access from /api/pacientes");

        const paciente = await Paciente.findOne({ nif: req.params.id });

        if (paciente) {
            logInfo("Operation succeed");

            res.status(200).json(paciente);
        } else {
            return next(new PsiqueError("Paciente solicitado no encontrado", 404));
        }
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n GET", 400));
    }
};

const pacientesGET = async (req, res, next) => {
    try {
        Sentry.captureMessage(`GET petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("GET access from /api/pacientes");

        const pacientes = await Paciente.find();

        logInfo("Operation succeed");

        res.status(200).json(pacientes);
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n GET", 400));
    }
};

const pacientesPOST = async (req, res, next) => {
    try {
        Sentry.captureMessage(`POST petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("POST access from /api/pacientes");

        const { nif, nombre, apellido1, apellido2 } = req.body;

        if (!nifValido(nif))
            return next(new PsiqueError("El NIF no es v\u00E1lido", 400));
        if (!nombre)
            return next(new PsiqueError("El nombre no puede estar vac\u00EDo", 400));

        // * Comprobamos si existe el paciente
        const existePaciente = await Paciente.findOne({ nif });

        if (existePaciente)
            return next(new PsiqueError("Ya existe un paciente con ese NIF", 409));

        const newPaciente = new Paciente(req.body);

        // * Comprobamos si existe un usuario con el mismo NIF
        await Usuario.findOneAndUpdate({ nif }, { nombre, apellido1, apellido2 }, { new: true })
        await newPaciente.save();

        logInfo("Operation succeed");

        res.status(201).json({
            "status": `Creado el nuevo paciente ${newPaciente.nif}: ${newPaciente.nombre}`,
            "paciente": newPaciente
        });
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n POST", 409));
    }
};

const pacientesPUT = async (req, res, next) => {
    try {
        Sentry.captureMessage(`PUT petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("PUT access from /api/pacientes");

        // * Extraemos lo que se va a actualizar y filtramos los valores nulos
        const { nif, ...update } = req.body;

        let toUpdate = {};

        for (let value in update) {
            if (update[value]) {
                toUpdate[value] = update[value]
            }
        }

        const modPaciente = await Paciente.findOneAndUpdate({ nif: req.params.id }, toUpdate, { new: true });

        if (modPaciente) {
            logInfo("Operation succeed");

            res.status(200).json({
                "status": "MODIFICADO",
                "cita": modPaciente
            });
        } else {
            return next(new PsiqueError("No existe el paciente solicitado", 404))
        }
    } catch (error) {
        return next(new PsiqueError("Error inesperado en la petici\u00F3n PUT", 400));
    }
};

const pacientesDELETE = async (req, res, next) => {
    try {
        Sentry.captureMessage(`DELETE petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
        logDebug("DELETE access from /api/pacientes");

        const delPaciente = await Paciente.findOneAndRemove({ nif: req.params.id }, { new: true });

        if (delPaciente) {
            // * Comprobamos si el paciente a eliminar tiene un usuario de acceso y lo eliminamos también
            const delUsuario = await Usuario.findOne({ nif: req.params.id });

            if (delUsuario)
                // * Si el usuario a eliminar es un administrador no se eliminará
                if (delUsuario.rol != 'ROLE_ADMIN') {
                    await Usuario.findOneAndRemove({ nif: req.params.id }, { new: true });
                } else {
                    return next(new PsiqueError("No es posible eliminar un usuario administrador", 403));
                }

            // * Eliminaremos también las citas asociadas a este paciente
            await Cita.deleteMany({ nifPaciente: req.params.id });

            logInfo("Operation succeed");

            res.status(200).json({
                "status": "ELIMINADO",
                "paciente": delPaciente,
                "usuario": delUsuario
            });
        } else {
            return next(new PsiqueError("No existe el paciente solicitado", 404))
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
    pacienteGET,
    pacientesGET,
    pacientesPOST,
    pacientesPUT,
    pacientesDELETE
};
