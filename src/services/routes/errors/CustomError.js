/**
 * Error personalizado
 */
class CustomError extends Error {

    constructor(msg = 'Error desconocido', HTTPCode = 400, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError)
        }

        this.name = "Custom Error"
        this.message = msg;

        this.HTTPCode = HTTPCode;
        this.date = new Date();
    }
}


module.exports = CustomError;
