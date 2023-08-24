

const BOARD = ((rowCount, columnCount) => {

    const ROOMS = [];

    const TABLE_PARENT = document.getElementById("main-container");
    const messageContainer = document.getElementById("message-container");
    const messageText = document.getElementById("message-text");
    /*
        <div id="message-container">
            <p id="message-text"></p>
        </div>
        #message-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        text-align: center;
        z-index: 2;
        display: none; 
        }

        #message-text {
        font-size: 24px;
        margin: 0;
        }
     */
    const TABLE_ELEMENT = createTableElem();
    const ROOMS_WITH_THREATS = [];
    
    function getSize(){
        return {rows: rowCount, columns: columnCount};
    }
    
    function createTableElem(){
        const tableElem = createElemUnderParent("div", TABLE_PARENT);
        tableElem.id = "game-board";

        for (let i=0; i < rowCount; i++) {
            let row = [];
            let rowElem = createElemUnderParent("div", tableElem);
            rowElem.className = "row";

            for (let j=0; j < columnCount; j++) {
                const newRoom = RoomElement(rowElem, `${i}-${j}`);
                row.push(newRoom);
            }
            ROOMS.push(row);
        }
        return tableElem;
    }
    function createElemUnderParent(elemType, parentElem){
        const newElem = document.createElement(elemType);
        parentElem.appendChild(newElem);
        return newElem;
    }

    /**
     * @param {string} func function that takes an arg "room" (will be run for each room)
     */
    const applyToAllRooms = (func) => {
        ROOMS.forEach((row) => row.forEach(func));
    }
    const setAllRoomsVisibility = (visible) =>{
        console.log(`set all rooms to ${visible}`);
        applyToAllRooms((room) => {room.setVisible(visible)});
    }
    const setAllToHidden = () => {
        setAllRoomsVisibility(false);
    }

    const parseRoomToIndexes = (room) => room.split("-").map(n => Number(n));

    function roomExists(coordinate){
        return coordinate[0] < rowCount && coordinate[1] < columnCount;
    }
    /**
     * @param {string} roomString e.g. 0-0 
     * @returns RoomElement 
     */
    const parseMoveableRoom = (roomString) =>{
        let [i, j] = parseRoomToIndexes(roomString);
        if(!roomExists([i,j])){
            console.log(`Room ${i}-${j} does not exist`);
            return false;
        }
        return ROOMS[i][j];
    }

    function getRoomFromString(roomString){
        const indicies = parseRoomToIndexes(roomString); //TODO: validation
        return getRoom(indicies[0], indicies[1]);
    }

    function getRoom(row, column){
        return ROOMS[row][column];
    }
    /**
     * 
     * @param {RoomElement} room  
     * @returns {boolean} whether room contains a threat or not
     */
    function roomHasThreat(room){
        return ROOMS_WITH_THREATS.indexOf(room.ROOM_STRING) !== -1;
    }
    /**
     * @param {string} threatType e.g. "fire", "invader", "breach"
     * @param {string} room e.g. "0-0"
     */
    const spawnThreat = (threatType, room) => {
        ROOMS_WITH_THREATS.push(room);
        const roomElement = parseMoveableRoom(room);
        roomElement.setThreat(threatType);
    }

    /**
     * @param {string} room e.g. "0-0"
     */
    const removeThreat = (room) => {
        ROOMS_WITH_THREATS.splice(ROOMS_WITH_THREATS.indexOf(room), 1);
        const roomElement = parseMoveableRoom(room);
        roomElement.setThreat("");
    }

    function showGameEndMessage(result) {
        const messageContainer = document.getElementById("message-container");
        const messageText = document.getElementById("message-text");
      
        if (result === "You win") {
          messageText.textContent = "You Win!";
        } else if (result === "You lost") {
          messageText.textContent = "You Lost!";
        }
      
        // Show the message container
        messageContainer.style.display = "block";
    }
    const destroyRoom = (room) =>{
        const roomElement = parseMoveableRoom(room);
        roomElement.setDestroyed();
    }
    
    return {
        setAllToHidden,
        parseMoveableRoom,
        getRoom,
        getRoomFromString,
        getSize,
        roomHasThreat,
        spawnThreat,
        removeThreat,
        showGameEndMessage,
        destroyRoom,
    };;
})(3,3);

const HUMAN_ELEM = HumanElem(BOARD.getRoom(0,0));
