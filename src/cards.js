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

/* MULTIPLAYER */

const getPlayers = (gameKey) => gameKey.split("-");

function recursiveDealer(players) {
    const result = {};
    recursiveDealerHelper(players, players[0], result);
    return result;
}

function recursiveDealerHelper(players, player, result) {
    const alreadyDrawn = Object.values(result).flat(),
        index = players.indexOf(player);
    result[player] = getStartingHand(alreadyDrawn, 7);
    if (index < players.length - 1) {
        recursiveDealerHelper(players, players[index + 1], result);
    }
}

/* END MULTIPLAYER */

function getGameData(username, players) {
    const allHands = recursiveDealer(players),
        allHandsCards = Object.values(allHands).flat(),
        onTheBoard = getStartingBoard(allHandsCards),
        drawPile = getStartingHand([...allHandsCards, ...onTheBoard]);
    return {
        currentPlayer: username,
        allHands,
        onTheBoard,
        drawPile,
    };
}

export default cards;
export {
    cornerIndexes,
    emptyPair,
    getGameData,
    getPlayers,
    getStartingBoard,
    getStartingHand,
};