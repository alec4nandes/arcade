import "../css/kings-corner.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "../database";
import { cornerIndexes, emptyPair, getGameData, getPlayers } from "../cards";
import Board from "./Board";
import Hand from "./Hand";

export default function KingsCorner({ gameKey, setCurrentGameKey, username }) {
    const players = getPlayers(gameKey),
        [currentPlayer, setCurrentPlayer] = useState(),
        [playerPicks, setPlayerPicks] = useState([]), // player can pick multiple ascending cards
        // new state: all hands
        [allHands, setAllHands] = useState(),
        [onTheBoard, setOnTheBoard] = useState(),
        [drawPile, setDrawPile] = useState(),
        [selected, setSelected] = useState(),
        [successfulPlay, setSuccessfulPlay] = useState(),
        [isGameCancelled, setIsGameCancelled] = useState(false),
        drawnCardRef = useRef(),
        isYourTurn = currentPlayer === username;

    const cpuOrHuman = useCallback(
        () => (currentPlayer === "$cpu" ? "$cpu" : username),
        [currentPlayer, username]
    );

    const getHand = useCallback(
        () => allHands[cpuOrHuman()],
        [allHands, cpuOrHuman]
    );

    const isGameOver = useCallback(() => {
        return allHands && Object.values(allHands).find((hand) => !hand.length);
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
            } else if (currentPlayer !== "$cpu" && !targetIsEmpty) {
                setSelected(target);
                setPlayerPicks([target]);
                setSuccessfulPlay();
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
                currentPlayer === "$cpu" && setSelected(selected);

                if (topCardOnBoard) {
                    // a successful play
                    if (currentPlayer === "$cpu") {
                        setPlayerPicks([selected]);
                        // delayed effect for computer double-highlight
                        setTimeout(onSuccess, 400);
                    } else {
                        onSuccess();
                    }
                    return true;
                } else if (currentPlayer !== "$cpu" && bothInHand) {
                    setSelected(paired);
                    setPlayerPicks((playerPicks) => [...playerPicks, target]);
                }

                function onSuccess() {
                    bottomCardInHand && removeFromHand();
                    updateBoard(paired);
                    setSelected();
                    setPlayerPicks([]);
                    setSuccessfulPlay(paired);
                }
            }

            function removeFromHand() {
                const result = getHand()
                        .filter((p) =>
                            currentPlayer === "$cpu"
                                ? p !== selected
                                : !playerPicks.includes(p)
                        )
                        .map((p) => ({ ...p, isNew: false })),
                    update = { allHands: { ...allHands } };
                update.allHands[cpuOrHuman()] = result;
                updateDoc(doc(firestore, "Games", gameKey), update);
            }

            function updateBoard(paired) {
                const boardCopy = [...onTheBoard];
                boardCopy[index] = paired;
                if (boardCopy.includes(selected)) {
                    boardCopy[boardCopy.indexOf(selected)] = emptyPair;
                }
                updateDoc(doc(firestore, "Games", gameKey), {
                    onTheBoard: boardCopy,
                });
            }
        },
        [
            allHands,
            cpuOrHuman,
            currentPlayer,
            gameKey,
            getHand,
            onTheBoard,
            playerPicks,
        ]
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
                ...getHand().map((pair) => ({
                    ...pair,
                    isNew: false,
                })),
                { ...nextCard, isNew: true },
            ];
            update.allHands[cpuOrHuman()] = result;
        } else if (isYourTurn) {
            alert("NO MORE CARDS TO DRAW");
        }
        setPlayerPicks([]);
        setSuccessfulPlay();
        updateDoc(doc(firestore, "Games", gameKey), {
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
        getHand,
        isYourTurn,
        players,
        cpuOrHuman,
    ]);

    /* COMPUTER PLAYS */

    const computerPlays = useCallback(() => {
        const hand = allHands["$cpu"];
        return (
            hand.length &&
            onTheBoard.find((target, i) =>
                [...onTheBoard, ...hand].find((selected, j) => {
                    const targetInCorner = cornerIndexes.includes(i),
                        selectedInCorner = cornerIndexes.includes(j);
                    return (
                        // don't needlessly move corners about empty spaces,
                        // and then don't move side cards around empty spaces
                        !(
                            target.top.name === emptyPair.top.name &&
                            (selectedInCorner ||
                                (!targetInCorner && j < onTheBoard.length))
                        ) && pairClickHandlerHelper(target, i, selected)
                    );
                })
            )
        );
    }, [allHands, onTheBoard, pairClickHandlerHelper]);

    /* END COMPUTER PLAYS */

    /* USE EFFECTS */

    // show computer moves
    useEffect(() => {
        let timeout;
        if (currentPlayer === "$cpu") {
            timeout = setTimeout(
                () =>
                    computerPlays() ||
                    (allHands["$cpu"].length && drawPileHandler()),
                800
            );
        }
        return () => clearTimeout(timeout);
    }, [allHands, computerPlays, currentPlayer, drawPileHandler, getHand]);

    // load game and set Firebase listener on first render
    useEffect(() => {
        function updateGame(gameData) {
            if (!gameData) {
                return;
            }
            const { currentPlayer, allHands, onTheBoard, drawPile } = gameData;
            setCurrentPlayer(currentPlayer);
            setAllHands(allHands);
            setOnTheBoard(onTheBoard);
            setDrawPile(drawPile);
        }
        // load game from Firebase
        getDoc(doc(firestore, "Games", gameKey)).then((doc) =>
            updateGame(doc.data())
        );
        // listen for changes
        const unsubscribe = onSnapshot(
            doc(firestore, "Games", gameKey),
            (doc) => {
                setIsGameCancelled(!doc.data());
                updateGame(doc.data());
            }
        );
        return unsubscribe;
    }, [gameKey, setCurrentGameKey]);

    useEffect(() => {
        if (isGameCancelled) {
            alert("Game has been cancelled by another player.");
            setCurrentGameKey();
        }
    }, [isGameCancelled, setCurrentGameKey]);

    // announce winner
    useEffect(() => {
        let timeout;
        if (isGameOver()) {
            timeout = setTimeout(
                () =>
                    alert(`YOU ${allHands[username].length ? "LOST" : "WON"}`),
                1000
            );
        }
        return () => clearTimeout(timeout);
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
                              doc(firestore, "Games", gameKey),
                              getGameData(username, players)
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
                            successfulPlay,
                            pairClickHandler,
                        }}
                    />
                    <button
                        className="back-to-dashboard"
                        onClick={() => setCurrentGameKey()}
                    >
                        dashboard
                    </button>
                </>
            )}
        </div>
    );
}
