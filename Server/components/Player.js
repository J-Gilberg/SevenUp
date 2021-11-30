exports.Player = class Player {
    constructor(playerInfo) {
        this.socket = playerInfo.socketId;
        this.name = playerInfo.name;
        this.score = 0;
        this.next = null;
        this.prev = null;
        this.count = 0;
        this.gameOver = false;
    }
}

