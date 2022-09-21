import "../../css/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../database";
import KingsCorner from "../KingsCorner";
import Header from "../Header";
import Home from "./Home";
import GamesInProgress from "./GamesInProgress";
import Scoreboards from "./Scoreboards";
import Challenge from "./Challenge";

export default function Dashboard({ username }) {
    const [allGameKeys, setAllGameKeys] = useState([]),
        [dashboardError, setDashboardError] = useState(),
        [currentGameKey, setCurrentGameKey] = useState(),
        [showing, setShowing] = useState("home");

    useEffect(() => {
        // listen for changes
        const unsubscribe = onSnapshot(
            collection(firestore, "Games"),
            (querySnapshot) => {
                const gameKeys = [];
                // map doesn't work. use forEach instead
                querySnapshot.forEach((doc) => gameKeys.push(doc.id));
                setAllGameKeys(gameKeys);
            }
        );
        return unsubscribe;
    }, []);

    const display = useMemo(
        () => ({
            home: <Home {...{ username, setShowing }} />,
            games: (
                <GamesInProgress
                    {...{
                        username,
                        allGameKeys,
                        setCurrentGameKey,
                        setShowing,
                    }}
                />
            ),
            scoreboards: <Scoreboards />,
            challenge: (
                <Challenge
                    {...{
                        username,
                        setDashboardError,
                        setCurrentGameKey,
                        setShowing,
                    }}
                />
            ),
        }),
        [allGameKeys, username]
    );

    return (
        <div className="dashboard">
            <Header {...{ showing, setCurrentGameKey, setShowing }} />
            {currentGameKey ? (
                <KingsCorner
                    {...{
                        gameKey: currentGameKey,
                        setCurrentGameKey,
                        setShowing,
                        username,
                    }}
                />
            ) : dashboardError ? (
                <em>{dashboardError}</em>
            ) : (
                display[showing]
            )}
        </div>
    );
}
