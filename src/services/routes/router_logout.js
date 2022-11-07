const express = require('express');
const router = express.Router();

const verificaJWT = require('./middlewares/verificaJWT');


// * Mapping subPath --> Middlewares --> Controller
router.get('/', verificaJWT, (req, res) => {
    try {
        if (req.header('JWT')) {
            res.removeHeader('JWT');
            res.json({
                "logout": true
            });
        } else {
            res.json({
                "msg": "no existe el token"
            });
        }
    } catch (err) {
        return next(new Error(err));
    }
});


module.exports = router;
