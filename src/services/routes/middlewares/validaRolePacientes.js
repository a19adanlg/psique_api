const jwt = require('jsonwebtoken');

const Usuario = require('../../../model/Usuario');

const PsiqueError = require('../errors/PsiqueError');


const validaRolePacientes = async (req, res, next) => {
    const token = req.header('JWT');

    try {
        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

        // * Almaceno el usuario asociado al token como propiedad de la request
        const usuario = await Usuario.findOne({ nif: payload.nifUsuario });

        if (usuario.rol != 'ROLE_ADMIN' && usuario.rol != 'ROLE_DOCTOR') {
            return next(new PsiqueError(`El servicio necesita alguno de estos roles: ROLE_ADMIN, ROLE_DOCTOR y ${usuario.nif} no lo tiene`, 403));
        }

        return next();
    } catch (error) {
        return next(new PsiqueError('Usuario no encontrado', 404));
    }
}


module.exports = validaRolePacientes;
