const Cita = require('../model/Cita');
const Doctor = require('../model/Doctor');
const Usuario = require('../model/Usuario');

const CustomError = require("../services/routes/errors/CustomError");
const { logDebug, logInfo } = require('./../helpers/logger');


const doctorGET = async (req, res, next) => {
    try {
        logDebug("GET access from /api/doctores");

        const doctor = await Doctor.findOne({ nif: req.params.id });

        if (doctor) {
            logInfo("Operation succeed");

            res.status(200).json(doctor);
        } else {
            return next(new CustomError("Doctor solicitado no encontrado", 404));
        }
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n GET", 400));
    }
};

const doctoresGET = async (req, res, next) => {
    try {
        logDebug("GET access from /api/doctores");

        const doctores = await Doctor.find();

        logInfo("Operation succeed");

        res.status(200).json(doctores);
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n GET", 400));
    }
};

const doctoresPOST = async (req, res, next) => {
    try {
        logDebug("POST access from /api/doctores");

        const { nif, nombre, apellido1, apellido2, especialidad, fotoDoctor } = req.body;

        if (!nifValido(nif))
            return next(new CustomError("El NIF no es v\u00E1lido", 400));
        if (!nombre)
            return next(new CustomError("El nombre no puede estar vac\u00EDo", 400));
        if (!especialidad || (especialidad != 'Psicología' && especialidad != 'Psiquiatría'))
            return next(new CustomError("Debes indicar una especialidad entre 'Psicolog\u00EDa' y 'Psiquiatr\u00EDa'", 400));
        if (!fotoDoctor)
            req.body.fotoDoctor = "https://i.imgur.com/AtjuEkK.png";

        // * Comprobamos si existe el doctor
        const existeDoctor = await Doctor.findOne({ nif });

        if (existeDoctor)
            return next(new CustomError("Ya existe un doctor con ese NIF", 409));

        const newDoctor = new Doctor(req.body);

        // * Comprobamos si existe un usuario con el mismo NIF y le asignamos el rol ROLE_DOCTOR
        await Usuario.findOneAndUpdate({ nif }, { nombre, apellido1, apellido2, rol: "ROLE_DOCTOR" }, { new: true })
        await newDoctor.save();

        logInfo("Operation succeed");

        res.status(201).json({
            "status": `Creado el nuevo doctor ${newDoctor.nif}: ${newDoctor.nombre}`,
            "doctor": newDoctor
        });
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n POST", 400));
    }
};

const doctoresPUT = async (req, res, next) => {
    try {
        logDebug("PUT access from /api/doctores");

        // * Extraemos lo que se va a actualizar y filtramos los valores nulos
        const { nif, ...update } = req.body;

        let toUpdate = {};

        for (let value in update) {
            if (update[value]) {
                toUpdate[value] = update[value]
            }
        }

        if (toUpdate.especialidad && (toUpdate.especialidad != 'Psicología' && toUpdate.especialidad != 'Psiquiatría'))
            return next(new CustomError("Debes indicar una especialidad entre 'Psicolog\u00EDa' y 'Psiquiatr\u00EDa'", 400));

        const modDoctor = await Doctor.findOneAndUpdate({ nif: req.params.id }, toUpdate, { new: true });

        if (modDoctor) {
            logInfo("Operation succeed");

            res.status(200).json({
                "status": "MODIFICADO",
                "doctor": modDoctor
            });
        } else {
            return next(new CustomError("No existe el doctor solicitado", 404))
        }
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n PUT", 400));
    }
};

const doctoresDELETE = async (req, res, next) => {
    try {
        logDebug("DELETE access from /api/doctores");

        const delDoctor = await Doctor.findOneAndRemove({ nif: req.params.id }, { new: true });

        if (delDoctor) {
            // * Comprobamos si el doctor a eliminar tiene un usuario de acceso y lo eliminamos también
            const delUsuario = await Usuario.findOneAndRemove({ nif: req.params.id }, { new: true });

            if (delUsuario)
                // * Si el usuario a eliminar es un administrador no se eliminará
                if (delUsuario.rol != 'ROLE_ADMIN') {
                    await Usuario.findOneAndRemove({ nif: req.params.id }, { new: true });
                } else {
                    return next(new CustomError("No es posible eliminar un usuario administrador", 403));
                }

            // * Eliminaremos también las citas asociadas a este doctor
            await Cita.deleteMany({ nifDoctor: req.params.id });

            logInfo("Operation succeed");

            res.status(200).json({
                "status": "ELIMINADO",
                "doctor": delDoctor,
                "usuario": delUsuario
            });
        } else {
            return next(new CustomError("No existe el doctor solicitado", 404))
        }
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n DELETE", 400));
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
    doctorGET,
    doctoresGET,
    doctoresPOST,
    doctoresPUT,
    doctoresDELETE
};
