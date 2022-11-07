const cors = require('cors')
const express = require('express');

const { dbConnection } = require('../configs/config_db');
const { startLogger, logDebug, logError, logInfo } = require('./../helpers/logger');


class Server {

    constructor() {
        this.app = express();
        this.host = process.env.SERVER_HOST;
        this.port = process.env.SERVER_PORT || 3000;

        // * Iniciar el logger
        startLogger(this.app);

        // * Setup middlewares
        this.middlewares();

        // * Routing
        this.routing();

        // * Errors
        this.errors();
    }

    listen() {
        this.app.listen(this.port, () => {
            logInfo(`Server iniciado en http://${this.host}:${this.port}`);
        });
    }

    connectDb() {
        dbConnection()
            .then(msg => {
                logInfo(msg);
            })
            .catch(err => {
                logError(err.message);
            });

        return this;
    }

    middlewares() {
        // ? Habilitar CORS
        this.app.use(cors());
        // ? Procesar datos enviados desde formulario
        this.app.use(express.urlencoded({ extended: true }));
        // ? Procesar el body de la request (parseo)
        this.app.use(express.json());
    }

    routing() {
        // ! /login
        this.app.use('/login', require('./routes/router_login'));
        // ! /logout
        this.app.use('/logout', require('./routes/router_logout'));
        // ! /api/usuarios
        this.app.use('/api/usuarios', require('./routes/router_usuario'));
        // ! /api/pacientes
        this.app.use('/api/pacientes', require('./routes/router_paciente'));
        // ! /api/doctores
        this.app.use('/api/doctores', require('./routes/router_doctor'));
        // ! /api/citas
        this.app.use('/api/citas', require('./routes/router_cita'));

        // ? Routing explícito
        // ! /
        this.app.get('/', (req, res) => {
            res.status(202).json({
                "msg": "Bienvenido a la API de Psique"
            });

            logDebug("GET access from /");
        });

        // ! Manejo 404
        this.app.use('/*', (req, res, next) => {
            const error = new Error('No existe ninguna URI en el server que coincida con la Request-URI');

            error.HTTPCode = 404;

            next(error);
        });
    }

    errors() {
        this.app.use((error, req, res, next) => {
            if (error.HTTPCode) {
                if (error.HTTPCode >= 400 && error.HTTPCode < 500 && error.detail) {
                    res.statusMessage = error.HTTPCode + ': ' + error.message;

                    logError(error.HTTPCode + ': ' + error.message);

                    return res.status(error.HTTPCode).json({
                        error: error.HTTPCode + ': ' + error.message
                    }).end();
                } else if (error.HTTPCode >= 500) {
                    res.statusMessage = 'Error inesperado';

                    logError(error.HTTPCode + ': ' + error.message);

                    return res.status(error.HTTPCode).json({
                        error: error.HTTPCode + ': Error inesperado'
                    }).end();
                } else {
                    res.statusMessage = error.message;

                    logError(error.HTTPCode + ': ' + error.message);

                    return res.status(error.HTTPCode).json({
                        error: error.HTTPCode + ': ' + error.message
                    }).end();
                }
            } else {
                res.statusMessage = 'Error inesperado';

                logError('500: Error inesperado');

                return res.status(500).json({
                    error: '500: Error inesperado'
                }).end();
            }
        });
    }
}


module.exports = Server;
