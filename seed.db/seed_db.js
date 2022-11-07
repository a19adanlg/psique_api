require('./../src/configs/dotenv');

const mongoose = require('mongoose');

const Cita = require('./../src/model/Cita');
const Doctor = require('./../src/model/Doctor');
const Paciente = require('./../src/model/Paciente');
const Usuario = require('./../src/model/Usuario');

const seedCitas = require('./db/seed_citas.json');
const seedDoctores = require('./db/seed_doctores.json');
const seedPacientes = require('./db/seed_pacientes.json');
const seedUsuarios = require('./db/seed_usuarios.json');

const { genSaltSync, hashSync } = require('bcryptjs');


mongoose.connect(process.env.MONGODB_CNN).then(() => {
    console.log("Conexión establecida con la database");
}).catch((err) => {
    console.log(err);
})

const seedDB = async () => {
    await Cita.deleteMany({});
    await Cita.insertMany(seedCitas);

    await Doctor.deleteMany({});
    await Doctor.insertMany(seedDoctores);

    await Paciente.deleteMany({});
    await Paciente.insertMany(seedPacientes);

    await Usuario.deleteMany({});
    for (const u of seedUsuarios) {
        const newUsuario = new Usuario(u);

        // * Encriptación del password
        const salt = genSaltSync(10);
        newUsuario.password = hashSync(u.password, salt);

        await newUsuario.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
