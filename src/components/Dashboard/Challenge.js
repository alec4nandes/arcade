import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../../database";
import { getGameData } from "../../cards";
import { getAllUsernames, getFormData } from "../SignIn";

export default function Challenge({
    username,
    setDashboardError,
    setCurrentGameKey,
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
        } catch (error) {
            setDashboardError(error.message);
        }
    }

    return (
        <div className="pick-opponents">
            <h3>Challenge Opponents</h3>
            <button onClick={() => playOpponents(["$cpu"])}>
                play against computer
            </button>
            <br />
            <br />
            <em>or challenge users (up to 3)</em>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    findOpponentHandler(event);
                }}
            >
                <input name="opponent1" type="text" />
                <input name="opponent2" type="text" />
                <input name="opponent3" type="text" />
                <button type="submit">start game</button>
            </form>
        </div>
    );
}
