const express = require('express');
const app = express();
const server = app.listen(8000, () => console.log('The server is all fired up on port 8000'));
const io = require('socket.io')(server, { cors: true });
const {buildDeck , shuffle} = require('./components/ManageCards');

// roomCode > hostSocket,deck,playerOrder > socket,name
var rooms = {};

class Player {
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

class PlayerOrder {
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

io.on('connection', socket => {
  // let keys = Object.keys(socket);
  console.log(`Socket Id connected: ${socket.id}`);
  console.log(`number of sockets ${io.engine.clientsCount}`);
  io.emit('connection', null)
  //vvvvvvvv REMOVE IF YOU WANT TO STOP TESTING!!!!
  testSetup(socket);
  //^^^^^^^^ REMOVE IF YOU WANT TO STOP TESTING!!!!
  //GENERAL ROUTES
  socket.on('disconnect', () => {
    console.log(socket.rooms);
  });
  //END GENERAL ROUTES

  //GAME LOBBY ROUTES
  socket.on('newPlayer', newPlayer => {
    if (getRooms().includes(newPlayer.roomCode)) {
      socket.join(newPlayer.roomCode);
      rooms[newPlayer.roomCode]["playerOrder"].addBack({ socketId: socket.id, name: newPlayer.name })
      io.to(rooms[newPlayer.roomCode].hostSocket).emit('addPlayerToHostList', newPlayer.name);
      io.to(rooms[newPlayer.roomCode].hostSocket).emit('getPlayers');
      io.to(socket.id).emit('newPlayer', { host: false, name: newPlayer.name, roomCode: newPlayer.roomCode });

    } else {
      socket.join(newPlayer.roomCode);
      rooms[newPlayer.roomCode] = { hostSocket: socket.id };
      rooms[newPlayer.roomCode]["playerOrder"] = new PlayerOrder();
      rooms[newPlayer.roomCode]["playerOrder"].addBack({ socketId: socket.id, name: newPlayer.name })
      io.to(socket.id).emit('newPlayer', { host: true, name: newPlayer.name, roomCode: newPlayer.roomCode });
      io.to(socket.id).emit('setPlayers', [newPlayer.name])
    }
  });

  socket.on('getPlayers', (obj) => {
    //obj contains players and roomCode
    io.to(obj.roomCode).emit('setPlayers', obj.players);
  });
  //END GAME LOBBY ROUTES

  //GAME START ROUTES
  socket.on('createGame', (obj) => {//obj contains roomCode and pointLimit
    console.log('game created!!');
    rooms[obj.roomCode]['pointLimit'] = obj.pointLimit;
    setupGame(obj.roomCode);
  });


  //GAME ROUTES
  socket.on('dealCards', (obj) => {
    deal(obj.deck, obj.roomCode);
  });

  socket.on("myTurn", (roomCode) => {
    socket.to(roomCode).emit("yourTurn", false)
  });

  socket.on('playedCard', (obj) => {
    console.log('card was played');
    console.log(obj.selectedCard);
    if (obj.selectedCard.number === 7) {
      rooms[obj.roomCode]["min"][obj.selectedCard.suit]['min'] = obj.selectedCard.number - 1;
      rooms[obj.roomCode]["max"][obj.selectedCard.suit]['max'] = obj.selectedCard.number + 1;
      rooms[obj.roomCode]["max"][obj.selectedCard.suit]['cardsPlayed'].push(obj.selectedCard);
    } else if (obj.selectedCard.number < 7) {
      rooms[obj.roomCode]["min"][obj.selectedCard.suit]['cardsPlayed'].push(obj.selectedCard);
      rooms[obj.roomCode]["min"][obj.selectedCard.suit]['min'] = obj.selectedCard.number - 1;
    } else {
      rooms[obj.roomCode]["max"][obj.selectedCard.suit]['cardsPlayed'].push(obj.selectedCard);
      rooms[obj.roomCode]["max"][obj.selectedCard.suit]['max'] = obj.selectedCard.number + 1;
    }
    io.to(obj.roomCode).emit("setCards", { 'min': rooms[obj.roomCode]["min"], 'max': rooms[obj.roomCode]["max"] });
    io.to(rooms[obj.roomCode]['playerOrder'].moveHeadToBack().head.socket).emit('yourTurn', true);
  });

  socket.on('pass', (roomCode) => {
    console.log('turn passed');
    io.to(rooms[roomCode]['playerOrder'].moveTailToFront().head.socket).emit('giveCard', true);
  }); +

  socket.on('handCard', (obj) => {
    rooms[obj.roomCode]['playerOrder'].moveHeadToBack();
    io.to(rooms[obj.roomCode]['playerOrder'].head.socket).emit('handCard', obj.selectedCard);
    io.to(rooms[obj.roomCode]['playerOrder'].moveHeadToBack().head.socket).emit('yourTurn', true);
  });

  socket.on('jokerPlayed', (obj)=>{
    io.to(obj.roomCode).emit('jokerPlayed', obj.selectedCard);
  })

  socket.on('roundOver', (roomCode) => {
    console.log('round over');
    let runner = rooms[roomCode]['playerOrder'].head;
    while (runner) {
      io.to(runner.socket).emit('getScore', runner.socket);
      runner = runner.next;
    }
  })

  socket.on('setScore', (obj) => {
    console.log('Scores being set')
    let runner = rooms[obj.roomCode]['playerOrder'].head;
    while (runner) {
      if (runner.socket === socket.id) {
        console.log('score socket matched');
        runner.score += obj.score;
        rooms[obj.roomCode]['playerOrder'].playerScores[runner.name] = runner.score;
        if (runner.score >= rooms[obj.roomCode]['pointLimit']) {
          rooms[obj.roomCode]['playerOrder'].gameOver = true;
        }
        break;
      } else {
        runner = runner.next;
      }
    }
    console.log(`number of scores: ${Object.keys(rooms[obj.roomCode]['playerOrder'].playerScores).length}`)
    console.log(`player count: ${rooms[obj.roomCode]['playerOrder'].count}`)
    if (Object.keys(rooms[obj.roomCode]['playerOrder'].playerScores).length === rooms[obj.roomCode]['playerOrder'].count) {
      console.log('All Scores Saved')
      if (rooms[obj.roomCode]['playerOrder'].gameOver) {
        io.to(obj.roomCode).emit('gameOver', rooms[obj.roomCode]['playerOrder'].playerScores);
        io.to(obj.roomCode).emit('setRoomCode', obj.roomCode);
      } else {
        io.to(obj.roomCode).emit('setScores', rooms[obj.roomCode]['playerOrder'].playerScores);
        redeal(obj.roomCode);
        rooms[obj.roomCode]['playerOrder'].playerScores = {};
      }
    }
  })
  //END GAME ROUTES

});
//^END IO Connection Bracket

function sendPlayerInfo(roomCode) {
  console.log('sending Player Info');
  let runner = rooms[roomCode]['playerOrder'].head;
  let scores = {};
  while (runner) {
    scores[runner.name] = runner.score;
    runner = runner.next;
  }
  console.log(scores);
  runner = rooms[roomCode]['playerOrder'].head;
  while (runner) {
    io.to(runner.socket).emit('playerInfo', { 'roomCode': roomCode, 'name': runner.name, 'scores': scores, 'pointLimit': rooms[roomCode]['pointLimit']})
    runner = runner.next;
  }
  io.to(rooms[roomCode]['hostSocket']).emit('setHost', null);
}

function getRooms() {
  const arr = Array.from(io.sockets.adapter.rooms);
  const filtered = arr.filter(room => !room[1].has(room[0]));
  const res = filtered.map(i => i[0]);
  return res;
}


// DEAL FUNCTIONS
function deal(deck, roomCode) {
  let runner = {};
  deck = shuffle(deck);
  console.log('dealing');
  var playerCount = rooms[roomCode]["playerOrder"].count;
  var handNum = 1;
  var playerHands = [];

  for (let i = 0; i < playerCount; ++i) {
      playerHands.push([]);
  }
  for (let j = 0; j < deck.length; ++j) {
      if (deck[j].uid.substring(1, 4) === '07S') {
          rooms[roomCode]["startingPlayer"] = handNum;


      }
      playerHands[handNum - 1].push(deck[j]);
      ++handNum;
      if (handNum === playerCount + 1) {
          handNum = 1;
      }
  }
  //add hands to rooms object

  let i = 0;
  runner = rooms[roomCode]['playerOrder'].head;
  while (runner) {
      io.to(runner.socket).emit('playerHand', playerHands[i]);
      runner.hand = playerHands[i];
      runner = runner.next;
      ++i;
  }
  i = 1;
  while (i < rooms[roomCode]["startingPlayer"]) {
      rooms[roomCode]['playerOrder'].moveHeadToBack();
      i++;
  }
  io.to(rooms[roomCode]['playerOrder'].head.socket).emit('yourTurn', true);
}

function redeal(roomCode) {
  rooms[roomCode]["min"] = { 'C': { min: 7, cardsPlayed: [] }, 'D': { min: 7, cardsPlayed: [] }, 'H': { min: 7, cardsPlayed: [] }, 'S': { min: 7, cardsPlayed: [] } };
  rooms[roomCode]["max"] = { 'C': { max: 7, cardsPlayed: [] }, 'D': { max: 7, cardsPlayed: [] }, 'H': { max: 7, cardsPlayed: [] }, 'S': { max: 7, cardsPlayed: [] } };
  io.to(roomCode).emit("setCards", { 'min': rooms[roomCode]["min"], 'max': rooms[roomCode]["max"] });
  deal(rooms[roomCode]["deck"], roomCode)

  // io.to(rooms[roomCode]['playerOrder'].head.socket).emit('yourTurn', true);
}


//END DEAL FUNCTIONS

//// use this for validation later on?
// function getSocketsInRoom(roomCode) {
//   const arr = Array.from(io.sockets.adapter.rooms).filter(room => !room[1].has(room[0]));
//   for (let i = 0; i < arr.length; ++i) {
//     if (arr[i][0] === roomCode) {
//       console.log(`getSocketsInRoom: ${arr[i][1].keys()}`)
//       return arr[i][1].keys();
//     }
//   }
//   console.log(`getSocketsInRoom roomCode does not exist`)
//   return false;
// } 



function setupGame(obj) {
  // rooms[roomCode]["playerOrder"] = getSocketsInRoom(roomCode); //use to validate users still in lobby?
  console.log('setting up game');
  rooms[obj.roomCode]["min"] = { 'C': { min: 7, cardsPlayed: [] }, 'D': { min: 7, cardsPlayed: [] }, 'H': { min: 7, cardsPlayed: [] }, 'S': { min: 7, cardsPlayed: [] } };
  rooms[obj.roomCode]["max"] = { 'C': { max: 7, cardsPlayed: [] }, 'D': { max: 7, cardsPlayed: [] }, 'H': { max: 7, cardsPlayed: [] }, 'S': { max: 7, cardsPlayed: [] } };
  io.to(obj.roomCode).emit('createGame', obj.roomCode);
  rooms[obj.roomCode]["deck"] = buildDeck(rooms[obj.roomCode]["playerOrder"].count);
  rooms[obj.roomCode]["pointLimit"] = obj.pointLimit;
  deal(rooms[obj.roomCode]["deck"], obj.roomCode);
  sendPlayerInfo(obj.roomCode);
  // io.to(rooms[roomCode]['playerOrder'].head.socket).emit('yourTurn', true);
}

//TEST SETUP!!
function testSetup(socket) {
  let roomCode = "cool";
  var names = ["Justin", "Tim", "Shawn", "Jordan"];
  let count = 0;
  let pointLimit = 50;
  if (getRooms().includes(roomCode)) {
    count = rooms[roomCode]["playerOrder"].count;
    //joins to room
    socket.join(roomCode);
    //creates player node in DLL
    rooms[roomCode]["playerOrder"].addBack({ socketId: socket.id, name: names[count] })
    //sets player to host list.
    io.to(rooms[roomCode].hostSocket).emit('addPlayerToHostList', names[count]);
    //gets all players
    io.to(rooms[roomCode].hostSocket).emit('getPlayers');
    io.to(socket.id).emit('newPlayer', { host: false, name: names[count], roomCode: roomCode });
    io.to(socket.id).emit('testMoveToLobby', roomCode);

  } else {
    socket.join(roomCode);
    rooms[roomCode] = { hostSocket: socket.id };
    rooms[roomCode]["playerOrder"] = new PlayerOrder();
    rooms[roomCode]["playerOrder"].addBack({ socketId: socket.id, name: names[count] })
    io.to(socket.id).emit('newPlayer', { host: true, name: names[count], roomCode: roomCode });
    io.to(socket.id).emit('setPlayers', [names[count]])
    io.to(socket.id).emit('testMoveToLobby', roomCode);
  }
  if (rooms[roomCode]["playerOrder"].count === 4) {
    setupGame({'roomCode': roomCode, 'pointLimit': pointLimit});
  }
}
//END TEST SETUP!!





