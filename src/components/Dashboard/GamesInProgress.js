import "../../css/games-in-progess.css";
import { deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../../database";

export default function GamesInProgress({
    username,
    allGameKeys,
    setCurrentGameKey,
}) {
    function getGamesInProgress() {
        const starting = `${username}-`,
            middle = `-${username}-`,
            ending = `-${username}`;
        return allGameKeys.filter(
            (key) =>
                key.indexOf(starting) === 0 ||
                key.includes(middle) ||
                key.indexOf(ending) + ending.length === key.length
        );
    }

    function endGameHandler(gameKey) {
        deleteDoc(doc(firestore, "Games", gameKey));
    }

    return (
        <div className="games-in-progress">
            <h2>Games In Progress</h2>
            <ul>
                {getGamesInProgress().map((key) => (
                    <li key={`${key} in progress`}>
                        <button
                            className="end-game-button"
                            onClick={() => endGameHandler(key)}
                        >
                            X
                        </button>
                        <button
                            className="cta-button"
                            onClick={() => setCurrentGameKey(key)}
                        >
                            {key.split("-").join(" • ")}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
