const { Router } = require('express');
const router = Router();

const verificaJWT = require('./middlewares/verificaJWT');
const validaRoleCitas = require('./middlewares/validaRoleCitas');

const { citaGET, citasGET, citasPOST, citasPUT, citasDELETE } = require('../../controller/citaController');


// * Mapping subPath --> Middlewares --> Controller
router.get('/:id', [verificaJWT, validaRoleCitas], citaGET);
router.get('/', [verificaJWT, validaRoleCitas], citasGET);

router.post('/', citasPOST);

router.put('/:id', [verificaJWT, validaRoleCitas], citasPUT);

router.delete('/:id', [verificaJWT, validaRoleCitas], citasDELETE);


module.exports = router;
