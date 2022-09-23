import "../../css/scoreboard.css";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../database";
import { playOpponents } from "./Challenge";

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
        const unsubscribe = onSnapshot(
            collection(firestore, "Scoreboards"),
            (querySnapshot) => {
                const allWinLoss = {},
                    mine = [];
                // map doesn't work. use forEach instead
                querySnapshot.forEach((doc) => {
                    const id = doc.id,
                        data = doc.data(),
                        gamesPlayed = Object.values(data.wins).reduce(
                            (a, v) => a + v,
                            0
                        );
                    Object.entries(data.wins).forEach(([player, wins]) => {
                        const losses = gamesPlayed - wins;
                        if (allWinLoss[player]) {
                            allWinLoss[player].wins += wins;
                            allWinLoss[player].losses += losses;
                        } else {
                            allWinLoss[player] = { wins, losses };
                        }
                    });
                    Object.keys(data.wins).includes(username) &&
                        mine.push({ id, ...data, gamesPlayed });
                });
                setWinLoss(allWinLoss);
                setMyScoreboards(mine);
            }
        );
        return unsubscribe;
    }, [username]);

    function MyScores() {
        return (
            <div className="my-scores">
                <h3>
                    wins: {winLoss[username]?.wins || 0} / losses:{" "}
                    {winLoss[username]?.losses || 0}
                </h3>
                <div className="game-scores">
                    {myScoreboards
                        ?.sort(
                            (a, b) =>
                                b.wins[username] - a.wins[username] ||
                                a.id.localeCompare(b.id)
                        )
                        .map((scoreboard) => (
                            <ScoreTable
                                {...{
                                    key: `${scoreboard.id} scoreboard`,
                                    scoreboard,
                                }}
                            />
                        ))}
                </div>
            </div>
        );
    }

    function ScoreTable({ scoreboard }) {
        return (
            <table>
                <thead>
                    <tr>
                        <th colSpan={2}>
                            <button
                                onClick={() => {
                                    setCurrentGameKey(scoreboard.id);
                                    setShowing();
                                }}
                            >
                                {scoreboard.id.split("-").join(" • ")}
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(scoreboard.wins)
                        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                        .map(([player, wins]) => (
                            <tr key={`${scoreboard.id} ${player} stats`}>
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
        );
    }

    function TopScores() {
        return (
            <div className="top-scores">
                <p>(win/loss)</p>
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
                                <button
                                    className="cta-button"
                                    onClick={() =>
                                        username === player
                                            ? alert("You can't play yourself!")
                                            : playOpponents({
                                                  username,
                                                  allPlayers: [
                                                      username,
                                                      player,
                                                  ],
                                                  setCurrentGameKey,
                                                  setShowing,
                                              })
                                    }
                                >
                                    {player}
                                </button>{" "}
                                ({stats.wins}/{stats.losses})
                            </li>
                        ))}
                </ol>
            </div>
        );
    }

    return winLoss ? (
        <div className="scoreboards">
            <h2>{topScoresShowing ? "Top" : "My"} Scores</h2>
            <button
                className="toggle-scoreboard"
                onClick={() =>
                    setTopScoresShowing((topScoresShowing) => !topScoresShowing)
                }
            >
                show {topScoresShowing ? "my" : "top"} scores instead
            </button>
            {topScoresShowing ? <TopScores /> : <MyScores />}
        </div>
    ) : (
        <></>
    );
}
