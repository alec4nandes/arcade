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
        [showing, setShowing] = useState("home"),
        [localData, setLocalData] = useState();

    useEffect(() => {
        // listen for changes
        const unsubscribe = onSnapshot(
            collection(firestore, "Games"),
            (querySnapshot) => {
                const gameKeys = {};
                // map doesn't work. use forEach instead
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    return (gameKeys[doc.id] = data.currentPlayer === username);
                });
                setAllGameKeys(gameKeys);
            }
        );
        return unsubscribe;
    }, []);

    const display = useMemo(
        () => ({
            home: (
                <Home {...{ username, setShowing, localData, setLocalData }} />
            ),
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
            scores: (
                <Scoreboards {...{ username, setCurrentGameKey, setShowing }} />
            ),
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
        [allGameKeys, localData, username]
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
