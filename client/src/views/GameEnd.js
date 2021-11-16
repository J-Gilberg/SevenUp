import React, { useContext, useState } from 'react';
import { SocketContext } from '../context/Socket';
import { useHistory } from 'react-router-dom';


const GameEnd = (props) => {
    const socket = useContext(SocketContext);
    const history = useHistory();
    const [scores, setScores] = useState({});
    const [rankings, setRankings] = useState([]);
    const [roomCode, setRoomCode] = useState([]);


    socket.off('setRoomCode').on('setRoomCode', (roomCode) => {
        setRoomCode(roomCode);
    });

    socket.off('setScores').on('setScores', (scores) => {
        setScores(scores);
        sortScores();
    });

    const sortScores = () => {
        let tempScores = scores;
        let names = Object.keys(tempScores);
        let i = 0;
        let min = scores[names[0]];
        let name = names[0];
        let rank = [];
        while (names.length > 0) {
            if (i === names.length) {
                rank.push({ 'name': name, 'points': min });
                delete tempScores[name];
                names = Object.keys(tempScores);
                i = 0;
            }
            if (scores[names[i]] < min) {
                name = names[i];
                min = scores[names[i]]
            }
            ++i;
        }
        setRankings(rank);

    }

    const onClickHandler = e => {
        e.preventDefault();
        socket.leave(roomCode);
        history.push('/')
    }

    return (
        <div>
            {rankings.length 
            && <div>
                    <h1>{rankings[0]} is the Winner</h1>
                    <ul>
                        {rankings.map((player, i)=>{
                            return(<li>{i+1}. {player.name}: {player.points}</li>);
                        })}
                    </ul>
                    <button onClick={onClickHandler}>Play Again</button>
                </div>
            }
        </div>
    )

}
export default GameEnd;