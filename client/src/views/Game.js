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
    const [give, setGive] = useState(false);
    const [host, setHost] = useState(false);
    const [hand, setHand] = useState([]);
    const [yourTurn, setYourTurn] = useState(false);
    const [errors, setErrors] = useState('');
    const [min, setMin] = useState({ 'C': { min: 7, cardsPlayed: [] }, 'D': { min: 7, cardsPlayed: [] }, 'H': { min: 7, cardsPlayed: [] }, 'S': { min: 7, cardsPlayed: [] } })
    const [max, setMax] = useState({ 'C': { max: 7, cardsPlayed: [] }, 'D': { max: 7, cardsPlayed: [] }, 'H': { max: 7, cardsPlayed: [] }, 'S': { max: 7, cardsPlayed: [] } })
    const [sevenClubsPlayed, setSevenClubsPlayed] = useState(false);
    const [images, setImages] = useState(imageLoader())


    // useEffect(() => {

    // }, [hand, yourTurn])

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

    socket.on('setCards', (obj) => {
        setSevenClubsPlayed(true);
        setMin(obj.min)
        setMax(obj.max)
    })

    socket.on('giveCard', (isGive) => {
        setGive(isGive);

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
    // onclick for card, set card in hand and overall card pool to played
    // display on 1st game board by default, if not, move on to next available/possible board 
    // 
    const onClickHandler = (selectedCard) => {
        console.log('Card Selected' + selectedCard.uid);
        console.log(selectedCard);
        if (selectedCard.uid.substring(1, 4) === '07S' && !sevenClubsPlayed) {
            selectedCard.played = true;
            setSevenClubsPlayed(true);
            setYourTurn(false);
            socket.emit("playedCard", { 'roomCode': roomCode, 'selectedCard': selectedCard });
        } else if (sevenClubsPlayed && (min[selectedCard.suit]['min'] - selectedCard.number == 0 || max[selectedCard.suit]['max'] - selectedCard.number == 0)) {
            selectedCard.played = true;
            socket.emit("playedCard", { 'roomCode': roomCode, 'selectedCard': selectedCard });
            setYourTurn(false);
        } else {
            if (sevenClubsPlayed) {
                setErrors('Play a valid card');
            } else {
                setErrors('Play your 7 of Spades');
            }
        }
        if(give) {
            setHand(hand.filter(card => card.uid != selectedCard.uid));
            socket.emit("handCard", {'selectedCard': selectedCard, 'roomCode': roomCode});
        }
    }

    const passTurn = () => {
        socket.emit("pass", roomCode);
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
            {give ? <div>Select a card to pass on</div> : ""}
            <div id="gameBoard">
                <div className='spades'>
                    Spades
                    <div>
                        {min['S']['cardsPlayed'].map((card, i) => {
                            return (
                                <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            )
                        })}
                    </div>
                    <div>
                        {max['S']['cardsPlayed'].map((card, i) => {
                            return (
                                <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            )
                        })}
                    </div>
                </div>
                <div className='clubs'>
                    Clubs
                    <div>
                        {min['C']['cardsPlayed'].map((card, i) => {
                            return (
                                <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            )
                        })}
                    </div>
                    <div>
                        {max['C']['cardsPlayed'].map((card, i) => {
                            return (
                                <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            )
                        })}
                    </div>
                </div>
                <div className='diamonds'>
                    Diamonds
                    <div>
                        {min['D']['cardsPlayed'].map((card, i) => {
                            return (
                                <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            )
                        })}
                    </div>
                    <div>
                        {max['D']['cardsPlayed'].map((card, i) => {
                            return (
                                <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            )
                        })}
                    </div>
                </div>
                <div className='hearts'>
                    Hearts
                    <div>
                        {min['H']['cardsPlayed'].map((card, i) => {
                            return (
                                <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            )
                        })}
                    </div>
                    <div>
                        {max['H']['cardsPlayed'].map((card, i) => {
                            return (
                                <img src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            )
                        })}
                    </div>
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
                {yourTurn ? <button onClick={() => passTurn()}>Pass</button> : ""}
            </div>
        </div>
    )

}

export default Game;


//