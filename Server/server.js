const express = require('express');
const app = express();
const server = app.listen(8000, () => console.log('The server is all fired up on port 8000'));
const io = require('socket.io')(server, { cors: true });

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

  }
}

class PlayerOrder {
  constructor() {
    this.head = null;
    this.tail = null;
    this.count = 0;
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
    rooms[roomCode]['pointLimit'] = obj.pointLimit;
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

  socket.on('roundOver', (roomCode) => {
    let runner = rooms[roomCode]['playerOrder'].head;
    while (runner) {
      io.to(runner.socket).emit('getScore', runner.socket);
      runner = runner.next;
    }
  })

  socket.on('getScore', (obj) => {
    let runner = rooms[obj.roomCode]['playerOrder'].head;
    let scores = {};
    let gameOver = false;
    while (runner) {
      if (runner.socket === socket.id) {
        runner.score += obj.score;
      }
      if (runner.score > rooms[obj.roomCode]['pointLimit']) {
        gameOver = true;
      }
      scores[runner.name] = runner.score;
      runner = runner.next;
    }
    if (gameOver) {
      io.to(obj.roomCode).emit('gameOver', scores);
      io.to(rooms[obj.roomCode]).emit('setScores', scores);
      io.to(rooms[obj.roomCode]).emit('setRoomCode', obj.roomCode);
    } else if (Object.keys(scores).length === rooms[obj.roomCode]['playerOrder'].count) {
      io.to(rooms[obj.roomCode]).emit('setScores', scores);
      redeal(obj.roomCode);
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
    io.to(runner.socket).emit('playerInfo', { 'roomCode': roomCode, 'name': runner.name, 'scores': scores })
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

function redeal(roomCode) {
  rooms[roomCode]["min"] = { 'C': { min: 7, cardsPlayed: [] }, 'D': { min: 7, cardsPlayed: [] }, 'H': { min: 7, cardsPlayed: [] }, 'S': { min: 7, cardsPlayed: [] } };
  rooms[roomCode]["max"] = { 'C': { max: 7, cardsPlayed: [] }, 'D': { max: 7, cardsPlayed: [] }, 'H': { max: 7, cardsPlayed: [] }, 'S': { max: 7, cardsPlayed: [] } };
  io.to(roomCode).emit("setCards", { 'min': rooms[roomCode]["min"], 'max': rooms[roomCode]["max"] });
  deal(rooms[roomCode]["deck"], roomCode)

  // io.to(rooms[roomCode]['playerOrder'].head.socket).emit('yourTurn', true);
}

function setupGame(roomCode) {
  // rooms[roomCode]["playerOrder"] = getSocketsInRoom(roomCode); //use to validate users still in lobby?
  console.log('setting up game');
  rooms[roomCode]["min"] = { 'C': { min: 7, cardsPlayed: [] }, 'D': { min: 7, cardsPlayed: [] }, 'H': { min: 7, cardsPlayed: [] }, 'S': { min: 7, cardsPlayed: [] } };
  rooms[roomCode]["max"] = { 'C': { max: 7, cardsPlayed: [] }, 'D': { max: 7, cardsPlayed: [] }, 'H': { max: 7, cardsPlayed: [] }, 'S': { max: 7, cardsPlayed: [] } };
  io.to(roomCode).emit('createGame', roomCode);
  rooms[roomCode]["deck"] = buildDeck(rooms[roomCode]["playerOrder"].count);
  deal(rooms[roomCode]["deck"], roomCode);
  sendPlayerInfo(roomCode);
  // io.to(rooms[roomCode]['playerOrder'].head.socket).emit('yourTurn', true);
}

// DECK FUNCTIONS


function shuffle(cardPool) {
  console.log('shuffling');
  for (let i = cardPool.length - 1; i >= 0; i--) {
    let x = Math.floor(Math.random() * i + 1);
    [cardPool[i], cardPool[x]] = [cardPool[x], cardPool[i]];
  }
  return cardPool
}

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

function buildDeck(playerCount) {
  console.log('building deck');
  // < 6 => 1 deck
  // everyone needs 10+ cards
  let numDecks = Math.ceil(10 / (53 / playerCount));
  let oneDeck = [];
  let cardPool = [];
  let suits = ['S', 'D', 'C', 'H'];
  let cardNames = ['', 'Ace', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
  let cardValue;
  let joker = {
    number: 0
    , suit: "A"
    , value: 50
    , played: false
    , uid: '00A'
  }

  for (var i = 0; i < numDecks; ++i) {
    oneDeck = [];
    for (var j = 0; j < 4; ++j) {
      for (var k = 1; k <= 13; ++k) {
        if (k === 1) {
          cardValue = 15;
        }
        else if (k <= 10) {
          cardValue = k;
        }
        else {
          cardValue = 10;
        }
        let strK = '0' + k
        oneDeck.push({
          number: k
          , suit: suits[j]
          , cardName: cardNames[k]
          , value: cardValue
          , played: false
          , uid: `${i}${strK.substring(strK.length - 2, strK.length)}${suits[j]}`
        })
      }
    }
    joker.uid = i + joker.uid;
    cardPool = [...cardPool, ...oneDeck, joker]
  }
  return cardPool;
}
//END DECK FUNCTIONS


//TEST SETUP!!
function testSetup(socket) {
  let roomCode = "cool";
  var names = ["Justin", "Tim", "Shawn", "Jordan"];
  let count = 0;
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
    setupGame(roomCode);
  }
}
//END TEST SETUP!!





