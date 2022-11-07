const express_logger = require('express-logger-unique-req-id');


let logger;

// * Configuración del logger
const fileConf = {
    level: process.env.LOG_LEVEL,
    filename: process.env.LOG_NAME,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // ! 5MB
    maxFiles: 5,
    colorize: true,
    timestamp: true
};

const consoleConf = {
    level: process.env.LOG_LEVEL,
    handleExceptions: true,
    json: false,
    colorize: true,
    timestamp: true
};

const startLogger = (app) => {
    express_logger.initializeLogger(app, fileConf, consoleConf);
    logger = express_logger.getLogger();
}

const logDebug = (msg) => logger.debug(msg);
const logError = (msg) => logger.error(msg);
const logInfo = (msg) => logger.info(msg);


module.exports = { startLogger, logDebug, logError, logInfo };
