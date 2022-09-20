import "../../css/dashboard.css";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../database";
import KingsCorner from "../KingsCorner";
import Header from "../Header";
import Home from "./Home";
import GamesInProgress from "./GamesInProgress";
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

    const display = {
        home: () => <Home {...{ username, dashboardError }} />,
        games: () => (
            <GamesInProgress
                {...{ username, allGameKeys, setCurrentGameKey }}
            />
        ),
        scoreboards: () => <p>scoreboards coming soon</p>,
        challenge: () => (
            <Challenge
                {...{ username, setDashboardError, setCurrentGameKey }}
            />
        ),
    };

    return currentGameKey ? (
        <KingsCorner
            {...{ gameKey: currentGameKey, setCurrentGameKey, username }}
        />
    ) : (
        <div className="dashboard">
            <Header {...{ showing, setShowing }} />
            {display[showing]()}
        </div>
    );
}
