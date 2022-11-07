if (process.env.NODE_ENV !== 'production')
    require('./configs/dotenv');

const Server = require('./services/WebServer');


// * Inicializar REST Server
new Server().connectDb().listen();
