import { useRef } from "react";
import { emptyPair } from "../cards";

export default function Pair({
    pair,
    style,
    playerPicks,
    drawnCardRef,
    isOpponent,
    pairClickHandler,
}) {
    const otherRef = useRef();

    const className = `${
        playerPicks.includes(pair)
            ? "selected"
            : isOpponent
            ? "backside"
            : pair.top.name === emptyPair.top.name
            ? "empty"
            : ""
    }`;

    return (
        <div
            className={`pair ${className} ${pair.isNew ? "new" : ""}`}
            onClick={pairClickHandler}
            style={style}
            ref={pair.isNew ? drawnCardRef : otherRef}
        >
            <Card card={pair.top} />
            {pair.top.name !== pair.bottom.name && <Card card={pair.bottom} />}
        </div>
    );
}

function Card({ card }) {
    return <div className={`card ${card.color}`}>{card.name}</div>;
}
