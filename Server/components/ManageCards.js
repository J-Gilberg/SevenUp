exports.shuffle = (cardPool) => {
    console.log('shuffling');
    for (let i = cardPool.length - 1; i >= 0; i--) {
        let x = Math.floor(Math.random() * i + 1);
        [cardPool[i], cardPool[x]] = [cardPool[x], cardPool[i]];
    }
    return cardPool
}

exports.buildDeck = (playerCount) => {
    console.log('building deck');
    // < 6 => 1 deck
    // everyone needs 10+ cards
    let numDecks = Math.ceil(10 / (53 / playerCount));
    let oneDeck = [];
    let cardPool = [];
    let suits = ['S', 'D', 'C', 'H'];
    let cardNames = ['Joker', 'Ace', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
    let cardValue;
    let joker = {
        number: 0
        , cardName : cardNames[0]
        , suit: "A"
        , value: 50
        , played: false
        , uid: '00A'
    }

    for (var i = 0; i < numDecks; ++i) {
        oneDeck = [];
        for (var j = 0; j < 4; ++j) {
            for (var k = 1; k <= 13; ++k) {
                if (k === 1) {
                    cardValue = 15;
                }
                else if (k <= 10) {
                    cardValue = k;
                }
                else {
                    cardValue = 10;
                }
                let strK = '0' + k
                oneDeck.push({
                    number: k
                    , suit: suits[j]
                    , cardName: cardNames[k]
                    , value: cardValue
                    , played: false
                    , uid: `${i}${strK.substring(strK.length - 2, strK.length)}${suits[j]}`
                })
            }
        }
        joker.uid = i + joker.uid;
        cardPool = [...cardPool, ...oneDeck, joker];
    }
    return cardPool;
}