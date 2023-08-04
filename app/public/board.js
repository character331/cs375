const BOARD = ((rowCount, columnCount) => {

    const ROOMS = [];

    const TABLE_PARENT = document.getElementById("main-container");
    const TABLE_ELEMENT = createTableElem();
    
    function getSize(){
        return {rows: rowCount, columns: columnCount};
    }
    
    function createTableElem(){
        const tableElem = createElemUnderParent("table", TABLE_PARENT);
        tableElem.id = "game-board";

        for (let i=0; i < rowCount; i++) {
            let row = [];
            let rowElem = createElemUnderParent("tr", tableElem);

            for (let j=0; j < columnCount; j++) {
                const newCell = createElemUnderParent("td", rowElem);
                newCell.class = "hidden";
                newCell.id = `room-${i}-${j}`;

                row.push(newCell);
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
    const setAllToHidden = () => {
        applyToAllRooms((room) => {room.classList.remove("selected")});
    }

    const parseRoomToIndexes = (room) => room.split("-").map(n => Number(n));

    function roomExists(coordinate){
        return coordinate[0] < rowCount && coordinate[1] < columnCount;
    }

    /**
     * @param {string} room two numbers separated by a dash ranging from 0-0 to 2-2
     */
    const setCurrentRoom = (room) => {
        let [i, j] = parseRoomToIndexes(room);
        setAllToHidden();
        if(!roomExists([i,j])){
            console.log(`Room ${i}-${j} does not exist`);
        }else{
            ROOMS[i][j].classList.add("selected");
        }
    }

    function getRoom(row, column){
        return ROOMS[row][column];
    }
    
    return {
        setCurrentRoom,
        getRoom,
        getSize
    };;
})(3,3);
