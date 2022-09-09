import "../css/dashboard.css";
import { useEffect, useState } from "react";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    setDoc,
} from "firebase/firestore";
import { firestore } from "../database";
import { getGameData } from "../cards";
import { SignOut, getAllUsernames, getFormData } from "./Login";
import KingsCorner from "./KingsCorner";

export default function Dashboard({ username }) {
    const [allGameKeys, setAllGameKeys] = useState([]),
        [dashboardError, setDashboardError] = useState(),
        [currentGameKey, setCurrentGameKey] = useState();

    useEffect(() => {
        // listen for changes
        onSnapshot(collection(firestore, "Kings Corner"), (querySnapshot) => {
            const gameKeys = [];
            // map doesn't work. use forEach instead
            querySnapshot.forEach((doc) => gameKeys.push(doc.id));
            setAllGameKeys(gameKeys);
        });
    }, []);

    async function findOpponentHandler(event) {
        const opponents = Object.values(getFormData(event.target))
            .map((name) => name.trim().toLowerCase())
            .filter((x) => x);
        if (!opponents.length) {
            return;
        }
        if (opponents.includes(username)) {
            alert("You can't play yourself!");
            return;
        }
        const allUsernames = await getAllUsernames((error) =>
                setDashboardError(error.message)
            ),
            opponentsExist = opponents.every((opp) =>
                allUsernames.includes(opp)
            );
        if (opponentsExist) {
            try {
                const allPlayers = [username, ...opponents].sort(),
                    gameKey = allPlayers.join("-"),
                    theDoc = doc(firestore, "Kings Corner", gameKey),
                    checkDoc = await getDoc(theDoc);
                if (!checkDoc.exists()) {
                    await setDoc(
                        doc(firestore, "Kings Corner", gameKey),
                        getGameData(username, allPlayers)
                    );
                }
                setCurrentGameKey(gameKey);
            } catch (error) {
                setDashboardError(error.message);
            }
        } else {
            alert(
                `User${
                    opponents.length === 1 ? " is" : "s are"
                } not registered.`
            );
        }
    }

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
        deleteDoc(doc(firestore, "Kings Corner", gameKey));
    }

    return currentGameKey ? (
        <KingsCorner
            {...{ gameKey: currentGameKey, setCurrentGameKey, username }}
        />
    ) : (
        <div className="dashboard">
            <h1>Kings Corner</h1>
            <div className="user-info">
                <h2>Hi, {username}!</h2>
                <SignOut />
            </div>
            <form
                className="opponents"
                onSubmit={(event) => {
                    event.preventDefault();
                    findOpponentHandler(event);
                }}
            >
                <h3>Challenge Opponents</h3>
                <em>(up to 3)</em>
                <input name="opponent1" type="text" />
                <input name="opponent2" type="text" />
                <input name="opponent3" type="text" />
                <button type="submit">start game</button>
            </form>
            <hr />
            <div className="games-in-progress">
                <h3>Games In Progress</h3>
                <ul>
                    {getGamesInProgress().map((key) => (
                        <li key={`${key} in progress`}>
                            <button onClick={() => setCurrentGameKey(key)}>
                                {key.split("-").join(" and ")}
                            </button>
                            <button onClick={() => endGameHandler(key)}>
                                X
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <hr />
            <em>{dashboardError}</em>
        </div>
    );
}
