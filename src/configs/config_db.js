const mongoose = require('mongoose');


const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CNN);
        return 'Connection established with the database';
    } catch (error) {
        throw new Error('Failed to connect to database');
    }
}


module.exports = {
    dbConnection
};
