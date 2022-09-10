import "../css/board.css";
import React from "react";
import { cornerIndexes } from "../cards";
import Pair from "./Pair";

export default function Board({
    onTheBoard,
    drawPile,
    playerPicks,
    successfulPlay,
    isOpponent,
    pairClickHandler,
}) {
    /* NESTED COMPONENTS */

    function Square({ pair, index }) {
        const className = `square ${
            cornerIndexes.includes(index) ? "corner" : "side"
        } ${
            [0, 1, 2].includes(index)
                ? "top"
                : [3, 4].includes("index")
                ? "middle"
                : [5, 6, 7].includes(index)
                ? "bottom"
                : ""
        } ${
            [0, 3, 5].includes(index)
                ? "left"
                : [2, 4, 7].includes(index)
                ? "right"
                : ""
        }`;
        return (
            <>
                <div className={className}>
                    <Pair
                        {...{
                            pair,
                            playerPicks,
                            successfulPlay,
                            isOpponent,
                            pairClickHandler: () =>
                                pairClickHandler(pair, index),
                        }}
                    />
                </div>
                {index === 3 && (
                    <div className="square draw-pile">{drawPile}</div>
                )}
            </>
        );
    }

    /* END NESTED COMPONENTS */

    return (
        <div className="board-container">
            <div className="board">
                {onTheBoard.map((pair, index) => (
                    <Square {...{ key: `square ${index + 1}`, pair, index }} />
                ))}
            </div>
        </div>
    );
}
