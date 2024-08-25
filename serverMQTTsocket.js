const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const mqtt = require('mqtt');

const app = require('express')();
require('dotenv').config();

const brocker = process.env.BROKER;
const port = process.env.BROKERPORT;
const protocol = process.env.BROKERPROTOCOL;
const user = process.env.BROKERUSERNAME;
const password = process.env.BROKERPASS;
const mqttSubscriberProd = process.env.MQTTPRODUCAO;
const websocketPort = process.env.WEBSOCKETPORT;
const hostFrontEnd = process.env.HOSTFRONTEND; // Pode não ser mais necessário

// Configurar CORS para permitir todas as origens
app.use(cors({
    origin: hostFrontEnd, 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true // Atenção: Usar com cuidado, pois permite o envio de cookies e headers de autenticação de qualquer origem
}));

// Servir o arquivo index.html
app.get('/', (req, res) => {
    fs.readFile(__dirname + '/index.html', (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
    });
});

// Criar o servidor HTTP
const server = http.createServer(app);

// Configurar o servidor Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*', // Permite todas as origens
        methods: ['GET', 'POST'],
        credentials: true // Atenção: Usar com cuidado, pois permite o envio de cookies e headers de autenticação de qualquer origem
    }
});

// Lidar com conexões Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Configurações do cliente MQTT
const mqttOptions = {
    host: brocker,
    port: port,
    protocol: protocol,
    username: user,
    password: password
};

server.listen(websocketPort, () => {
    console.log('Server is listening on port', websocketPort);

    const client = mqtt.connect(mqttOptions);

    client.on('connect', function () {
        console.log('Connected to MQTT broker');

        // tópico de produção
        client.subscribe(mqttSubscriberProd);

        // Tópico Teste
        client.subscribe('TesteMQTT');
    });

    client.on('error', function (error) {
        console.log(error);
    });

    io.on('connection', (socket) => {
        client.on('message', (topic, message) => {
            socket.emit('mqttMessage', message.toString());
        });
    });
});
