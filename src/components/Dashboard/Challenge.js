import "../../css/challenge.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../../database";
import { getGameData } from "../../cards";
import { getAllUsernames, getFormData } from "../SignIn";

export default function Challenge({
    username,
    setDashboardError,
    setCurrentGameKey,
    setShowing,
}) {
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
            playOpponents(opponents);
        } else {
            alert(
                `User${
                    opponents.length === 1 ? " is" : "s are"
                } not registered.`
            );
        }
    }

    async function playOpponents(opponents) {
        try {
            const allPlayers = [username, ...opponents].sort(),
                gameKey = allPlayers.join("-"),
                theDoc = doc(firestore, "Games", gameKey),
                checkDoc = await getDoc(theDoc);
            if (!checkDoc.exists()) {
                await setDoc(
                    doc(firestore, "Games", gameKey),
                    getGameData(username, allPlayers)
                );
            }
            setCurrentGameKey(gameKey);
            setShowing();
        } catch (error) {
            setDashboardError(error.message);
        }
    }

    return (
        <div className="challenge">
            <h2>Challenge Opponents</h2>
            <button
                className="cta-button"
                onClick={() => playOpponents(["$cpu"])}
            >
                play against computer
            </button>
            <p>or challenge users (up to 3)</p>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    findOpponentHandler(event);
                }}
            >
                <div>
                    1. <input name="opponent1" type="text" />
                </div>
                <div>
                    2. <input name="opponent2" type="text" />
                </div>
                <div>
                    3. <input name="opponent3" type="text" />
                </div>
                <button className="cta-button" type="submit">
                    start game
                </button>
            </form>
        </div>
    );
}
