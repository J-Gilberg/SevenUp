const {Player} = require('./Player');

exports.PlayerOrder = class PlayerOrder {
    
    constructor() {
        this.head = null;
        this.tail = null;
        this.count = 0;
        this.playerScores = {};
    }

    addBack(value) {
        if (this.head === null) {
            let node = new Player(value);
            this.head = node;
            this.tail = node;
        } else {
            let runner = this.head;
            while (runner.next) {
                runner = runner.next;
            }
            let node = new Player(value);
            runner.next = node;
            node.prev = runner
            this.tail = node;
        }
        this.count++;
        return this;
    }


    moveHeadToBack() {
        let temp = this.head;
        this.head = this.head.next;
        this.head.prev = null;

        this.tail.next = temp;
        temp.prev = this.tail;
        this.tail = this.tail.next;
        this.tail.next = null;
        return this;
    }

    moveTailToFront() {
        let temp = this.tail;
        this.tail = temp.prev;
        this.tail.next = null;

        temp.next = this.head;
        this.head.prev = temp;
        this.head = this.head.prev;
        this.head.prev = null;
        return this;
    }

    display() {
        let runner = this.head;
        while (runner) {
            console.log(`Runner ${runner.name}`);
            if (runner.next) {
                console.log(`Runner Next exists`);
            }
            if (runner.prev) {
                console.log(`Runner Prev exists`);
            }
            runner = runner.next;
        }
        return this;
    }
}