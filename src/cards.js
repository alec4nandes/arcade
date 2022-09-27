import logo from "./images/kings-corner-logo-purple-small.png";
import nightLogo from "./images/kings-corner-logo-purple-nightmode-small.png";

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

// gameplay order goes by who has most wins.
// if win counts are the same, it's alphabetical.
function sortPlayers(scores) {
    return Object.entries(scores)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([player]) => player);
}

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

function getGameData(scores, players) {
    players = players || sortPlayers(scores);
    const allHands = recursiveDealer(players),
        allHandsCards = Object.values(allHands).flat(),
        onTheBoard = getStartingBoard(allHandsCards),
        drawPile = getStartingHand([...allHandsCards, ...onTheBoard]);
    return {
        id: new Date().getTime(),
        currentPlayer: players[0],
        allHands,
        onTheBoard,
        drawPile,
    };
}

/* CHANGE LOGOS WITH DARK MODE */

window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
        [...document.getElementsByClassName("logo")].forEach((img) => {
            img.src = event.matches ? nightLogo : logo;
        });
    });

/* END CHANGE LOGOS WITH DARK MODE */

window.addEventListener("orientationchange", (event) => {
    [...document.getElementsByClassName("hand-container")].forEach((elem) =>
        elem.scrollTo(0, 0)
    );
});

export default cards;
export {
    ranks,
    cornerIndexes,
    emptyPair,
    getGameData,
    sortPlayers,
    getStartingBoard,
    getStartingHand,
};
