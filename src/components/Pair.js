import { useRef } from "react";
import { ranks, emptyPair } from "../cards";

export default function Pair({
    pair,
    style,
    playerPicks,
    drawnCardRef,
    successfulPlay,
    isOpponent,
    pairClickHandler,
}) {
    const otherRef = useRef();

    const className = `${
        successfulPlay?.top.name === pair.top.name
            ? "success"
            : playerPicks.map((pair) => pair.top.name).includes(pair.top.name)
            ? "selected"
            : isOpponent
            ? "backside"
            : pair.top.name === emptyPair.top.name
            ? "empty"
            : ""
    }`;

    function InBetweenCards() {
        const ranksBetween =
            pair.top.name !== emptyPair.top.name &&
            ranks.indexOf(pair.top.rank) - ranks.indexOf(pair.bottom.rank);
        return (
            ranksBetween &&
            new Array(ranksBetween - 1)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={`in between card ${pair.top}-${pair.bottom} ${i}`}
                        className="in-between-card"
                    ></div>
                ))
        );
    }

    return (
        <div
            className={`pair ${className} ${pair.isNew ? "new" : ""}`}
            onClick={pairClickHandler}
            style={style}
            ref={pair.isNew ? drawnCardRef : otherRef}
        >
            <Card card={pair.top} />
            {pair.top.name !== pair.bottom.name && (
                <div className="stacked">
                    <InBetweenCards />
                    <Card card={pair.bottom} />
                </div>
            )}
        </div>
    );
}

function Card({ card }) {
    return (
        <div
            className={`card ${card.color || ""}`}
            style={{ backgroundImage: `url(${getCardImage(card)})` }}
            alt={`${card.rank} of ${card.suit}`}
        />
    );
}

/* GET CARD IMAGE */

function importAll(r) {
    let images = {};
    r.keys().forEach((item) => {
        images[item.replace("./", "")] = r(item);
    });
    return images;
}

const images = importAll(
    require.context("../images/cards", false, /\.(png|jpg|jpeg|svg)$/)
);

function getCardImage(card) {
    if (card.name !== emptyPair.top.name) {
        const { rank, suit } = card,
            fileName =
                [rank, suit].join("_of_").toLowerCase() +
                (isNaN(rank) && rank !== "Ace" ? "2" : "");
        return images[`${fileName}.jpg`];
    }
}

/* END GET CARD IMAGE */
