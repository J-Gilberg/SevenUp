import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { SocketContext } from "../context/Socket";
import { useHistory } from "react-router-dom";



const GameLobby = () => {

    const socket = useContext(SocketContext);
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [playerNum, setPlayerNum] = useState(0);
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
    });

    socket.on('playerInfo', (num)=>{
        setPlayerNum(num);
        socket.emit('playerInfo', {roomCode:roomCode,name:playerName});

    });
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
            <h2>Welcome to the Room: {playerName}</h2>
            {host ? <p>You Are the Host</p>: <p></p>}
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