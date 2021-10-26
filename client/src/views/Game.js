import e from 'cors';
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
    const [selectPlay, setSelectPlay] = useState([]);
    const [cardSelected, setCardSelected] = useState({ uid: '', number: 0, suit: '' });
    const [hand, setHand] = useState([]);
    const [play, setPlay] = useState({});
    const [yourTurn, setYourTurn] = useState(false);
    const [errors, setErrors] = useState('');
    const [min, setMin] = useState({ 'C': { min: 7, cardsPlayed: [] }, 'D': { min: 7, cardsPlayed: [] }, 'H': { min: 7, cardsPlayed: [] }, 'S': { min: 7, cardsPlayed: [] } })
    const [max, setMax] = useState({ 'C': { max: 7, cardsPlayed: [] }, 'D': { max: 7, cardsPlayed: [] }, 'H': { max: 7, cardsPlayed: [] }, 'S': { max: 7, cardsPlayed: [] } })
    const [sevenClubsPlayed, setSevenClubsPlayed] = useState(false);
    const [images, setImages] = useState(imageLoader());
    const [scores, setScores] = useState({});

    // useEffect(() => {
    // }, [yourTurn])

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

    socket.off('yourTurn').on('yourTurn', (isTurn) => {
        setYourTurn(isTurn);
        console.log(`YourTurn: ${yourTurn}`)
        if (yourTurn) {
            socket.emit("myTurn", roomCode);
        }
    });

    socket.off('playerHand').off('playerHand').on('playerHand', hand => {
        setHand(sortHand(hand));
    });

    socket.off('setCards').on('setCards', (obj) => {
        setSevenClubsPlayed(true);
        setMin(obj.min);
        setMax(obj.max);
    })

    socket.off('giveCard').on('giveCard', (isGive) => {
        setGive(isGive);
        setYourTurn(isGive);
        console.log(`YourTurn: ${yourTurn}`)
        if (yourTurn) {
            socket.emit("myTurn", roomCode);
        }
    })

    socket.off('handCard').on('handCard', (card) => {
        setHand([...hand, card]);
    })

    socket.off('getScore').on('getScore', (socketId) => {
        let score = 0;
        let cardsLeft = hand.filter(card => !card.played);
        for (let i = 0; i < cardsLeft.length; i++) {
            score += cardsLeft[i].value;
        }
        socket.emit("getScore", { 'score': score, 'roomCode': roomCode });
    })

    socket.off('setScores').on('setScores',(obj)=>{
        setScores(obj);
    });

    //END GAME LOGIC

    //DISPLAY FUNCTIONS
    const sortHand = (hand) => {
        let cardSuits = { 'S': [], 'D': [], 'C': [], 'H': [], 'A': [] }
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
        if (give) {
            setHand(hand.filter(card => card.uid != selectedCard.uid));
            setYourTurn(false);
            setGive(false);
            setErrors('');
            socket.emit("handCard", { 'selectedCard': selectedCard, 'roomCode': roomCode });
        } else if (selectedCard.suit === 'A') {
            getPlays(selectedCard);
            setCardSelected(selectedCard);
        } else if (
            sevenClubsPlayed
            && (
                (
                    (min[selectedCard.suit]['min'] - selectedCard.number == 0 && selectedCard.number - min['S']['min'] > 0)
                    || (max[selectedCard.suit]['max'] - selectedCard.number == 0 && max['S']['max'] - selectedCard.number > 0)
                )
                || (
                    selectedCard.suit == 'S' && (min[selectedCard.suit]['min'] - selectedCard.number == 0)
                    || (max[selectedCard.suit]['max'] - selectedCard.number == 0)
                )
            )
        ) {
            if (selectedCard.uid != cardSelected.uid && selectedCard.number <= 1) {
                getPlays(selectedCard);
                setCardSelected(selectedCard);
            } else {
                selectedCard.played = true;
                setYourTurn(false);
                setErrors('');
                setSelectPlay([]);
                console.log(hand.filter(card => !card.played).length);
                if (hand.filter(card => !card.played).length == 0) {
                    socket.emit("roundOver", roomCode);
                } else {
                    socket.emit("playedCard", { 'roomCode': roomCode, 'selectedCard': selectedCard });
                }
            }
        } else if (selectedCard.uid.substring(1, 4) === '07S' && !sevenClubsPlayed) {
            selectedCard.played = true;
            setSevenClubsPlayed(true);
            setYourTurn(false);
            setErrors('');
            cardSelected.uid = ''
            socket.emit("playedCard", { 'roomCode': roomCode, 'selectedCard': selectedCard });

        } else {
            if (sevenClubsPlayed) {
                setErrors('Play a valid card');
            } else {
                setErrors('Play your 7 of Spades');
            }
        }
    }
    const playHandler = (e) => {
        e.preventDefault();
        console.log(selectPlay[e.target.value]);
        setPlay(selectPlay[e.target.value]);
        console.log(play);
    }
    const optionHandler = () => {
        let tempCard = cardSelected;
        tempCard.number = play.number;
        tempCard.suit = play.suit;
        onClickHandler(tempCard);
        setCardSelected({ uid: '', number: 0, suit: '' });
    }

    const getPlays = (selectedCard) => {
        let suitNames = getSuitNames();
        if (selectedCard.number === 0) {
            let plays = [];
            Object.keys(min).forEach((suit) => {
                console.log(`suit ${suit}`);
                console.log(`suit min ${min[suit]['min']}`);
                console.log(`suit max ${min[suit]['max']}`);

                if (min[suit]['min'] >= 1) plays.push({ 'suit': suit, 'number': min[suit]['min'], 'desc': `${min[suit]['min']} of ${suitNames[suit]}` });
                if (max[suit]['max'] <= 14) plays.push({ 'suit': suit, 'number': max[suit]['max'], 'desc': `${max[suit]['max']} of ${suitNames[suit]}` });
            });
            setSelectPlay(plays);
            console.log(selectPlay);
        } else {
            if (min[selectedCard.suit]['min'] == 1) setSelectPlay([...selectPlay, { 'suit': selectedCard.suit, 'number': min[selectedCard.suit]['min'], 'desc': `${min[selectedCard.suit]['min']} of ${suitNames[selectedCard.suit]}` }]);
            if (max[selectedCard.suit]['max'] == 14) setSelectPlay([...selectPlay, { 'suit': selectedCard.suit, 'number': max[selectedCard.suit]['max'], 'desc': `${max[selectedCard.suit]['max']} of ${suitNames[selectedCard.suit]}` }]);
        }
        if (selectPlay.length === 1) {
            selectedCard.number = selectPlay[0].number;
            selectedCard.suit = selectPlay[0].suit;
            onClickHandler(selectedCard);
        }
    }

    const passTurn = () => {
        console.log('turn passed');
        socket.emit('pass', roomCode);
        setYourTurn(false);
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

    const getSuitStackStyles = (i) => {
        return {
            position: 'absolute'
            , zindex: i
            , top: (i * 30) + 'px'
            , height: '120px'
            , width: '80px'
        }
    }

    const getSuitNames = (suit = 'All') => {
        let suitNames = { 'S': 'Spades', 'D': 'Diamonds', 'H': 'Hearts', 'C': 'Clubs' };
        if (suit === 'All') return suitNames;
        return suitNames[suit];
    }

    //END DISPLAY LOGIC
    //

    return (
        <div className='gameContainer'>
            {give ? <div>Select a card to pass on</div> : ""}
            <div className="gameBoard">
                <div className='spades suitStack'>
                    {min['S']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                    {max['S']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                </div>
                <div className='clubs suitStack'>
                    {min['C']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                    {max['C']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                </div>
                <div className='diamonds suitStack'>
                    {min['D']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                    {max['D']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                </div>
                <div className='hearts suitStack'>
                    {min['H']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                    {max['H']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className='messages'>
                <h1>{yourTurn && `Its your Turn ${playerName}!!`}</h1>
                <h1>{give && `Please Pass a Card`}</h1>
                <h1>{cardSelected.uid != '' && 'Select A Play'}</h1>
                <p>{errors}</p>
            </div>
            <div className="hand">
                <div className='cardInHandPostion' >
                    {yourTurn && hand.map((card, i) => {
                        return (
                            <div style={getHandStyles(i)}>
                                {!card.played && <img className="cardImg" onClick={() => onClickHandler(card)} src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />}
                            </div>
                        )
                    })
                    }
                    {!yourTurn && hand.map((card, i) => {
                        return (
                            <div style={getHandStyles(i)}>
                                {!card.played && <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />}
                            </div>
                        )
                    })
                    }
                </div>
            </div>
            {cardSelected.uid != '' && <div>
                {cardSelected.number ? <p>{`Choose a play for ${cardSelected.number} of ${getSuitNames(cardSelected.suit)}`}</p> : <p>{`Choose a play for the Joker`}</p>}
                <select onChange={playHandler}>
                    <option value="" selected>Select A Card</option>
                    {selectPlay.map((option, i) => {
                        return (<option value={i}>{option.desc}</option>)
                    })
                    }
                </select>
                <button onClick={() => { if (play.hasOwnProperty('suit')) { optionHandler() } }}>Play Card</button>
            </div>
            }
            {yourTurn && !give && <button onClick={() => passTurn()}>Pass</button>}
        </div>
    )

}

export default Game;


//