const { model, Schema } = require('mongoose');


const PacienteSchema = Schema({
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
    direccionPostal: {
        pais: { type: String, required: false },
        cp: { type: String, required: false },
        provincia: { type: String, required: false },
        ciudad: { type: String, required: false },
        direccion: { type: String, required: false }
    },
    altaMedica: {
        type: Boolean,
        default: false
    }
});

PacienteSchema.methods.toJSON = function () {
    const { __v, _id, ...restoPaciente } = this.toObject();
    return restoPaciente;
}


module.exports = model('Paciente', PacienteSchema);
