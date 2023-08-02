// Require statements
const { getCurrentRoom, enterRoom } = require("./game/player.js");
const { PlayerRoomUpdateData } = require("./dataObjects.js");

const { WEBSOCKET_PORT, HOSTNAME, PORT } = require("../env.json");
let express = require("express");
const { WebSocketServer } = require('ws');

let app = express();
app.use(express.static("public"));

const webSockServer = new WebSocketServer({ port: WEBSOCKET_PORT });

app.use(express.static("public"));
app.use(express.json());

app.listen(PORT, HOSTNAME, () => {
	console.log(`App running on http://${HOSTNAME}:${PORT}`);
});

const onConnectionClose = () => {
	console.log("client disconnected!");
};
const onError = () => {
	console.log("websocket error");
}
const sendToAllClients = (data) => {
	if (typeof data === "object") {
		data = JSON.stringify(data);
	}
	webSockServer.clients.forEach(client => {
		client.send(data);
	});
}

const onReceiveDataFromClient = (byteData) => {
	let data = JSON.parse(byteData.toString());
	let action = data.action;
	let currentRoom;
	switch(action.name) {
		case "enterRoom":
			enterRoom(action.args.room);
			currentRoom = getCurrentRoom();
			sendToAllClients(PlayerRoomUpdateData(currentRoom));
			break;
		case "getCurrentRoom":
			currentRoom = getCurrentRoom();
			sendToAllClients(PlayerRoomUpdateData(currentRoom));
			break;
		default:
			break;
	}
}

webSockServer.on('connection', ws => {
	// This is what runs when a client makes a connection to our websocket server
	console.log('New client connected!');

	ws.on('close', onConnectionClose);
	ws.on('message', onReceiveDataFromClient);
	ws.onerror = onError;
});


