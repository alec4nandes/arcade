import "../../css/home.css";
import { SignOut } from "../SignIn";

export default function Home({ username, setShowing }) {
    return (
        <div className="home">
            <h2 className="greeting">hi, {username}!</h2>
            <div className="game-options">
                <button onClick={() => setShowing("games")}>
                    resume
                    <br />
                    game
                </button>
                <div className="vertical-divider"></div>
                <button onClick={() => setShowing("challenge")}>
                    play
                    <br />
                    someone
                    <br />
                    new
                </button>
            </div>
            <SignOut />
        </div>
    );
}
