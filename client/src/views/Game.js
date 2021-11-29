import React, { useContext, useState } from 'react'
import { useHistory } from 'react-router';
import { SocketContext } from "../context/Socket";
import imageLoader from '../images/images';
import { sortHand, getSuitNames } from '../components/ManageCards';
import { getHandStyles, getSuitStackMaxStyles, getSuitStackMinStyles } from '../components/StyleFunctions';

const Game = (props) => {
    const socket = useContext(SocketContext);
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('Vader');
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
    const [images] = useState(imageLoader());
    const [scores, setScores] = useState({});
    const [pointLimit, setPointLimit] = useState(250);
    const history = useHistory();

    //PLAYER INIT ROUTES
    socket.on('playerInfo', (playerInfo) => {
        console.log(`roomCode ${playerInfo.roomCode}`);
        setRoomCode(playerInfo.roomCode);
        setPlayerName(playerInfo.name);
        setScores(playerInfo.scores);
        setPointLimit(playerInfo.pointLimit);
    });

    socket.on('setHost', () => {
        setHost(true);
    });

    //END PLAYER INIT ROUTES

    //PLAYER TURN ROUTES
    socket.off('yourTurn').on('yourTurn', (isTurn) => {
        setYourTurn(isTurn);
        console.log(`YourTurn: ${yourTurn}`);
        if (yourTurn) {
            socket.emit("myTurn", roomCode);
        }
    });
    //END PLAYER TURN ROUTES

    //CARD MOVEMENT ROUTES
    socket.off('playerHand').on('playerHand', hand => {
        setHand(sortHand(hand));
    });

    socket.off('jokerPlayed').on('jokerPlayed', (selectedCard) => {
        let tempHand = hand;
        for (let i = 0; i < tempHand.length; ++i) {
            if (tempHand[i].number === selectedCard.number && tempHand[i].suit === selectedCard.suit) tempHand[i].value = 50;
        }
        setHand(tempHand);
    })

    socket.off('setCards').on('setCards', (obj) => {
        if (obj.min.S.min === 7) setSevenClubsPlayed(false);
        else setSevenClubsPlayed(true);
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
        setHand(sortHand([...hand, card]));
    })

    //END CARD MOVEMENT ROUTES

    //SCORE ROUTES
    socket.off('getScore').on('getScore', (socketId) => {
        let score = 0;
        let cardsLeft = hand.filter(card => !card.played);
        for (let i = 0; i < cardsLeft.length; i++) {
            score += cardsLeft[i].value;
        }
        socket.emit("setScore", { 'score': score, 'roomCode': roomCode });
    })

    socket.off('setScores').on('setScores', (obj) => {
        console.log('scores set');
        console.log(obj);
        setScores(obj);
    });
    //END SCORE ROUTES

    //GAME END
    socket.off('gameOver').on('gameOver', (roomCode) => {
        history.push('/gameEnd/' + roomCode);
    })
    //END GAME END

    //GAME LOGIC
    const playCard = (selectedCard) => {
        console.log('made it through card logic');
        if (selectedCard.uid === '00A') socket.emit('jokerPlayed', { 'roomCode': roomCode, 'selectedCard': selectedCard });
        resetTurn();
        if (hand.length > 1) {
            setHand(hand.filter(card => card.uid !== selectedCard.uid));
            socket.emit("playedCard", { 'roomCode': roomCode, 'selectedCard': selectedCard });
        } else {
            setHand([]);
            socket.emit("roundOver", roomCode);
        }
        console.log('hand');
        console.log(hand);
    }

    const getPlays = (selectedCard) => {
        let suitNames = getSuitNames();
        let plays = [];
        let cardNames = ['', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace']
        if (selectedCard.number === 0) {
            Object.keys(min).forEach((suit) => {
                // console.log(`suit ${suit}`);
                // console.log(`suit min ${min[suit]['min']}`);
                // console.log(`suit max ${min[suit]['max']}`);
                if (min[suit]['min'] >= 1) plays.push({ 'suit': suit, 'number': min[suit]['min'], 'desc': `${cardNames[min[suit]['min']]} of ${suitNames[suit]}` });
                if (min[suit]['min'] !== max[suit]['max'] && max[suit]['max'] <= 14) plays.push({ 'suit': suit, 'number': max[suit]['max'], 'desc': `${cardNames[max[suit]['max']]} of ${suitNames[suit]}` });
            });
        } else {
            if (min[selectedCard.suit]['min'] === 1) plays.push({ 'suit': selectedCard.suit, 'number': 1, 'desc': `${cardNames[min[selectedCard.suit]['min']]} of ${suitNames[selectedCard.suit]}` });
            if (max[selectedCard.suit]['max'] === 14) plays.push({ 'suit': selectedCard.suit, 'number': 14, 'desc': `${cardNames[max[selectedCard.suit]['max']]} of ${suitNames[selectedCard.suit]}` });
            console.log(`max of ace selected ${max[selectedCard.suit]['max']}`)
        }
        console.log('selected playes vvvvvvv');
        console.log(plays);
        if (plays.length === 1) {
            console.log('only one play');
            selectedCard.number = plays[0].number;
            selectedCard.suit = plays[0].suit;
            onClickHandler(selectedCard);
        }else{
            setSelectPlay(plays);
        }
    }

    const passTurn = () => {
        console.log('turn passed');
        socket.emit('pass', roomCode);
        resetTurn();
    }

    const resetTurn = () => {
        setYourTurn(false);
        setCardSelected({ uid: '', number: 0, suit: '' });
        setErrors('');
        setSelectPlay([]);
        setGive(false);
    }

    //END GAME LOGIC




    //HANDLERS
    const onClickHandler = (selectedCard) => {
        console.log('Card Selected' + selectedCard.uid);
        console.log(selectedCard);

        if (give) {
            console.log('made it through is give');
            socket.emit("handCard", { 'selectedCard': selectedCard, 'roomCode': roomCode });
            resetTurn();
            if (hand.length > 1) setHand(hand.filter(card => card.uid !== selectedCard.uid));
            else {
                setHand([]);
                socket.emit("roundOver", roomCode);
            }
            console.log(`Hand Length ${hand.length}`);
            console.log(hand);
        } else if (selectedCard.uid !== cardSelected.uid && selectedCard.number <= 1) {
            console.log("Getting Plays")
            setCardSelected(selectedCard);
            getPlays(selectedCard);
        } else if (sevenClubsPlayed && min[selectedCard.suit]['min'] - selectedCard.number === 0 && selectedCard.number > min['S']['min']) {
            playCard(selectedCard)
        } else if (sevenClubsPlayed && max[selectedCard.suit]['max'] - selectedCard.number === 0 && max['S']['max'] > selectedCard.number) {
            playCard(selectedCard);
        } else if (selectedCard.suit === 'S' && min[selectedCard.suit]['min'] - selectedCard.number === 0) {
            playCard(selectedCard);
        } else if (selectedCard.suit === 'S' && max[selectedCard.suit]['max'] - selectedCard.number === 0) {
            playCard(selectedCard);
        } else if (selectedCard.uid.substring(1, 4) === '07S' && !sevenClubsPlayed) {
            playCard(selectedCard);
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
    //END HANDLERS

    return (
        <div className='gameContainer background'>
            {give ? <div>Select a card to pass on</div> : ""}
            <div className="gameBoard">
                <div className='spades suitStack'>
                    <div >
                        {min['S']['cardsPlayed'].map((card, i) => {
                            return (

                                <img style={getSuitStackMinStyles(i)} className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />

                            )
                        })}
                    </div>
                    <div>
                        {max['S']['cardsPlayed'].map((card, i) => {
                            return (
                                <div style={getSuitStackMaxStyles(i)}>
                                    <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className='clubs suitStack'>
                    {min['C']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackMinStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                    {max['C']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackMaxStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                </div>
                <div className='diamonds suitStack'>
                    {min['D']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackMinStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                    {max['D']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackMaxStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                </div>
                <div className='hearts suitStack'>
                    {min['H']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackMinStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                    {max['H']['cardsPlayed'].map((card, i) => {
                        return (
                            <div style={getSuitStackMaxStyles(i)}>
                                <img className="cardImg" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="info">
                <div className="pointLimit">
                    <h2><u>Play To</u></h2>
                    <p>{pointLimit}</p>
                    <h2><u>Player</u></h2>
                    <p>{playerName}</p>
                </div>
                <div className='messages'>
                    <h1>{!give && yourTurn && `Its Your Turn`}</h1>
                    <h1>{give && `Please Pass A Card`}</h1>
                    <p>{errors}</p>
                </div>
                <div className='scores'>
                    <h2><u>Scores!</u></h2>
                    {Object.keys(scores).map((name) => {
                        return (<p>{name}: {scores[name]}</p>)
                    })}
                </div>
            </div>
            <div className="hand">
                <div className='cardInHandPostion' >
                    {yourTurn && hand.map((card, i) => {
                        return (
                            <div style={getHandStyles(i)}>
                                {!card.played && <img className="cardImg card" onClick={() => onClickHandler(card)} src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />}
                            </div>
                        )
                    })
                    }
                    {!yourTurn && hand.map((card, i) => {
                        return (
                            <div style={getHandStyles(i)}>
                                {!card.played && <img className="cardImg card" src={images[`Minicard_${card.uid.substring(1)}`]} alt={card.uid.substring(1)} />}
                            </div>
                        )
                    })
                    }
                </div>
            </div>
            <div className='options '>
                {cardSelected.uid !== '' && <div className="options optionsBackground">
                    {cardSelected.number ? <p>{`Choose a play for ${cardSelected.cardName} of ${getSuitNames(cardSelected.suit)}`}</p> : <p>{`Choose a play for the Joker`}</p>}
                    <div className="cardSelect">
                        <select onChange={playHandler} className="select">
                            <option value="" selected>Select A Card</option>
                            {selectPlay.map((option, i) => {
                                return (<option value={i}>{option.desc}</option>)
                            })
                            }
                        </select>
                        <button className="button" onClick={() => { if (play.hasOwnProperty('suit')) { optionHandler() } }}>Play Card</button>
                    </div>
                </div>}
                {yourTurn && !give && <button className='button colorOrange buttonContainer' onClick={() => passTurn()}>Pass</button>}
            </div>
        </div>
    )
}

export default Game;


//