import "../css/kings-corner.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "../database";
import { cornerIndexes, emptyPair, getGameData } from "../cards";
import Board from "./Board";
import Hand from "./Hand";

export default function KingsCorner({ gameKey, username }) {
    const [player, setPlayer] = useState(),
        [playerTurn, setPlayerTurn] = useState(),
        [playerPicks, setPlayerPicks] = useState([]), // player can pick multiple ascending cards
        [playerDrawn, setPlayerDrawn] = useState(),
        [opponentDrawn, setOpponentDrawn] = useState(),
        [onTheBoard, setOnTheBoard] = useState(),
        [drawPile, setDrawPile] = useState(),
        [selected, setSelected] = useState(),
        drawnCardRef = useRef();

    const getIsYourTurn = useCallback(
        () => (playerTurn ? player === username : player !== username),
        [player, playerTurn, username]
    );

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
                const result = playerDrawn
                        .filter((p) => !playerPicks.includes(p))
                        .map((p) => ({ ...p, isNew: false })),
                    update = {};
                update[player === username ? "playerDrawn" : "opponentDrawn"] =
                    result;
                updateDoc(doc(firestore, "Kings Corner", gameKey), update);
                return result;
            }
        },
        [gameKey, onTheBoard, player, playerDrawn, playerPicks, username]
    );

    const pairClickHandler = useCallback(
        (target, index) =>
            getIsYourTurn() && pairClickHandlerHelper(target, index, selected),
        [getIsYourTurn, pairClickHandlerHelper, selected]
    );

    const drawPileHandler = useCallback(() => {
        const pileCopy = [...drawPile],
            nextCard = pileCopy.pop(),
            update = {};
        if (nextCard) {
            const result = [
                ...playerDrawn.map((target) => ({
                    ...target,
                    isNew: false,
                })),
                { ...nextCard, isNew: true },
            ];
            update[player === username ? "playerDrawn" : "opponentDrawn"] =
                result;
        } else if (playerTurn) {
            alert("NO MORE CARDS TO DRAW");
        }
        setPlayerPicks([]);
        updateDoc(doc(firestore, "Kings Corner", gameKey), {
            ...update,
            drawPile: pileCopy,
            playerTurn: !playerTurn,
        });
    }, [drawPile, gameKey, player, playerDrawn, playerTurn, username]);

    /* USE EFFECTS */

    // load game and set Firebase listener on first render
    useEffect(() => {
        function updateGame(gameData) {
            const {
                player,
                playerTurn,
                playerDrawn,
                opponentDrawn,
                onTheBoard,
                drawPile,
            } = gameData;
            setPlayer(player);
            setPlayerTurn(playerTurn);
            setPlayerDrawn(player === username ? playerDrawn : opponentDrawn);
            setOpponentDrawn(player === username ? opponentDrawn : playerDrawn);
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
        if (playerDrawn && (!playerDrawn.length || !opponentDrawn.length)) {
            alert(`YOU ${playerDrawn.length ? "LOST" : "WON"}`);
        }
    }, [gameKey, opponentDrawn, playerDrawn, playerTurn]);

    // scroll to newly drawn card in player's hand
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
    }, [playerDrawn]);

    /* END USE EFFECTS */

    /* NESTED COMPONENTS */

    function DrawPile() {
        const gameOver = !playerDrawn.length || !opponentDrawn.length;
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
                disabled={gameOver ? false : !getIsYourTurn()}
            >
                {gameOver ? "NEW GAME" : `DRAW CARD (${drawPile.length})`}
            </button>
        );
    }

    /* END NESTED COMPONENTS */

    return (
        <div className="kings-corner">
            {playerDrawn && (
                <>
                    <Hand
                        {...{
                            drawn: playerDrawn,
                            title: username,
                            playerPicks,
                            drawnCardRef,
                            isYourTurn: getIsYourTurn(),
                            pairClickHandler,
                        }}
                    />
                    <Board
                        {...{
                            onTheBoard,
                            drawPile: <DrawPile />,
                            playerPicks,
                            pairClickHandler,
                        }}
                    />
                    <Hand
                        {...{
                            drawn: opponentDrawn,
                            title: gameKey
                                .split("-")
                                .filter((part) => part !== username),
                            playerPicks,
                            isOpponent: true,
                            isYourTurn: getIsYourTurn(),
                            pairClickHandler: () => "",
                        }}
                    />
                </>
            )}
        </div>
    );
}
