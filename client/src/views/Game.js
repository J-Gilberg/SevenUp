import React, { useContext, useEffect, useState } from 'react'
import { Socket } from 'socket.io';
import { SocketContext } from "../context/Socket";
import imageLoader from '../images/images';


// //IMPORT IMAGES
// function importAll(r) {
//     let cardImages = {};
//     r.keys().map(item => { cardImages[item.replace('./', '')] = r(item); });
//     return cardImages;
// }

// const cardImages = importAll(require.context('../images/cards', false, '/\.png/'));
// //END IMPORT IMAGES

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
    const [images, setImages] = useState(imageLoader())


    // useEffect(() => {

    // }, [hand])

    //PLAYER INIT ROUTES
    socket.on('playerInfo', (playerInfo) => {
        console.log(`roomCode ${playerInfo.roomCode}`)
        setRoomCode(playerInfo.roomCode);
        setPlayerName(playerInfo.name);
        setPlayerNum(playerInfo.playerNum);
    });

    socket.on('setHost', () => {
        setHost(true);
    });

    //END PLAYER INIT ROUTES

    //GAME LOGIC
    // socket.on('cardPlayed', card => {
    //     cardsPlayed.push(card);
    // });

    socket.on('yourTurn', (isTurn) => {
        setYourTurn(isTurn);
        if (yourTurn) {
            socket.emit("myTurn", roomCode);
        }
    });

    socket.off('playerHand').on('playerHand', hand => {
        setHand(sortHand(hand));
    });

    socket.on('setCards', (cardsPlayed, min, max) => {
        setCardsPlayed(cardsPlayed);
        setMin(min)
        setMax(max)
    })
    //END GAME LOGIC

    //DISPLAY FUNCTIONS
    const sortHand = (hand) => {
        let cardSuits = { 'A': [], 'S': [], 'D': [], 'C': [], 'H': [] }
        let output = [];
        hand.forEach(card => {
            cardSuits[card.suit].push(card);
        });
        Object.keys(cardSuits).forEach((suit) => {
            let sorted = false;
            let i = 0;
            let changes = false;
            if (cardSuits[suit].length <= 0) {
                sorted = true;
            } else if (cardSuits[suit].length == 1) {
                sorted = true;
            }
            while (!sorted) {
                if (cardSuits[suit][i].number < cardSuits[suit][i + 1].number) {
                    [cardSuits[suit][i], cardSuits[suit][i + 1]] = [cardSuits[suit][i + 1], cardSuits[suit][i]];
                    changes = true;
                }
                if (i + 1 < cardSuits[suit].length - 1) {
                    ++i
                } else if (!changes) {
                    sorted = true;
                } else {
                    changes = false;
                    i = 0;
                }
            }
            console.log(cardSuits[suit]);
            if (cardSuits[suit].length > 0) {
                console.log(cardSuits[suit]);
                output = [...output, ...cardSuits[suit]];
            }
        });
        console.log(output);
        return output;
    }
    //END DISPLAY FUNCTIONS

    //DISPLAY LOGIC
    // onvlcik for card, set card in hand and overall card pool to played
    // display on 1st game board by default, if not, move on to next available/possible board 
    // 
    const onClickHandler = (selectedCard) => {
        // e.preventDefault();
        // let selectedCard = e.target.value;
        console.log(selectedCard);
        if (cardsPlayed.length !== 0) {
            if (Math.abs(min[selectedCard.suit] - selectedCard.number) == 0 || Math.abs(max[selectedCard.suit] - selectedCard.number) == 0) {
                console.log(`roomCode ${roomCode}`);
                socket.emit("playedCard", {'roomCode':roomCode, 'selectedCard':selectedCard});
            } else {
                setErrors('Play a valid card');
            }
        } else if (selectedCard.uid.substring(1, 4) === '07S' && cardsPlayed.length == 0) {
            console.log(`roomCode ${roomCode}`);
            socket.emit("playedCard", {'roomCode':roomCode, 'selectedCard':selectedCard});
        } else {
            setErrors('Play your 7 of Spades');
        }
    }

    const getHandStyles = (i) => {
        return {
            position: 'absolute'
            , zindex: i
            , left: (i * 30) + 'px'
            , height: '120px'
            , width: '80px'
        }
    }

    //END DISPLAY LOGIC
    //

    return (
        <div className='gameContainer'>
            <div id="gameBoard">
                <div className='spades'>
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
                <div className='clubs'>
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
                <div className='diamonds'>
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
                <div className='hearts'>
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

            <div className="hand">
                <h1>{yourTurn && `Its your Turn ${playerName}!!`}</h1>
                <p>{errors}</p>

                <div className='cardInHandPostion' >
                    {yourTurn && hand.map((card, i) => {
                        return (
                            <div style={getHandStyles(i)}>
                                {!card.played && <img onClick={() => onClickHandler(card)} src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />}
                            </div>
                        )
                    })
                    }
                    {!yourTurn && hand.map((card, i) => {
                        return (
                            <div style={getHandStyles(i)}>
                                {!card.played && <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />}
                            </div>
                        )
                    })
                    }
                </div>
                {yourTurn ? <button>Pass</button> : ""}
            </div>
        </div>
    )

}

export default Game;


//