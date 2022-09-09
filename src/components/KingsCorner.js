import "../css/kings-corner.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "../database";
import { cornerIndexes, emptyPair, getGameData, getPlayers } from "../cards";
import Board from "./Board";
import Hand from "./Hand";

export default function KingsCorner({ gameKey, username }) {
    const players = getPlayers(gameKey),
        [currentPlayer, setCurrentPlayer] = useState(),
        [playerPicks, setPlayerPicks] = useState([]), // player can pick multiple ascending cards
        // new state: all hands
        [allHands, setAllHands] = useState(),
        [onTheBoard, setOnTheBoard] = useState(),
        [drawPile, setDrawPile] = useState(),
        [selected, setSelected] = useState(),
        drawnCardRef = useRef(),
        isYourTurn = currentPlayer === username;

    const isGameOver = useCallback(() => {
        return Object.values(allHands).find((hand) => !hand.length);
    }, [allHands]);

    const pairClickHandlerHelper = useCallback(
        (target, index, selected) => {
            const targetInCorner = cornerIndexes.includes(index),
                targetIsEmpty = target.top.name === emptyPair.top.name,
                selectedIsEmpty = selected?.top.name === emptyPair.top.name;

            if (
                selected &&
                (targetIsEmpty
                    ? targetInCorner
                        ? selected.top.rank === "King"
                        : !selectedIsEmpty
                    : target.bottom.rank_index ===
                          selected.top.rank_index + 1 &&
                      target.bottom.color !== selected.top.color)
            ) {
                return makeMove();
            } else if (!targetIsEmpty) {
                setSelected(target);
                setPlayerPicks([target]);
            }

            function makeMove() {
                const paired = {
                        top: targetIsEmpty ? selected.top : target.top,
                        bottom: selected.bottom,
                    },
                    topCardOnBoard = onTheBoard.includes(target),
                    bottomCardInHand = !onTheBoard.includes(selected),
                    bothInHand = [target, selected].every(
                        (p) => !onTheBoard.includes(p)
                    );
                if (topCardOnBoard) {
                    updateBoard(paired);
                    bottomCardInHand && removeFromHand();
                    return true;
                } else if (bothInHand) {
                    setSelected(paired);
                    setPlayerPicks((playerPicks) => [...playerPicks, target]);
                }
            }

            function updateBoard(paired) {
                const boardCopy = [...onTheBoard];
                boardCopy[index] = paired;
                if (boardCopy.includes(selected)) {
                    boardCopy[boardCopy.indexOf(selected)] = emptyPair;
                }
                updateDoc(doc(firestore, "Kings Corner", gameKey), {
                    onTheBoard: boardCopy,
                });
            }

            function removeFromHand() {
                const result = allHands[username]
                        .filter((p) => !playerPicks.includes(p))
                        .map((p) => ({ ...p, isNew: false })),
                    update = { allHands: { ...allHands } };
                update.allHands[username] = result;
                updateDoc(doc(firestore, "Kings Corner", gameKey), update);
            }
        },
        [allHands, gameKey, onTheBoard, playerPicks, username]
    );

    const pairClickHandler = useCallback(
        (target, index) =>
            isYourTurn && pairClickHandlerHelper(target, index, selected),
        [isYourTurn, pairClickHandlerHelper, selected]
    );

    const drawPileHandler = useCallback(() => {
        const pileCopy = [...drawPile],
            nextCard = pileCopy.pop(),
            update = { allHands: { ...allHands } };
        if (nextCard) {
            const result = [
                ...allHands[username].map((target) => ({
                    ...target,
                    isNew: false,
                })),
                { ...nextCard, isNew: true },
            ];
            update.allHands[username] = result;
        } else if (isYourTurn) {
            alert("NO MORE CARDS TO DRAW");
        }
        setPlayerPicks([]);
        updateDoc(doc(firestore, "Kings Corner", gameKey), {
            ...update,
            drawPile: pileCopy,
            currentPlayer:
                players[players.indexOf(currentPlayer) + 1] || players[0],
        });
    }, [
        allHands,
        currentPlayer,
        drawPile,
        gameKey,
        isYourTurn,
        players,
        username,
    ]);

    /* USE EFFECTS */

    // load game and set Firebase listener on first render
    useEffect(() => {
        function updateGame(gameData) {
            const { currentPlayer, allHands, onTheBoard, drawPile } = gameData;
            setCurrentPlayer(currentPlayer);
            setAllHands(allHands);
            setOnTheBoard(onTheBoard);
            setDrawPile(drawPile);
        }
        // load game from Firebase
        getDoc(doc(firestore, "Kings Corner", gameKey)).then((doc) =>
            updateGame(doc.data())
        );
        // listen for changes
        onSnapshot(doc(firestore, "Kings Corner", gameKey), (doc) =>
            updateGame(doc.data())
        );
    }, [gameKey, username]);

    // announce winner
    useEffect(() => {
        if (allHands && isGameOver()) {
            alert(`YOU ${allHands[username].length ? "LOST" : "WON"}`);
        }
    }, [allHands, isGameOver, username]);

    // scroll to newly drawn card in player's hand
    const myHand = allHands?.[username];
    useEffect(() => {
        if (drawnCardRef.current) {
            const { offsetHeight, offsetTop } = drawnCardRef.current,
                offsetBottom = offsetHeight + offsetTop,
                scrollTop =
                    offsetBottom > window.innerHeight / 2
                        ? offsetTop -
                          window.innerHeight / 2 +
                          offsetHeight / 2 -
                          50
                        : 0;
            drawnCardRef.current.parentNode.parentNode.scrollTo({
                top: scrollTop,
                behavior: "smooth",
            });
        }
    }, [myHand]);

    /* END USE EFFECTS */

    /* NESTED COMPONENTS */

    function DrawPile() {
        const gameOver = isGameOver();
        return (
            <button
                onClick={() =>
                    gameOver
                        ? updateDoc(
                              doc(firestore, "Kings Corner", gameKey),
                              getGameData(username)
                          )
                        : drawPileHandler()
                }
                disabled={gameOver ? false : !isYourTurn}
            >
                {gameOver ? "NEW GAME" : `DRAW CARD (${drawPile.length})`}
            </button>
        );
    }

    /* END NESTED COMPONENTS */

    return (
        <div className="kings-corner">
            {allHands && (
                <>
                    {players.map((player, i) => (
                        <Hand
                            {...{
                                key: `hand-${i + 1}`,
                                drawn: allHands[player],
                                title: player,
                                playerPicks,
                                drawnCardRef,
                                isActiveHand: currentPlayer === player,
                                isOpponent: player !== username,
                                pairClickHandler:
                                    player === username
                                        ? pairClickHandler
                                        : () => "",
                            }}
                        />
                    ))}
                    <Board
                        {...{
                            onTheBoard,
                            drawPile: <DrawPile />,
                            playerPicks,
                            pairClickHandler,
                        }}
                    />
                </>
            )}
        </div>
    );
}
