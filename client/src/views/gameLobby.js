import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { SocketContext } from "../context/Socket";
import { useHistory } from "react-router-dom";



const GameLobby = () => {

    const socket = useContext(SocketContext);
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('')
    const [players, setPlayers] = useState([]);
    const history = useHistory();
    const [deck, setDeck] = useState([]);
    const [startingPlayer, setStartingPlayer] = useState(0);
    const [host, setHost] = useState(false)

    useEffect(() => {
        socket.on('connection', () => {
            console.log('we are connected with the backend from gameLobby.js');
        });
    }, []);


    //GENERAL ROUTES
    socket.off('newPlayer').on('newPlayer', playerObject => {
        // socket.removeAllListeners('addPlayer');
        setHost(playerObject.host);
        console.log(socket);
        setRoomCode(playerObject.roomCode);
        setPlayerName(playerObject.name);
    });

    socket.on('getPlayers', () => {
        console.log("getting players from host");
        socket.emit('getPlayers', { players: players, roomCode: roomCode });
    });

    socket.off('setPlayers').on('setPlayers', players => {
        console.log(`Players ${players}`);
        setPlayers(players);
    })
    //END GENERAL ROUTES

    //HOST SPECICIC ROUTES
    socket.on('addPlayerToHostList', (name) => {
        setPlayers([...players, name]);
    });

    //END HOST SPECICIC ROUTES


    //GAME START TOUTES
    socket.on('createGame', () => {
        history.push('/game');
    });


    //END GAME START ROUTES


    //EVENT HANDLERS
    const onClickHandler = (e) => {
        e.preventDefault();
        socket.emit("createGame", roomCode);
    }


    //END EVENT HANDLERS
    return (
        <div>
            <h1>Room Code: {roomCode}</h1>
            {
                players.map((playerName) => {
                    return <div>{playerName}</div>
                })
            }
            {players.length >= 4 && host && <button onClick={onClickHandler}>Start Game</button>}
        </div>
    )
}
export default GameLobby;



// const buildDeck = () =>{
//     // < 6 => 1 deck
//     // everyone needs 10+ cards
//     console.log(`playerCount: ${playerCount}`)
//     let numDecks = Math.ceil(10 / (53 / playerCount));
//     console.log(`numDecks: ${numDecks}`)
//     let oneDeck = []; 
//     let cardPool = [];
//     let suits = ['spades','diamonds', 'clubs', 'hearts'];
//     let cardValue;
//     let joker = {
//         number: 0
//         ,suit: "All"
//         ,value: 50
//         ,played: false
//         ,playerId: 0
//         ,uid: 'a00'
//     }


//     for (var i =0; i < numDecks; ++i){
//         oneDeck = [];
//         for (var j=0; j<4; ++j){
//             for (var k=1; k<=13; ++k){
//                 if(k === 1) {
//                     cardValue = 15;
//                 }
//                 else if (k <=10) {
//                     cardValue = k;
//                 }
//                 else {
//                     cardValue = 10;
//                 }
//                 let strK = '0'+k
//                 oneDeck.push({number: k
//                     ,suit: suits[j]
//                     ,value: cardValue
//                     ,played: false
//                     ,playerId: 0
//                     ,uid: `${i}${suits[j][0]}${strK.substring(strK.length-2,strK.length)}`
//                 })
//             }

//         }
//         joker.uid = i+joker.uid;
//         cardPool = [...cardPool,...oneDeck,joker]
//         console.log(`cardPool: ${cardPool}`)
//         console.log(`playerId 52: ${cardPool[52].playerId}`)
//     }
//     return cardPool;
// }

// const deal = () =>{
//     for(let i = 0; i < deck.length;++i){
//         let x = Math.floor(Math.random()*deck.length - 1);
//         [deck[i], deck[x]] = [deck[x], deck[i]];
//     }
//     var playerNum = 1;
//     var playerHands = [];
//     for(let i = 0; i < playerCount; ++i){
//         playerHands.push([]);
//     }
//     for(let j = 0; j < deck.length ;++j){
//         deck[j].playerId = playerNum;
//         if(deck[j].uid.substring(2,4) === 's07'){
//             if (startingPlayer === null) {
//                 setStartingPlayer(playerNum);
//             } else if (startingPlayer > playerNum) {
//                 setStartingPlayer(playerNum);
//             }
//         }
//         playerHands[playerNum-1].push(deck[j]);
//         ++playerNum;
//         if(playerNum === playerCount + 1){
//             playerNum = 1;
//         }
//     }
//     playerNum = 1;
//     console.log(playerHands)
//     return playerHands;
// }