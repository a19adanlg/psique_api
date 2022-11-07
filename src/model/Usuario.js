const { model, Schema } = require('mongoose');


const UsuarioSchema = Schema({
    nif: {
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true
    },
    apellido1: {
        type: String
    },
    apellido2: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    fecReg: {
        type: Date,
        default: Date.now()
    },
    rol: {
        type: String,
        required: true,
        enum: ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PACIENTE'],
        default: 'ROLE_PACIENTE'
    },
    fotoPerfil: {
        type: String,
        default: 'https://i.imgur.com/AtjuEkK.png'
    }
});

UsuarioSchema.methods.toJSON = function () {
    const { __v, _id, password, ...restoUsuario } = this.toObject();
    return restoUsuario;
}


module.exports = model('Usuario', UsuarioSchema);
