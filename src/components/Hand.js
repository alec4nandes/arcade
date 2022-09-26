import { emptyPair } from "../cards";
import Pair from "./Pair";

const cardHeight = 150,
    overlapFactor = 100,
    sortHand = (a, b) =>
        b.top.rank_index - a.top.rank_index ||
        a.top.suit_index - b.top.suit.index;

export default function Hand({
    drawn,
    title,
    wins,
    playerPicks,
    drawnCardRef,
    isActiveHand,
    isOpponent,
    pairClickHandler,
}) {
    const containerHeight =
        cardHeight + (cardHeight - overlapFactor) * drawn.length + "px";

    return (
        <div
            className={`hand-container ${
                isOpponent ? "" : `mine ${isActiveHand ? "my-turn" : ""}`
            }`}
        >
            <div className="player-summary">
                <div className={`${isActiveHand ? "active" : ""}`}>
                    {(wins || wins === 0) && <div className="wins">{wins}</div>}
                    <h2>{title}</h2>
                </div>
                <h3>({drawn.length} cards)</h3>
            </div>
            <div className="hand" style={{ height: containerHeight }}>
                {[...drawn].sort(sortHand).map((pair, i) => (
                    <Pair
                        {...{
                            key: `${pair.top.name} ${pair.bottom.name}`,
                            pair: isOpponent ? emptyPair : pair,
                            style: { top: `-${overlapFactor * i}px` },
                            playerPicks,
                            drawnCardRef,
                            isOpponent,
                            pairClickHandler: () => pairClickHandler(pair),
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
