import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/Socket";
import { useHistory } from "react-router-dom";



const GameLobby = () => {

    const socket = useContext(SocketContext);
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const history = useHistory();
    const [host, setHost] = useState(false);
    const [pointLimit, setPointLimit] = useState(50);

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

    socket.off('getPlayers').on('getPlayers', () => {
        console.log("getting players from host");
        socket.emit('getPlayers', { players: players, roomCode: roomCode });
    });

    socket.off('setPlayers').on('setPlayers', players => {
        console.log(`Players ${players}`);
        setPlayers(players);
    });

    //END GENERAL ROUTES

    //HOST SPECICIC ROUTES
    socket.off('addPlayerToHostList').on('addPlayerToHostList', (name) => {
        setPlayers([...players, name]);
    });

    //END HOST SPECICIC ROUTES


    //GAME START TOUTES
    socket.on('createGame', (roomCode) => {
        history.push('/game/'+roomCode);
    });
    //END GAME START ROUTES


    //EVENT HANDLERS
    const pointLimitHandler = (e) =>{
        e.preventDefault();
        setPointLimit(e.target.value);
    }

    const onClickHandler = (e) => {
        e.preventDefault();
        socket.emit("createGame", {'roomCode':roomCode, 'pointLimit': pointLimit});
    }


    //END EVENT HANDLERS
    return (
        <div className="background">
            <h1>Room Code: {roomCode}</h1>
            <h2>Welcome to the Room: {playerName}</h2>
            {host ? <p>You Are the Host</p>: <p></p>}
            <label>Point Limit</label>
            {host && <input value={pointLimit} type="number" onChange={pointLimitHandler}/>}
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