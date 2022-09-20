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
            <h3>Games In Progress</h3>
            <ul>
                {getGamesInProgress().map((key) => (
                    <li key={`${key} in progress`}>
                        <button onClick={() => setCurrentGameKey(key)}>
                            {key.split("-").join(" and ")}
                        </button>
                        <button onClick={() => endGameHandler(key)}>X</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
