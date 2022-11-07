const jwt = require('jsonwebtoken');

const Usuario = require('../../../model/Usuario');

const CustomError = require('../errors/CustomError');


// * VERIFY AUTHENTICATION
const verificaJWT = async (req, res, next) => {
    const token = req.header('JWT');

    if (token) {
        try {
            if (!process.env.JWT_PRIVATE_KEY) throw Error("No existe JWT_PRIVATE_KEY!")

            const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

            // * Almaceno el usuario asociado al token como propiedad de la request
            const user = await Usuario.findOne({ nif: payload.nifUsuario });
            if (!user) {
                return next(new CustomError('Token no v\u00E1lido. El Usuario no es un usuario activo en este momento o no existe', 401));
            } else {
                req.user = user;
            }
            return next();
        } catch (error) {
            return next(new CustomError('Token no v\u00E1lido', 401));
        }
    } else {
        return next(new CustomError('Debes enviar un token v\u00E1lido', 401));
    }
}


module.exports = verificaJWT;
