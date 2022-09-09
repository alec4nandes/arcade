import { useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../database";
import { getGameData } from "../cards";
import { SignOut, getAllUsernames } from "./Login";
import KingsCorner from "./KingsCorner";

export default function Dashboard({ username }) {
    const opponentRef = useRef(),
        [dashboardError, setDashboardError] = useState(),
        [currentGameKey, setCurrentGameKey] = useState();

    async function findOpponentHandler() {
        const opponent = opponentRef.current.value.trim().toLowerCase();
        if (opponent === username) {
            alert("You can't play yourself!");
            return;
        }
        const allUsernames = await getAllUsernames((error) =>
                setDashboardError(error.message)
            ),
            opponentExists = allUsernames.includes(opponent);
        if (opponentExists) {
            try {
                const gameKey = [username, opponent].sort().join("-"),
                    theDoc = doc(firestore, "Kings Corner", gameKey),
                    checkDoc = await getDoc(theDoc);
                if (!checkDoc.exists()) {
                    await setDoc(
                        doc(firestore, "Kings Corner", gameKey),
                        getGameData(username)
                    );
                }
                setCurrentGameKey(gameKey);
            } catch (error) {
                setDashboardError(error.message);
            }
        } else {
            alert("User does not exist.");
        }
    }

    return currentGameKey ? (
        <KingsCorner {...{ gameKey: currentGameKey, username }} />
    ) : (
        <div className="dashboard">
            <div className="user-info">
                <p>Hi, {username}!</p>
                <SignOut />
            </div>
            <label>
                opponent name
                <input type="text" ref={opponentRef} />
            </label>
            <button onClick={findOpponentHandler}>start game</button>
            <br />
            <em>{dashboardError}</em>
        </div>
    );
}
