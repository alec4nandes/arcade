import "../../css/scoreboard.css";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../database";

export default function Scoreboards({
    username,
    setCurrentGameKey,
    setShowing,
}) {
    const [winLoss, setWinLoss] = useState(),
        [myScoreboards, setMyScoreboards] = useState(),
        [topScoresShowing, setTopScoresShowing] = useState(false);

    useEffect(() => {
        // listen for changes
        const allWinLoss = {},
            unsubscribe = onSnapshot(
                collection(firestore, "Scoreboards"),
                (querySnapshot) => {
                    const allScoreboards = [];
                    // map doesn't work. use forEach instead
                    querySnapshot.forEach((doc) => {
                        const id = doc.id,
                            data = doc.data(),
                            gamesPlayed = Object.values(data.wins).reduce(
                                (a, v) => a + v,
                                0
                            );
                        Object.entries(data.wins).forEach(([player, wins]) => {
                            if (allWinLoss[player]) {
                                allWinLoss[player].wins += wins;
                                allWinLoss[player].losses += gamesPlayed - wins;
                            } else {
                                allWinLoss[player] = {
                                    wins,
                                    losses: gamesPlayed - wins,
                                };
                            }
                        });
                        allScoreboards.push({ id, ...data, gamesPlayed });
                    });
                    setWinLoss(allWinLoss);
                    setMyScoreboards(
                        allScoreboards.filter((scoreboard) =>
                            Object.keys(scoreboard.wins).includes(username)
                        )
                    );
                }
            );
        return unsubscribe;
    }, [username]);

    return winLoss ? (
        <div className="scoreboards">
            <h2>{topScoresShowing ? "Top" : "My"} Scores</h2>
            <button
                onClick={() =>
                    setTopScoresShowing((topScoresShowing) => !topScoresShowing)
                }
            >
                show {topScoresShowing ? "my" : "top"} scores instead
            </button>
            {topScoresShowing ? (
                <ol>
                    {Object.entries(winLoss)
                        .sort(
                            (a, b) =>
                                b[1].wins - a[1].wins ||
                                a[1].losses - b[1].losses
                        )
                        // only show top 50 scores
                        .slice(0, 50)
                        .map(([player, stats]) => (
                            <li key={`top player ${player}`}>
                                {player}: {stats.wins}/{stats.losses}
                            </li>
                        ))}
                </ol>
            ) : (
                <>
                    <h3>
                        wins: {winLoss[username].wins || 0} / losses:{" "}
                        {winLoss[username].losses || 0}
                    </h3>
                    <div className="game-scores">
                        {myScoreboards
                            ?.sort(
                                (a, b) =>
                                    b.wins[username] - a.wins[username] ||
                                    a.id.localeCompare(b.id)
                            )
                            .map((scoreboard) => (
                                <table key={`${scoreboard.id} scoreboard`}>
                                    <thead>
                                        <tr>
                                            <th colSpan={2}>
                                                <button
                                                    onClick={() => {
                                                        setCurrentGameKey(
                                                            scoreboard.id
                                                        );
                                                        setShowing();
                                                    }}
                                                >
                                                    {scoreboard.id
                                                        .split("-")
                                                        .join(" • ")}
                                                </button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(scoreboard.wins)
                                            .sort(
                                                (a, b) =>
                                                    b[1] - a[1] ||
                                                    a[0].localeCompare(b[0])
                                            )
                                            .map(([player, wins]) => (
                                                <tr
                                                    key={`${scoreboard.id} ${player} stats`}
                                                >
                                                    <td>{player}</td>
                                                    <td>{wins}</td>
                                                </tr>
                                            ))}
                                        <tr>
                                            <td>games</td>
                                            <td>{scoreboard.gamesPlayed}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ))}
                    </div>
                </>
            )}
        </div>
    ) : (
        <></>
    );
}
