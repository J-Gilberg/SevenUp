import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/Socket";

export const CoolStuff = () => {
    const [joined, setJoined] = useState(false);
    const socket = useContext(SocketContext);
    const [players, setPlayers] = useState([]);
    const [name, setName] = useState('');
    console.log()

    useEffect(() => {
        setJoined(true);
        socket.on('connection', () => {
            console.log('we are connected with the backend ');
        });
        
        socket.on('newPlayer', newPlayer =>{
            console.log(newPlayer);
            setPlayers(players => {
                return [...players, newPlayer];
            })
        });

        return () => socket.disconnect(true);
    }, []);

    const onSubmitHandler = (e) => {
        e.preventDefault();
        socket.emit('newPlayer', name);
    }

    return (
        <div>
            <form onSubmit={onSubmitHandler}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                <input type="submit" value='Lets Go!!!' />
            </form>
            {
                players.map((item)=>{
                    return <div>{item}</div>
                })
            }
            Joined: {joined && 'they Joined!'}
        </div>


    )
}