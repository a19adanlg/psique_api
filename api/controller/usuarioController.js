const jwt = require('jsonwebtoken');
const { genSaltSync, hashSync } = require('bcryptjs');

const Doctor = require('../model/Doctor');
const Paciente = require('../model/Paciente');
const Usuario = require('../model/Usuario');

const CustomError = require("../services/routes/errors/CustomError");
const { logDebug, logInfo } = require('./../helpers/logger');


const usuarioGET = async (req, res, next) => {
    try {
        logDebug("GET access from /api/usuarios");

        const usuario = await Usuario.findOne({ nif: req.params.id });

        if (usuario) {
            logInfo("Operation succeed");

            res.status(200).json(usuario);
        } else {
            return next(new CustomError("Usuario solicitado no encontrado", 404));
        }
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n GET", 400));
    }
};

const usuariosGET = async (req, res, next) => {
    try {
        logDebug("GET access from /api/usuarios");

        const usuarios = await Usuario.find();

        logInfo("Operation succeed");

        res.status(200).json(usuarios);
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n GET", 400));
    }
};

const usuariosPOST = async (req, res, next) => {
    try {
        logDebug("POST access from /api/usuarios");

        let { nif, nombre, apellido1, apellido2, email, password, rol, fotoPerfil } = req.body;

        if (!nifValido(nif))
            return next(new CustomError("El NIF no es v\u00E1lido", 400));
        if (email && !emailValido(email))
            return next(new CustomError("El email no es v\u00E1lido", 400));
        if (!nombre)
            return next(new CustomError("El nombre no puede estar vac\u00EDo", 400));
        if (!password)
            return next(new CustomError("El password no puede estar vac\u00EDo", 400));

        // * Comprobamos si existe el usuario
        const existeUsuario = await Usuario.findOne({ nif });

        if (existeUsuario)
            return next(new CustomError("Ya existe un usuario con ese NIF", 409));

        // * Únicamente un admin podrá crear un usuario admin o un doctor
        // * Por lo tanto, comprobaremos si el usuario es un admin
        if (rol == 'ROLE_ADMIN' || rol == 'ROLE_DOCTOR') {
            const token = req.header('JWT');

            if (token) {
                const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

                // * Almaceno el usuario asociado al token
                const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

                if (usuario.rol != 'ROLE_ADMIN')
                    return next(new CustomError("S\u00F3lo un admin puede crear un usuario admin o un doctor", 403));
            } else {
                return next(new CustomError("S\u00F3lo un admin puede crear un usuario admin o un doctor", 403));
            }
        } else {
            rol = 'ROLE_PACIENTE';
        }

        // * Comprobamos si existe un doctor con ese NIF. Si existe, al nuevo usuario le daremos el rol ROLE_DOCTOR
        const existeDoctor = await Doctor.findOne({ nif });

        if (existeDoctor)
            rol = 'ROLE_DOCTOR';

        const newUsuario = new Usuario({ nif, nombre, apellido1, apellido2, email, password, rol, fotoPerfil });

        // * Encriptación del password
        const salt = genSaltSync(10);
        newUsuario.password = hashSync(password, salt);

        await newUsuario.save();

        logInfo("Operation succeed");

        res.status(201).json({
            "status": `Creado el nuevo usuario ${newUsuario.nif} con rol ${newUsuario.rol}`,
            "usuario": newUsuario
        });
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n POST", 400));
    }
};

const usuariosPUT = async (req, res, next) => {
    try {
        logDebug("PUT access from /api/usuarios");

        // * Extraemos lo que se va a actualizar y filtramos los valores nulos
        const { nif, ...update } = req.body;

        let toUpdate = {};

        for (let value in update) {
            if (update[value]) {
                toUpdate[value] = update[value]
            }
        }

        const token = req.header('JWT');
        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

        // * Almaceno el usuario asociado al token
        const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

        // * Sólo un administrador podrá editar el rol de un usuario
        // * Por lo tanto, comprobaremos que el usuario es un administrador
        if (toUpdate.rol) {
            if (usuario.rol != 'ROLE_ADMIN') {
                return next(new CustomError("S\u00F3lo un admin puede modificar el rol de un usuario", 403));
            }
        }

        // * Sólo un administrador o el propio usuario puede modificar un usuario
        if (req.params.id == usuario.nif || usuario.rol == 'ROLE_ADMIN') {
            if (toUpdate.email && !emailValido(toUpdate.email))
                return next(new CustomError("El email no es v\u00E1lido", 400));

            if (toUpdate.password) {
                const salt = genSaltSync(10);
                toUpdate.password = hashSync(toUpdate.password, salt);
            }

            const modUsuario = await Usuario.findOneAndUpdate({ nif: req.params.id }, toUpdate, { new: true });

            if (modUsuario) {
                logInfo("Operation succeed");

                res.status(200).json({
                    "status": "MODIFICADO",
                    "usuario": modUsuario
                });
            } else {
                return next(new CustomError("No existe el usuario solicitado", 404));
            }
        } else {
            return next(new CustomError("No tienes permisos para modificar este usuario", 403));
        }
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n PUT", 400));
    }
};

const usuariosDELETE = async (req, res, next) => {
    try {
        logDebug("DELETE access from /api/usuarios");

        const delUsuario = await Usuario.findOne({ nif: req.params.id });

        if (delUsuario) {
            // * Si el usuario a eliminar es un administrador no se eliminará
            if (delUsuario.rol != 'ROLE_ADMIN') {
                await Usuario.findOneAndRemove({ nif: req.params.id }, { new: true });

                logInfo("Operation succeed");

                res.status(200).json({
                    "status": "ELIMINADO",
                    "usuario": delUsuario
                });
            } else {
                return next(new CustomError("No es posible eliminar un usuario administrador", 403));
            }
        } else {
            return next(new CustomError("No existe el usuario solicitado", 404))
        }
    } catch (error) {
        return next(new CustomError("Error inesperado en la petici\u00F3n DELETE", 400));
    }
};

const meGET = async (req, res, next) => {
    try {
        logDebug("GET access from /api/usuarios/me");

        const token = req.header('JWT');
        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

        // * Almaceno el usuario asociado al token como propiedad de la request
        const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

        // * Compruebo si el usuario es un doctor
        const doctor = await Doctor.findOne({ nif: payload.nifUsuario });

        // * Compruebo si el usuario es un doctor
        const paciente = await Paciente.findOne({ nif: payload.nifUsuario });

        if (doctor) {
            logInfo("Operation succeed");

            res.status(200).json({
                "nif": usuario.nif,
                "nombre": usuario.nombre,
                "apellido1": usuario.apellido1,
                "apellido2": usuario.apellido2,
                "email": usuario.email,
                "fotoPerfil": usuario.fotoPerfil,
                "fecNac": doctor.fecNac,
                "telefono": doctor.telefono,
                "especialidad": doctor.especialidad
            });
        } else if (paciente) {
            logInfo("Operation succeed");

            res.status(200).json({
                "nif": usuario.nif,
                "nombre": usuario.nombre,
                "apellido1": usuario.apellido1,
                "apellido2": usuario.apellido2,
                "email": usuario.email,
                "fotoPerfil": usuario.fotoPerfil,
                "fecNac": paciente.fecNac,
                "telefono": paciente.telefono,
                "direccionPostal": paciente.direccionPostal
            });
        } else {
            logInfo("Operation succeed");

            res.status(200).json({
                "nif": usuario.nif,
                "nombre": usuario.nombre,
                "apellido1": usuario.apellido1,
                "apellido2": usuario.apellido2,
                "email": usuario.email,
                "fotoPerfil": usuario.fotoPerfil
            });
        }
    } catch (error) {
        return next(error);
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

// * VALIDAR EMAIL
function emailValido(email) {
    const regExp = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

    if (regExp.test(String(email))) {
        return true;
    }

    return false;
}


module.exports = {
    usuarioGET,
    usuariosGET,
    usuariosPOST,
    usuariosPUT,
    usuariosDELETE,
    meGET
};
