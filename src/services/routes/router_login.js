const express = require('express');
const router = express.Router();

const loginController = require('../../controller/loginController');


// * Mapping subPath --> Middlewares --> Controller
router.post('/', loginController.loginPOST);


module.exports = router;
