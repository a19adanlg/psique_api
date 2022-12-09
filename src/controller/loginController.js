const Sentry = require('@sentry/node');
const { compareSync } = require('bcryptjs');
const { sign } = require('jsonwebtoken');

const Usuario = require('../model/Usuario');

const PsiqueError = require('../services/routes/errors/PsiqueError');
const { logDebug, logInfo } = require('./../helpers/logger');


// * LOGIN
const loginPOST = async (req, res, next) => {
    Sentry.captureMessage(`POST petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
    logDebug("POST access from /login");

    const { nif, password } = req.body;

    const token = req.header('JWT');

    if (!token) {
        if (nifValido(nif) && password && password.length > 0) {
            try {
                const usuario = await Usuario.findOne({ nif });

                if (usuario) {
                    if (compareSync(password, usuario.password)) {
                        // * Generamos un JSONWebToken
                        const token = sign({ nifUsuario: usuario.nif }, process.env.JWT_PRIVATE_KEY);

                        logInfo("Operation succeed");

                        res.status(201).json({
                            "nifUsuario": usuario.nif,
                            "rolUsuario": usuario.rol,
                            token
                        });
                    } else {
                        return next(new PsiqueError("El password no es correcto", 401));
                    }
                } else {
                    return next(new PsiqueError("No existe ning\u00FAn usuario con ese NIF o no tiene permiso de acceso", 403));
                }
            } catch (error) {
                console.log(error)
                return next(new Error());
            }
        } else {
            return next(new PsiqueError("El NIF o password no son v\u00E1lidos", 400));
        }
    } else {
        return next(new PsiqueError("Ya existe una sesi\u00F3n iniciada", 409));
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
    loginPOST
};
