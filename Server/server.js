const express = require('express');
const app = express();
const server = app.listen(8000, () => console.log('The server is all fired up on port 8000'));
const io = require('socket.io')(server, { cors: true });
var activeSockets = [];

// roomCode > Host,Deck,Sockets > name,playerNum
var rooms = {};

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
      //sets player to host list.
      io.to(rooms[newPlayer.roomCode].hostSocket).emit('addPlayerToHostList', newPlayer.name);
      //gets all players
      io.to(rooms[newPlayer.roomCode].hostSocket).emit('getPlayers');
      console.log(`room: ${newPlayer.roomCode}, name: ${newPlayer.name} , isHost: false`);
      io.to(socket.id).emit('newPlayer', { host: false, name: newPlayer.name, roomCode: newPlayer.roomCode });

    } else {
      socket.join(newPlayer.roomCode);
      rooms[newPlayer.roomCode] = { hostSocket: socket.id };
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
  socket.on('setFirstPlayer', startingPlayer => {
  });

  socket.on('createGame', (roomCode) => {
    console.log('game created!!');
    setupGame(roomCode);
  });

  socket.on('playerInfo', (socket, info) => {
    rooms[info.roomCode]["sockets"][socket.id]["name"] = info.name;
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
    let playerHands = deal(deck, roomCode);
    let sockets = Object.keys(rooms[roomCode]["sockets"]);
    for (let i = 0; i < playerHands.length; ++i){
      io.to(sockets[i]).emit('playerHand', playerHands[i]);
    }
  });

  //END GAME ROUTES


});
//^END IO Connection Bracket




function getRooms() {
  const arr = Array.from(io.sockets.adapter.rooms);
  console.log(arr);
  const filtered = arr.filter(room => !room[1].has(room[0]));
  console.log(`filtered ${filtered}`);
  const res = filtered.map(i => i[0]);
  console.log(res);
  return res;
}

function getSocketsInRoom(roomCode) {
  const arr = Array.from(io.sockets.adapter.rooms).filter(room => !room[1].has(room[0]));
  for (let i = 0; i < arr.length; ++i) {
    if (arr[i][0] === roomCode) {
      console.log(`getSocketsInRoom: ${arr[i][1].keys()}`)
      return arr[i][1].keys();
    }
  }
  console.log(`getSocketsInRoom roomCode does not exist`)
  return false;
}

function setupGame(roomCode) {
  rooms[roomCode]["sockets"] = getSocketsInRoom(roomCode);
  console.log(rooms[roomCode]["sockets"]);
  let i = 1;
  Object.keys(rooms[roomCode]["sockets"]).forEach((id) => {
    console.log(id);
    console.log(`i ${i}`);
    rooms[roomCode]["sockets"][id]["playerNum"] = i;
    io.to(id).emit('playerInfo', i);
    ++i
  });
  rooms[roomCode]["deck"] = buildDeck(Object.keys(rooms[roomCode]["sockets"]).length);
  io.to(roomCode).emit('createGame', null);
}


// DECK FUNCTIONS
function shuffle(cardPool) {
  for (let i = 0; i < cardPool.length; ++i) {
    let x = Math.floor(Math.random() * cardPool.length - 1);
    [cardPool[i], cardPool[x]] = [cardPool[x], cardPool[i]];
  }
  return cardPool
}

function deal(deck, roomCode) {
  deck = shuffle(deck);
  var playerCount = Object.keys(rooms[roomCode]["sockets"]).length;
  var playerNum = 1;
  var playerHands = [];
  for (let i = 0; i < playerCount; ++i) {
    playerHands.push([]);
  }
  for (let j = 0; j < deck.length; ++j) {
    deck[j].playerId = playerNum;
    if (deck[j].uid.substring(2, 4) === 's07') {
      if (startingPlayer === null) {
        startingPlayer = playerNum;
      } else if (startingPlayer > playerNum) {
        startingPlayer = playerNum;
      }
    }
    playerHands[playerNum - 1].push(deck[j]);
    ++playerNum;
    if (playerNum === playerCount + 1) {
      playerNum = 1;
    }
  }
  console.log(playerHands)
  return playerHands;
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



