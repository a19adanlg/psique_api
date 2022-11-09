const { Router } = require('express');
const router = Router();

const verificaJWT = require('./middlewares/verificaJWT');
const validaRoleDoctoresUsuarios = require('./middlewares/validaRoleDoctoresUsuarios');

const { usuarioGET, usuariosGET, usuariosPOST, usuariosPUT, usuariosDELETE, meGET } = require('../../controller/usuarioController');


// * Mapping subPath --> Middlewares --> Controller
router.get('/me', verificaJWT, meGET);
router.get('/:id', [verificaJWT, validaRoleDoctoresUsuarios], usuarioGET);
router.get('/', [verificaJWT, validaRoleDoctoresUsuarios], usuariosGET);

router.post('/', usuariosPOST);

router.put('/:id', verificaJWT, usuariosPUT);

router.delete('/:id', [verificaJWT, validaRoleDoctoresUsuarios], usuariosDELETE);


module.exports = router;
