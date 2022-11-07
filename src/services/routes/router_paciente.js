const { Router } = require('express');
const router = Router();

const verificaJWT = require('./middlewares/verificaJWT');
const validaRolePacientes = require('./middlewares/validaRolePacientes');

const { pacienteGET, pacientesGET, pacientesPOST, pacientesPUT, pacientesDELETE } = require('../../controller/pacienteController');


// * Mapping subPath --> Middlewares --> Controller
router.get('/:id', [verificaJWT, validaRolePacientes], pacienteGET);
router.get('/', [verificaJWT, validaRolePacientes], pacientesGET);

router.post('/', [verificaJWT, validaRolePacientes], pacientesPOST);

router.put('/:id', [verificaJWT, validaRolePacientes], pacientesPUT);

router.delete('/:id', [verificaJWT, validaRolePacientes], pacientesDELETE);


module.exports = router;
