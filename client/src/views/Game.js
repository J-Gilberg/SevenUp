import React, { useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client';
import { SocketContext } from "../context/Socket";
const Game = (props) => {
    const socket = useContext(SocketContext);
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [playerNum, setPlayerNum] = useState(0);
    const [host, setHost] = useState(false)
    const [hand, setHand] = useState([]);
    const [yourTurn, setYourTurn] = useState(false);
    const [errors, setErrors] = useState('');
    const [cardsPlayed, setCardsPlayed] = useState([]);
    const [min, setMin] = useState({ 'C': null, 'D': null, 'H': null, 'S': null })
    const [max, setMax] = useState({ 'C': null, 'D': null, 'H': null, 'S': null })




    useEffect(() => {
        
    }, [hand])

    //PLAYER INIT ROUTES
    socket.on('playerInfo', (playerInfo) => {
        setRoomCode(playerInfo.roomCode);
        setPlayerName(playerInfo.name);
        setPlayerNum(playerInfo.playerNum);
    });

    socket.on('setHost', ()=>{
        setHost(true);
    });

    //END PLAYER INIT ROUTES


    //GAME LOGIC
    socket.on('cardPlayed', card => {
        cardsPlayed.push(card);
    });

    socket.on('yourTurn', (isTurn) => {
        setYourTurn(isTurn);
        if (yourTurn){
            socket.emit("myTurn", roomCode);
        }
    });

    socket.on('playerHand', hand=>{
        setHand(hand);
    });

    socket.on('setCards', (cardsPlayed, min, max) => {
        setCardsPlayed(cardsPlayed);
        setMin(min)
        setMax(max)
      })

    //END GAME LOGIC

    //DISPLAY LOGIC
    // onvlcik for card, set card in hand and overall card pool to played
    // display on 1st game board by default, if not, move on to next available/possible board 
    // 
    const onClickHandler = (e) => {
        e.preventDafault();
        let selectedCard = e.target.value

        if (cardsPlayed.length !== 0) {
            if (Math.abs(min[selectedCard.suit] - selectedCard.number) == 0 || Math.abs(max[selectedCard.suit] - selectedCard.number) == 0){
                socket.to(roomCode).emit("playedCard", selectedCard);
            } else {
                setErrors('Play a valid card')
            }
        } else if(selectedCard.uid.substring(2,4) === 's07' && cardsPlayed.length ==0){
            socket.to(roomCode).emit("playedCard", selectedCard);
        } else {
            setErrors('Play your 7 of Spades')
        }
    }

    //END DISPLAY LOGIC


    return (
        <div>
            <div id="gameBoard">
                <div class='spades'>
                    Spades
                    {cardsPlayed.map((card, i) => {
                        if (card.suits === 'S' && card.number === 7) {
                            return (
                                <div>
                                    <p>{min.S !== 7 && min.S}</p>
                                    <p>7</p>
                                    <p>{max.S !== 7 && max.S}</p>
                                </div>
                            )
                        }
                    })}
                </div>
                <div class='clubs'>
                    Clubs
                    {cardsPlayed.map((card, i) => {
                        if (card.suits === 'C' && card.number === 7) {
                            return (
                                <div>
                                    <p>{min.C !== 7 && min.C}</p>
                                    <p>7</p>
                                    <p>{max.C !== 7 && max.C}</p>
                                </div>
                            )
                        }
                    })}
                </div>
                <div class='diamonds'>
                    Diamonds
                    {cardsPlayed.map((card, i) => {
                        if (card.suits === 'D' && card.number === 7) {
                            return (
                                <div>
                                    <p>{min.D !== 7 && min.D}</p>
                                    <p>7</p>
                                    <p>{max.D !== 7 && max.D}</p>
                                </div>
                            )
                        }
                    })}
                </div>
                <div class='hearts'>
                    Hearts
                    {cardsPlayed.map((card, i) => {
                        if (card.suits === 'H' && card.number === 7) {
                            return (
                                <div>
                                    <p>{min.H !== 7 && min.H}</p>
                                    <p>7</p>
                                    <p>{max.H !== 7 && max.H}</p>
                                </div>
                            )
                        }
                    })}
                </div>

            </div>

            <div id="hand">
                <h1>{yourTurn && `Its your Turn ${playerName}!!`}</h1>
                <p>{errors}</p>
                {yourTurn ?
                hand.map((card, i) => {
                    return (
                        <div>
                            {!card.played && <button value={card} onClick={onClickHandler}>{card.suits} {card.number}</button>}
                        </div>
                    )
                }) :
                hand.map((card, i) => {
                    return (
                        <div>
                            {!card.played &&  <img src="" alt={card.uid} />} 
                            <img src="../img/" alt="" />
                        </div>
                    )
                })
                }
                {yourTurn ? <button>Pass</button> : ""}
            </div>
        </div>
    )
                
}

export default Game;