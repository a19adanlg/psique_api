const mongoose = require('mongoose');


const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CNN);
        return 'Conexión establecida con la database';
    } catch (error) {
        console.log(error)
        throw new Error('Error al conectar con la base de datos');
    }
}


module.exports = {
    dbConnection
};
