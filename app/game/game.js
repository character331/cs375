const { ROLES, GAME_TICK_DELAY_MS } = require("../constants");
const { Threat, THREAT_COOLDOWN_SECONDS, THREAT_TTL } = require("./threat");
const { randomInt } = require("../utils.js");
const { sendDataToPlayer } = require("../broadcaster.js");
const { ThreatSpawnedData } = require("../dataObjects");
const { CLIENTS_HANDLER } = require("../clientsHandler");

const { RandomBag } = require("../randomBag.js");
const { ConsoleLinesLog, isLineVisibleToHuman, isLineVisibleToAI } = require("../consoleLinesLog.js");
const { ConsoleLineData } = require("../dataObjects.js");

const GAMES = {
    
};

const selectThreatRoom = (avilableRooms, roomsWithThreats) => {
    const rooms = avilableRooms.filter((room) => roomsWithThreats.indexOf(room) === -1);
    return rooms[randomInt(0, rooms.length - 1)];
}

const GAME = (humanUsername, aiUsername, gameId) => {

    const GAME_ID = gameId;

    let gameTime = 4*60;
    let HUMAN_USERNAME = humanUsername;
    let AI_USERNAME = aiUsername;
    let room = "0-0";
    let threatCooldown = THREAT_COOLDOWN_SECONDS;

    //ROOMS
    const SHIP_SIZE = [3,3];
    const SHIP_ROWS = SHIP_SIZE[0];
    const SHIP_COLS = SHIP_SIZE[1];

    const THREATS_INDEXED_BY_ROOM = {};
    const AVAILABLE_ROOMS = ["0-0", "0-1", "0-2", "1-0", "1-1", "1-2", "2-0", "2-1", "2-2"]; // Richard: Yes I know it's hardcoded, we can make a dynamic room generator later TO DO
    const ROOMS_WITH_THREATS = [];
    const THREAT_TYPES = ["fire", "breach", "invader"];
    const MAX_ACTIVE_THREATS = 3;
    
    let consoleLinesLog = ConsoleLinesLog();

    const getRole = (username) => {
        if (username == HUMAN_USERNAME) {
            return ROLES.HUMAN;
        }
        if (username == AI_USERNAME) {
            return ROLES.AI;
        }
        return null;
    }
    //Whether the room exists on the spaceship
    const validateRoomPos = (x, y) =>{
        return x >= 0 && x < SHIP_ROWS && y >= 0 && y < SHIP_COLS;
    }
    const enterRoom = (newRoom) => {
        // If room not available (cause destroyed), cant enter
        if (AVAILABLE_ROOMS.indexOf(newRoom) === -1) {
            console.log(`GAME - Cannot enter room ${newRoom}`);
        }
        else {
            room = newRoom;
            if (ifRoomHasThreat(room)) {
                alertHumanPlayerOfThreat(room);
            }
        }
    }
    const getCurrentRoom = () => {
        return room;
    }
    // This is called once every second
    const tick = () => {

        // Pause game if clients in game aren't registered (client hasn't connected yet, or one of them logged out)
        if (!CLIENTS_HANDLER.doesGameHaveRegisteredClients(gameId)) {
            console.log(`Game paused. There are not 2 clients connected to the gameId ${gameId}`);
            return;
        }

        gameTime -= 1;

        // Threats
        if (threatCooldown <= 0 && ROOMS_WITH_THREATS.length < MAX_ACTIVE_THREATS) {
            spawnThreat();
        }
        else{
            threatCooldown -= 1;
        }
    }

    const spawnThreat = () => {
        const threatRoom = selectThreatRoom(AVAILABLE_ROOMS, ROOMS_WITH_THREATS);
        const threat = Threat(randomlySelectThreat(), () => onThreatUnresolved(threatRoom));
        THREATS_INDEXED_BY_ROOM[threatRoom] = threat;
        ROOMS_WITH_THREATS.push(threatRoom);
        console.log(`Threat spawned in room ${threatRoom}`);
        threatCooldown = THREAT_COOLDOWN_SECONDS;
        alertAIPlayerOfThreat(threatRoom);
    }

    const randomlySelectThreat = () => {
        return THREAT_TYPES[randomInt(0, THREAT_TYPES.length-1)];
    }

    /**
     * Used by both alertAIPlayerOfThreat and alertHumanPlayerOfThreat
     */
    const alertPlayerOfThreat = (threat, username, room) => {
        console.log(threat, room);
        console.log(THREATS_INDEXED_BY_ROOM);
        sendDataToPlayer(GAME_ID, username, ThreatSpawnedData(room, threat.THREAT_TYPE, THREAT_TTL, false));  
    }
    /**
     * @param {string} room e.g. 0-0 to index with 
     */
    const alertAIPlayerOfThreat = (room) => {
        alertPlayerOfThreat(THREATS_INDEXED_BY_ROOM[room], AI_USERNAME, room);
    }
    /**
     * @param {string} room e.g. 0-0 to index with 
     */
    const alertHumanPlayerOfThreat = (room) => {
        alertPlayerOfThreat(THREATS_INDEXED_BY_ROOM[room], HUMAN_USERNAME, room);
    }
    const onThreatUnresolved = (room) => {
        delete THREATS_INDEXED_BY_ROOM[room] // Remove threat from THREATS object
        AVAILABLE_ROOMS.splice(AVAILABLE_ROOMS.indexOf(room), 1);
        console.log(`Threat was unresolved room ${room} is no longer available`);
    }

    //Attempt to ping a room, but randomly scramble it first
    const scrambleThenPing = (row, column, threatType) =>{

        let line = ConsoleLineData(gameTime, `Attempting to ping <threatType> at ${row}-${column}`, "ai", "private");
        addConsoleLineAndBroadcast(line);

        let scrambleCount = RandomBag([[50, 0], [30, 1], [20, 2]]).pull();

        const scrambleBag = RandomBag([[1,"row"], [1, "col"], [1,"type"]]); //Different scramble categories may be given different weights
        for(let s = 0; s < scrambleCount; ++s){
            let scrambleFunc = scrambleBag.pull(false);
            switch(scrambleFunc){
                case "row":
                    let newRow;
                    do{
                        newRow = randomInt(0, SHIP_ROWS);
                    }while(newRow === row);
                    row = newRow;
                    break;

                case "col":
                    let newCol;
                    do{
                        newCol = randomInt(0, SHIP_COLS);
                    }while(newCol === column);
                    column = newCol;
                    break;

                case "type":
                    //TODO: Scamble threat type before pinging
                    break;
            }
        }

        pingRoom(row, column, threatType);
    }

    //Actually ping this room
    const pingRoom = (row, column, threatType) => {
        if(!validateRoomPos(row,column)) return;

        let message = `AI pings ${threatType} at ${row}-${column}`;
        let line = ConsoleLineData(gameTime, message);
        addConsoleLineAndBroadcast(line);
    }
    setInterval(()=> scrambleThenPing(0,0,"fire"), 2000);

    function addConsoleLineAndBroadcast(consoleLine){
        consoleLine.time = Math.round(gameTime);
        consoleLinesLog.addConsoleLine(consoleLine);
        console.log(consoleLine.message);

        if(isLineVisibleToHuman(consoleLine)){
            sendDataToPlayer(GAME_ID, HUMAN_USERNAME, consoleLine);        
        }
        if(isLineVisibleToAI(consoleLine)){
            sendDataToPlayer(GAME_ID, AI_USERNAME, consoleLine);   
        }
    }

    /**
     * 
     * @param {string} room e.g. 0-0 
     * @returns {boolean}
     */
    const ifRoomHasThreat = (room) => {
        return ROOMS_WITH_THREATS.indexOf(room) !== -1;
    }

    return {
        tick,
        getRole,
        enterRoom,
        getCurrentRoom
    }
}

const addGame = (gameId, game) => {
    GAMES[gameId] = game;
}

const startGame = (humanUsername, aiUsername) => {
    // Temp: TO DO - Replace with idGenerator when we want to test multiple games running at once
    // For now priority is getting 1 game working beginning to end
    const gameId = 1;
    addGame(gameId, GAME(humanUsername, aiUsername, gameId));
    return gameId;
}

const lookUpRole = (gameId, username) => {
    const game = GAMES[gameId];
    if (!game) {
        return null;
    }
    return game.getRole(username);
}
const lookUpGame = (gameId) => GAMES[gameId];

const tickGames = () => {
    for (const gameId of Object.keys(GAMES)) {
        GAMES[gameId].tick();
    }
}

setInterval(tickGames, GAME_TICK_DELAY_MS);

module.exports = { startGame, lookUpRole, lookUpGame }
