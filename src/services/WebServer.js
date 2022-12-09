const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const express = require('express');
const favicon = require('serve-favicon');

const { dbConnection } = require('../configs/config_db');
const { startLogger, logDebug, logError, logInfo } = require('./../helpers/logger');


class Server {

    constructor() {
        this.app = express();
        this.host = process.env.HOST;
        this.port = process.env.PORT;

        // * Iniciar el logger
        startLogger(this.app);

        // * Sentry
        this.sentry()

        // * Setup middlewares
        this.middlewares();

        // * Routing
        this.routing();

        // * Errors
        this.errors();
    }

    listen() {
        this.app.listen(this.port || 3000, () => {
            Sentry.captureMessage(`Server started at http://${this.host}:${this.port}`);
            logInfo(`Server started at http://${this.host}:${this.port}`);
        });
    }

    connectDb() {
        dbConnection()
            .then(msg => {
                Sentry.captureMessage(msg);
                logInfo(msg);
            })
            .catch(err => {
                Sentry.captureException(err);
                logError(err.message);
            });

        return this;
    }

    sentry() {
        Sentry.init({
            dsn: "https://a4ae991aad7045019470405cd57c41df@o4504293601181696.ingest.sentry.io/4504293604458497",
            integrations: [
                new Sentry.Integrations.Http({ tracing: true })
              ],
            tracesSampleRate: 1.0,
        });
    }

    middlewares() {
        // ? Habilitar CORS
        this.app.use(cors());
        // ? Helmet
        this.app.use(helmet());
        // ? Sentry
        this.app.use(Sentry.Handlers.requestHandler());
        this.app.use(Sentry.Handlers.tracingHandler());
        this.app.use(Sentry.Handlers.errorHandler());
        // ? Procesar datos enviados desde formulario
        this.app.use(express.urlencoded({ extended: true }));
        // ? Procesar el body de la request (parseo)
        this.app.use(express.json());
        // ? Favicon
        this.app.use(favicon(path.join(__dirname, '..', '..', 'public', 'img', 'favicon.ico')));
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

            Sentry.captureMessage(`GET petition ${req.originalUrl} from: ${req.socket.remoteAddress}`);
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

                    Sentry.captureException(error);
                    logError(error.HTTPCode + ': ' + error.message);

                    return res.status(error.HTTPCode).json({
                        error: error.HTTPCode + ': ' + error.message
                    }).end();
                } else if (error.HTTPCode >= 500) {
                    res.statusMessage = 'Error inesperado';

                    Sentry.captureException(error);
                    logError(error.HTTPCode + ': ' + error.message);

                    return res.status(error.HTTPCode).json({
                        error: error.HTTPCode + ': Error inesperado'
                    }).end();
                } else {
                    res.statusMessage = error.message;

                    Sentry.captureException(error);
                    logError(error.HTTPCode + ': ' + error.message);

                    return res.status(error.HTTPCode).json({
                        error: error.HTTPCode + ': ' + error.message
                    }).end();
                }
            } else {
                res.statusMessage = 'Error inesperado';

                Sentry.captureException('500: Unexpected error');
                logError('500: Error inesperado');

                return res.status(500).json({
                    error: '500: Error inesperado'
                }).end();
            }
        });
    }
}


module.exports = Server;
