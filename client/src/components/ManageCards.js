export const sortHand = (hand) => {
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
        } else if (cardSuits[suit].length === 1) {
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

export const getSuitNames = (suit = 'All') => {
    let suitNames = { 'S': 'Spades', 'D': 'Diamonds', 'H': 'Hearts', 'C': 'Clubs' };
    if (suit === 'All') return suitNames;
    return suitNames[suit];
}