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
    playerPicks,
    drawnCardRef,
    isActiveHand,
    isOpponent,
    pairClickHandler,
}) {
    const containerHeight =
        cardHeight + (cardHeight - overlapFactor) * drawn.length + "px";

    return (
        <div className="hand">
            <h2 className={isActiveHand ? "active" : ""}>{title}</h2>
            <h3>({drawn.length} cards)</h3>
            <div className="hand-container" style={{ height: containerHeight }}>
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
