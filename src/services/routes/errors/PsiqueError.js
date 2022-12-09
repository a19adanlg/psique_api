/**
 * Error personalizado
 */
class PsiqueError extends Error {

    constructor(msg = 'Error desconocido', HTTPCode = 400, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PsiqueError)
        }

        this.name = "Psique Error"
        this.message = msg;

        this.HTTPCode = HTTPCode;
        this.date = new Date();
    }
}


module.exports = PsiqueError;
