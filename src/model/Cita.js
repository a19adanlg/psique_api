const { model, Schema } = require('mongoose');


const CitaSchema = Schema({
    id: {
        type: Number,
        required: false,
        unique: true
    },
    nifPaciente: {
        type: String,
        required: true
    },
    nombreP: {
        type: String
    },
    apellido1P: {
        type: String
    },
    apellido2P: {
        type: String
    },
    nifDoctor: {
        type: String,
        required: true
    },
    nombreD: {
        type: String
    },
    apellido1D: {
        type: String
    },
    apellido2D: {
        type: String
    },
    fecha: {
        type: String
    },
    hora: {
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
    mensaje: {
        type: String
    },
    activa: {
        type: Boolean,
        required: true,
        default: true
    }
});

CitaSchema.methods.toJSON = function () {
    const { __v, _id, ...restoCita } = this.toObject();
    return restoCita;
}


module.exports = model('Cita', CitaSchema);
