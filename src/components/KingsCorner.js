import "../css/kings-corner.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../database";
import { cornerIndexes, emptyPair, getGameData, sortPlayers } from "../cards";
import Board from "./Board";
import Hand from "./Hand";

export default function KingsCorner({
    gameKey,
    setCurrentGameKey,
    setShowing,
    username,
}) {
    const [players, setPlayers] = useState(),
        [currentPlayer, setCurrentPlayer] = useState(),
        [gameId, setGameId] = useState(),
        [playerPicks, setPlayerPicks] = useState([]), // player can pick multiple ascending cards
        [allHands, setAllHands] = useState(),
        [wins, setWins] = useState(),
        [onTheBoard, setOnTheBoard] = useState(),
        [drawPile, setDrawPile] = useState(),
        [isGameLoaded, setIsGameLoaded] = useState(false),
        [selected, setSelected] = useState(),
        [successfulPlay, setSuccessfulPlay] = useState(),
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

    const updateDocHelper = useCallback(
        (update) => updateDoc(doc(firestore, "Games", gameKey), update),
        [gameKey]
    );

    const pairClickHandlerHelper = useCallback(
        (target, index, selected) => {
            const targetInCorner = cornerIndexes.includes(index),
                targetIsEmpty = target.top.name === emptyPair.top.name,
                selectedIsEmpty = selected?.top.name === emptyPair.top.name;

            if (
                selected &&
                // NOT selected on board and target in hand
                !(
                    onTheBoard.includes(selected) &&
                    !onTheBoard.includes(target)
                ) &&
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
                updateDocHelper({ selected: target, successfulPlay: null });
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
                currentPlayer === "$cpu" && updateDocHelper({ selected });

                if (topCardOnBoard) {
                    // a successful play
                    if (currentPlayer === "$cpu") {
                        // delayed effect for computer double-highlight
                        setTimeout(onSuccess, 400);
                    } else {
                        onSuccess();
                    }
                    return true;
                } else if (currentPlayer !== "$cpu" && bothInHand) {
                    updateDocHelper({ selected: paired });
                    setPlayerPicks((playerPicks) => [...playerPicks, target]);
                }

                function onSuccess() {
                    updateDocHelper({
                        ...(bottomCardInHand ? removeFromHand() : {}),
                        ...updateBoard(paired),
                        selected: null,
                        successfulPlay: paired,
                    });
                    setPlayerPicks([]);
                }
            }

            function getCopyIndex(arr, copy) {
                return arr.map((pair) => pair.top.name).indexOf(copy.top.name);
            }

            function removeFromHand() {
                const result = getHand()
                        .filter((p) =>
                            currentPlayer === "$cpu"
                                ? p.top.name !== selected.top.name
                                : getCopyIndex(playerPicks, p) === -1
                        )
                        .map((p) => ({ ...p, isNew: false })),
                    update = { allHands };
                update.allHands[cpuOrHuman()] = result;
                return update;
            }

            function updateBoard(paired) {
                const boardCopy = [...onTheBoard],
                    copyIndex = getCopyIndex(boardCopy, selected);
                boardCopy[index] = paired;
                if (copyIndex !== -1) {
                    boardCopy[copyIndex] = emptyPair;
                }
                return {
                    onTheBoard: boardCopy,
                };
            }
        },
        [
            allHands,
            cpuOrHuman,
            currentPlayer,
            getHand,
            onTheBoard,
            playerPicks,
            updateDocHelper,
        ]
    );

    const pairClickHandler = useCallback(
        (target, index) =>
            isYourTurn && pairClickHandlerHelper(target, index, selected),
        [isYourTurn, pairClickHandlerHelper, selected]
    );

    const handleDrawPileHelper = useCallback(() => {
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
        updateDocHelper({
            ...update,
            drawPile: pileCopy,
            currentPlayer:
                players[players.indexOf(currentPlayer) + 1] || players[0],
            selected: null,
            successfulPlay: null,
        });
    }, [
        drawPile,
        allHands,
        isYourTurn,
        updateDocHelper,
        players,
        currentPlayer,
        getHand,
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

    // update selected in db
    useEffect(() => {
        selected &&
            updateDocHelper({
                selected,
            }).catch((err) => console.warn(err));
    }, [selected, updateDocHelper]);

    // show computer moves
    useEffect(() => {
        let timeout;
        if (currentPlayer === "$cpu") {
            timeout = setTimeout(
                () =>
                    computerPlays() ||
                    (allHands["$cpu"].length && handleDrawPileHelper()),
                800
            );
        }
        return () => clearTimeout(timeout);
    }, [allHands, computerPlays, currentPlayer, handleDrawPileHelper, getHand]);

    // load game and set Firebase listener on first render
    useEffect(() => {
        function updateGame(gameData) {
            if (!gameData) {
                return;
            }
            const {
                id,
                currentPlayer,
                allHands,
                onTheBoard,
                drawPile,
                selected,
                successfulPlay,
            } = gameData;
            setGameId(id);
            setCurrentPlayer(currentPlayer);
            setAllHands(allHands);
            setOnTheBoard(onTheBoard);
            setDrawPile(drawPile);
            setSelected(selected);
            setSuccessfulPlay(successfulPlay);
            !isGameLoaded && setIsGameLoaded(true);
        }

        // load the game and listen for changes
        const theDoc = doc(firestore, "Games", gameKey),
            unsubscribe = onSnapshot(theDoc, (d) => {
                if (d.exists()) {
                    updateGame(d.data());
                } else {
                    if (isGameLoaded) {
                        alert("Another player has cancelled the game.");
                        setCurrentGameKey();
                        setShowing("games");
                    } else {
                        const data = getGameData(null, gameKey.split("-"));
                        setDoc(theDoc, data);
                    }
                }
            });

        return unsubscribe;
    }, [gameKey, isGameLoaded, setCurrentGameKey, setShowing]);

    // announce winner and update scores
    useEffect(() => {
        let timeout;
        if (players && isGameOver()) {
            const iWon = !allHands[username].length,
                playingComputer = players.includes("$cpu");
            timeout = setTimeout(
                () => alert(`YOU ${iWon ? "WON" : "LOST"}`),
                1000
            );
            // only the computer or winner updates the scoreboard
            if (iWon || playingComputer) {
                async function updateScores() {
                    try {
                        const theDoc = doc(firestore, "Scoreboards", gameKey),
                            scoreboard = await getDoc(theDoc),
                            update = scoreboard.exists()
                                ? scoreboard.data()
                                : {
                                      wins: players.reduce(
                                          (a, v) => ({ ...a, [v]: 0 }),
                                          {}
                                      ),
                                  };
                        if (update.lastGame && update.lastGame === gameId) {
                            return;
                        }
                        update.wins[
                            playingComputer && !iWon ? "$cpu" : username
                        ] += 1;
                        update.lastGame = gameId;
                        await setDoc(theDoc, update);
                    } catch (error) {
                        console.warn(error);
                    }
                }
                updateScores();
            }
        }
        return () => clearTimeout(timeout);
    }, [allHands, gameId, gameKey, isGameOver, players, username]);

    // scroll to newly drawn card in player's hand
    useEffect(() => {
        if (drawnCardRef.current) {
            if (window.innerWidth > 700) {
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
            } else {
                const { offsetWidth, offsetLeft } = drawnCardRef.current,
                    offsetRight = offsetWidth + offsetLeft,
                    scrollLeft =
                        offsetRight > window.innerWidth / 2
                            ? offsetLeft -
                              window.innerWidth / 2 +
                              offsetWidth / 2
                            : 0;
                drawnCardRef.current.parentNode.parentNode.scrollTo({
                    top: 0,
                    left: scrollLeft,
                    behavior: "smooth",
                });
            }
        }
    }, [currentPlayer]);

    // get game win tallies to display with usernames
    useEffect(() => {
        const theDoc = doc(firestore, "Scoreboards", gameKey),
            unsubscribe = onSnapshot(theDoc, (doc) => {
                const wins = doc.data()?.wins;
                setWins(wins);
                setPlayers(wins ? sortPlayers(wins) : gameKey.split("-"));
            });
        return unsubscribe;
    }, [gameKey]);

    /* END USE EFFECTS */

    /* NESTED COMPONENTS */

    function DrawPileButton() {
        const gameOver = isGameOver();

        function handleDrawPile() {
            gameOver
                ? updateDocHelper(getGameData(wins))
                : handleDrawPileHelper();
        }

        return (
            <button
                onClick={handleDrawPile}
                disabled={gameOver ? false : !isYourTurn}
            >
                {gameOver ? (
                    "NEW GAME"
                ) : (
                    <>
                        DRAW CARD
                        <br />({drawPile?.length} left)
                    </>
                )}
            </button>
        );
    }

    /* END NESTED COMPONENTS */

    return (
        <div className="kings-corner">
            {allHands && players && (
                <>
                    <div className="all-hands">
                        {players
                            // winners on top
                            .sort(
                                (a, b) =>
                                    (wins && wins[b] - wins[a]) ||
                                    a.localeCompare(b)
                            )
                            .map((player, i) => (
                                <Hand
                                    {...{
                                        key: `hand-${i + 1}`,
                                        drawn: allHands[player],
                                        title: player,
                                        wins: wins?.[player],
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
                    </div>
                    <Board
                        {...{
                            onTheBoard,
                            DrawPileButton,
                            selected,
                            successfulPlay,
                            pairClickHandler,
                        }}
                    />
                </>
            )}
        </div>
    );
}
