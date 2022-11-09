const { Router } = require('express');
const router = Router();

const verificaJWT = require('./middlewares/verificaJWT');
const validaRoleDoctoresUsuarios = require('./middlewares/validaRoleDoctoresUsuarios');

const { doctorGET, doctoresGET, doctoresPOST, doctoresPUT, doctoresDELETE } = require('../../controller/doctorController');


// * Mapping subPath --> Middlewares --> Controller
router.get('/:id', [verificaJWT, validaRoleDoctoresUsuarios], doctorGET);
router.get('/', doctoresGET);

router.post('/', [verificaJWT, validaRoleDoctoresUsuarios], doctoresPOST);

router.put('/:id', [verificaJWT, validaRoleDoctoresUsuarios], doctoresPUT);

router.delete('/:id', [verificaJWT, validaRoleDoctoresUsuarios], doctoresDELETE);


module.exports = router;
