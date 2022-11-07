const { model, Schema } = require('mongoose');


const DoctorSchema = Schema({
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
    fecNac: {
        type: String
    },
    telefono: {
        type: String
    },
    especialidad: {
        type: String,
        enum: ['Psicología', 'Psiquiatría'],
        required: true
    },
    descripcion: {
        type: String
    },
    fotoDoctor: {
        type: String,
        default: 'https://i.imgur.com/AtjuEkK.png'
    }
});

DoctorSchema.methods.toJSON = function () {
    const { __v, _id, ...restoDoctor } = this.toObject();
    return restoDoctor;
}


module.exports = model('Doctor', DoctorSchema);
