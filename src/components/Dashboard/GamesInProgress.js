import "../../css/games-in-progess.css";
import { deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../../database";

export default function GamesInProgress({
    username,
    allGameKeys,
    setCurrentGameKey,
    setShowing,
}) {
    function getGamesInProgress() {
        const starting = `${username}-`,
            middle = `-${username}-`,
            ending = `-${username}`;
        return Object.keys(allGameKeys).filter(
            (key) =>
                key.indexOf(starting) === 0 ||
                key.includes(middle) ||
                key.indexOf(ending) + ending.length === key.length
        );
    }

    function endGameHandler(gameKey) {
        deleteDoc(doc(firestore, "Games", gameKey));
    }

    const inProgress = getGamesInProgress();

    return (
        <div className="games-in-progress">
            <h2>Games In Progress</h2>
            <ul>
                {inProgress.length ? (
                    inProgress.map((key) => (
                        <li key={`${key} in progress`}>
                            <button
                                className="end-game-button"
                                onClick={() => endGameHandler(key)}
                            >
                                X
                            </button>
                            <button
                                className={`cta-button ${
                                    allGameKeys[key] ? "my-turn" : ""
                                }`}
                                onClick={() => {
                                    setCurrentGameKey(key);
                                    setShowing();
                                }}
                            >
                                {key.split("-").join(" • ")}
                            </button>
                        </li>
                    ))
                ) : (
                    <>
                        <p>You're not playing anyone at the moment.</p>
                        <p>
                            <button onClick={() => setShowing("challenge")}>
                                Click here
                            </button>{" "}
                            to challenge someone.
                        </p>
                    </>
                )}
            </ul>
        </div>
    );
}
