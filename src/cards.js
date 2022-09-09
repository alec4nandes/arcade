const ranks = ["Ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "Jack", "Queen", "King"],
    suits = ["Spades", "Hearts", "Clubs", "Diamonds"],
    emptySpace = { name: "" },
    emptyPair = { top: emptySpace, bottom: emptySpace },
    cornerIndexes = [0, 2, 5, 7];

function makeCards() {
    const result = [];
    suits.forEach((suit) =>
        ranks.forEach((rank) =>
            result.push({
                name: `${rank} of ${suit}`,
                rank_index: ranks.indexOf(rank),
                suit_index: suits.indexOf(suit),
                rank,
                suit,
                color: ["Hearts", "Diamonds"].includes(suit) ? "red" : "black",
            })
        )
    );
    return result;
}

const cards = makeCards();

const matchingPairs = cards.map((card) => ({ top: card, bottom: card }));

function getStartingHand(alreadyDrawn, size) {
    const available = matchingPairs.filter(
        (card) => !alreadyDrawn.includes(card)
    );
    if (!size) {
        return available;
    }
    const result = new Set();
    while (result.size < size) {
        result.add(available[~~(Math.random() * available.length)]);
    }
    return [...result];
}

function getStartingBoard(alreadyDrawn) {
    const result = getStartingHand(alreadyDrawn, 4);
    return [
        emptyPair,
        result[0],
        emptyPair,
        result[1],
        result[2],
        emptyPair,
        result[3],
        emptyPair,
    ];
}

function getGameData(username) {
    const playerDrawn = getStartingHand([], 7),
        opponentDrawn = getStartingHand(playerDrawn, 7),
        onTheBoard = getStartingBoard([...playerDrawn, ...opponentDrawn]),
        drawPile = getStartingHand([
            ...playerDrawn,
            ...opponentDrawn,
            ...onTheBoard,
        ]);
    return {
        player: username,
        playerTurn: true,
        playerDrawn,
        opponentDrawn,
        onTheBoard,
        drawPile,
    };
}

export default cards;
export {
    cornerIndexes,
    emptyPair,
    getGameData,
    getStartingBoard,
    getStartingHand,
};
