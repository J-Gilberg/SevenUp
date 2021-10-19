const express = require('express');
const app = express();
const server = app.listen(8000, () => console.log('The server is all fired up on port 8000'));
const io = require('socket.io')(server, { cors: true });
var activeSockets = [];

// roomCode > hostSocket,deck,playerOrder > socket,name,playerNum
var rooms = {};

class Player{
  constructor(playerInfo){
    this.socket = playerInfo.socketId;
    this.name = playerInfo.name;
    this.playerNum = playerInfo.playerNum;
    this.hand = null;
    this.next = null;
    this.prev = null;
  }
}

class PlayerOrder{
  constructor(){
    this.head = null;
    this.tail = null;
    this.count = 0;
  }

  addBack(value){
    if(this.head === null){
        let node = new Player(value);
        this.head = node;
        this.tail = node;
    }else{
        let runner = this.head;
        while(runner.next){
            runner = runner.next;
        }
        let node = new Player(value);
        runner.next = node;
        node.prev = runner
        this.tail = node;
    }
    this.count++;
  }

  moveHeadToBack(){
    let temp = this.head;
    this.head = temp.next;
    head.prev = null;

    this.tail.next = temp;
    temp.prev = this.tail;
    this.tail = this.tail.next;
    this.tail.next = null;
  }
}


io.on('connection', socket => {
  // let keys = Object.keys(socket);
  console.log(`Socket Id connected: ${socket.id}`);
  console.log(`number of sockets ${io.engine.clientsCount}`);
  io.emit('connection', null)

  //GENERAL ROUTES

  //END GENERAL ROUTES

  //GAME LOBBY ROUTES
  socket.on('newPlayer', newPlayer => {
    //checks if the room has been created.
    if (getRooms().includes(newPlayer.roomCode)) {
      //joins to room
      socket.join(newPlayer.roomCode);
      //creates player node in DLL

      rooms[newPlayer.roomCode]["playerOrder"].addBack({socketId:socket.id,name:newPlayer.name,playerNum:0})
      //sets player to host list.
      io.to(rooms[newPlayer.roomCode].hostSocket).emit('addPlayerToHostList', newPlayer.name);
      //gets all players
      io.to(rooms[newPlayer.roomCode].hostSocket).emit('getPlayers');
      console.log(`room: ${newPlayer.roomCode}, name: ${newPlayer.name} , isHost: false`);
      io.to(socket.id).emit('newPlayer', { host: false, name: newPlayer.name, roomCode: newPlayer.roomCode });

    } else {
      socket.join(newPlayer.roomCode);
      rooms[newPlayer.roomCode] = { hostSocket: socket.id };
      rooms[newPlayer.roomCode]["playerOrder"] = new PlayerOrder();
      rooms[newPlayer.roomCode]["playerOrder"].addBack({socketId:socket.id,name:newPlayer.name,playerNum:0})
      console.log(`room: ${newPlayer.roomCode}, name: ${newPlayer.name} , isHost: true`);
      io.to(socket.id).emit('newPlayer', { host: true, name: newPlayer.name, roomCode: newPlayer.roomCode });
      io.to(socket.id).emit('setPlayers', [newPlayer.name])
    }
  });

  socket.on('getPlayers', obj => {
    //obj contains players and roomCode
    io.to(obj.roomCode).emit('setPlayers', obj.players);
  });
  //END GAME LOBBY ROUTES


  //GAME START ROUTES
  socket.on('createGame', (roomCode) => {
    console.log('game created!!');
    setupGame(roomCode);

  });

  //GAME ROUTES

  socket.on('cardPlayed', (card) => {
    io.emit('cardPlayed', card);
    if (currentPlayersTurn + 1 < activeSockets.length) {
      ++currentPlayersTurn;
    } else {
      currentPlayersTurn = 0;
    }
    activeSockets[currentPlayersTurn].emit('yourTurn');
  });

  socket.on('setFirstPlayer', startingPlayer => {
    currentPlayersTurn = startingPlayer;
  })

  socket.on('dealCards', (deck, roomCode) => {
    deal(deck, roomCode);
  });


  //END GAME ROUTES


});
//^END IO Connection Bracket

function sendPlayerInfo(roomCode){
  let runner = rooms[roomCode]['playerOrder'].head;
  while(runner){
    io.to(runner.socketId).emit('playerInfo',{roomCode:roomCode, name:runner.name, playerNum: runner.playerNum})
    runner = runner.next;
  }
  io.to(rooms[roomCode]['hostSocket']).emit('setHost',null);
}


function getRooms() {
  const arr = Array.from(io.sockets.adapter.rooms);
  console.log(arr);
  const filtered = arr.filter(room => !room[1].has(room[0]));
  console.log(`filtered ${filtered}`);
  const res = filtered.map(i => i[0]);
  console.log(res);
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

function setupGame(roomCode) {
  // rooms[roomCode]["playerOrder"] = getSocketsInRoom(roomCode); //use to validate users still in lobby?
  console.log(rooms[roomCode]["playerOrder"]);
  let runner = rooms[roomCode]["playerOrder"].head;
  let pn = 1;
  while(runner){
    runner.playerNum = pn;
    runner = runner.next;
    ++pn;
  }
  io.to(roomCode).emit('createGame', null);
  rooms[roomCode]["deck"] = buildDeck(rooms[roomCode]["playerOrder"].count);
  deal(rooms[roomCode]["deck"], roomCode);
  sendPlayerInfo(roomCode);
}

// DECK FUNCTIONS
function shuffle(cardPool) {
  for (let i = cardPool.length - 1; i >= 0; i--) {
    let x = Math.floor(Math.random() * i + 1);
    [cardPool[i], cardPool[x]] = [cardPool[x], cardPool[i]];
  }
  return cardPool
}

function deal(deck, roomCode) {
  deck = shuffle(deck);
  var playerCount = rooms[roomCode]["playerOrder"].count();
  var playerNum = 1;
  var playerHands = [];
  
  for (let i = 0; i < playerCount; ++i) {
    playerHands.push([]);
  }
  for (let j = 0; j < deck.length; j++) {
    console.log(deck[j]);
    deck[j].playerId = playerNum;
    if (deck[j].uid.substring(2, 4) === 's07') {
      
        rooms[roomCode]["startingPlayer"] = playerNum;
    
    }
    playerHands[playerNum - 1].push(deck[j]);
    ++playerNum;
    if (playerNum === playerCount + 1) {
      playerNum = 1;
    }
  }
  let runner = rooms[roomCode]['playerOrder'].head;
  let i = 0;
  while(runner){
    io.to(runner.socketId).emit('playerHand', playerHands[i]);
    runner.hand = playerHands[i];
    runner = runner.next;
    ++i;
  }

  i=0;
  while (i < rooms[roomCode]["startingPlayer"]) {
    rooms[roomCode]['playerOrder'].moveHeadToBack();
    i++;
  }
}

function buildDeck(playerCount) {
  // < 6 => 1 deck
  // everyone needs 10+ cards
  let numDecks = Math.ceil(10 / (53 / playerCount));
  console.log(`numDecks: ${numDecks}`)
  let oneDeck = [];
  let cardPool = [];
  let suits = ['spades', 'diamonds', 'clubs', 'hearts'];
  let cardValue;
  let joker = {
    number: 0
    , suit: "All"
    , value: 50
    , played: false
    , playerId: 0
    , uid: 'a00'
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
          , value: cardValue
          , played: false
          , playerId: 0
          , uid: `${i}${suits[j][0]}${strK.substring(strK.length - 2, strK.length)}`
        })
      }
    }
    joker.uid = i + joker.uid;
    cardPool = [...cardPool, ...oneDeck, joker]
    console.log(`cardPool: ${cardPool}`)
    console.log(`playerId 52: ${cardPool[52].playerId}`)
  }
  return cardPool;
}


//END DECK FUNCTIONS

// Game Functionality







