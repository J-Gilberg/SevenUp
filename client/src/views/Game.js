import React, { useContext, useEffect, useState } from 'react'
import { SocketContext } from "../context/Socket";

const Game = (props) => {
    const socket = useContext(SocketContext);
    const [player, setPlayer] = useState({
        name: ''
        , playerId: ''
    });
    const [hand, setHand] = useState([]);
    const [yourTurn, setYourTurn] = useState(false);
    const [errors, setErrors] = useState('');
    var cardsPlayed = [];
    var min = { 'clubs': 7, 'diamonds': 7, 'hearts': 7, 'spades': 7 }
    var max = { 'clubs': 7, 'diamonds': 7, 'hearts': 7, 'spades': 7 }



    useEffect(() => {
        socket.on('playerHands', hand => {
            setPlayer({ name: socket.name, playerId: hand[0].playerId });
            setHand(hand);
        });

        socket.on('cardPlayed', card => {
            cardsPlayed.push(card);
        });

        socket.on('yourTurn', () => {
            setYourTurn(true);
        });
    }, [])

    // onvlcik for card, set card in hand and overall card pool to played
    // display on 1st game board by default, if not, move on to next available/possible board 
    // 
    const onClickHandler = (e) => {
        e.preventDafault();
        if (yourTurn) {
            let selectedCard = e.target.value
            if (cardsPlayed.length !== 0) {
                setErrors('')
                selectedCard.played = true;
                setYourTurn(false);
                socket.emit('cardPlayed', selectedCard)
            } else if(selectedCard.uid.substring(2,4) === 's07'){
                setErrors('')
                selectedCard.played = true;
                setYourTurn(false);
                socket.emit('cardPlayed', selectedCard)
            } else {
                setErrors('Play your 7 of Spades')
            }
        }
    }




    return (
        <div>
            <div id="gameBoard">
                <div class='spades'>
                    Spades
                    {cardsPlayed.map((card, i) => {
                        if (card.suits === 'spades' && card.number === 7) {
                            return (
                                <div>
                                    <p>{min.spades !== 7 && min.spades}</p>
                                    <p>7</p>
                                    <p>{max.spades !== 7 && max.spades}</p>
                                </div>
                            )
                        }
                    })}
                </div>
                <div class='clubs'>
                    Clubs
                    {cardsPlayed.map((card, i) => {
                        if (card.suits === 'clubs' && card.number === 7) {
                            return (
                                <div>
                                    <p>{min.clubs !== 7 && min.clubs}</p>
                                    <p>7</p>
                                    <p>{max.clubs !== 7 && max.clubs}</p>
                                </div>
                            )
                        }
                    })}
                </div>
                <div class='diamonds'>
                    Diamonds
                    {cardsPlayed.map((card, i) => {
                        if (card.suits === 'diamonds' && card.number === 7) {
                            return (
                                <div>
                                    <p>{min.diamonds !== 7 && min.diamonds}</p>
                                    <p>7</p>
                                    <p>{max.diamonds !== 7 && max.diamonds}</p>
                                </div>
                            )
                        }
                    })}
                </div>
                <div class='hearts'>

                </div>

            </div>

            <div id="hand">
                <h1>{yourTurn && `Its your Turn ${player.name}!!`}</h1>
                <p>{errors}</p>
                {hand.map((card, i) => {
                    return (
                        <div>
                            {!card.played && <button value={card} onClick={onClickHandler}>{card.suits} {card.number}</button>}
                        </div>
                    )
                })}
                <button>Pass</button>
            </div>
        </div>
    )
                
}

export default Game;