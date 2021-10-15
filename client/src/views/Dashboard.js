import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/Socket";
import { useHistory } from "react-router-dom";
// import { ManageCards } from '../components/ManageCards'


export const Dashboard = () => {
    const socket = useContext(SocketContext);
    const [roomCode, setRoomCode] = useState('');
    const [name, setName] = useState('');
    const history = useHistory();
    console.log()

    useEffect(() => {
        socket.on('connection', () => {
            console.log('we are connected with the backend from Dashboard');
        });
    }, []);

    const onSubmitHandler = (e) => {
        e.preventDefault();
        console.log('sent');
        socket.emit('newPlayer', {name:name, roomCode: roomCode});
        history.push(`/lobby/${roomCode}`);
    }

    return (
        <div>
            <form onSubmit={onSubmitHandler}>
                <h2>Enter New Room Code to Create or Existing Code to Join</h2><br />
                <label htmlFor="roomCode">Room Code: </label>
                <input name='roomCode' type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} /><br />
                <br />
                <label htmlFor="playerName">Player Name: </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} /><br />
                {roomCode.length > 0 && name.length > 0 && <input type="submit" value='Create or Join A Game!!!' />}
            </form>
        </div>
    )
}

