import { Logo } from "./SignIn";
import "../css/header.css";

export default function Header({ showing, setShowing }) {
    const buttonsText = ["home", "games", "scoreboards", "challenge"];

    return (
        <div className="header">
            <Logo />
            <div className="header-text">
                <h1>Kings Corner</h1>
                <div className="navigation">
                    {buttonsText.map((text) => (
                        <button
                            key={`nav button ${text}`}
                            onClick={() => setShowing(text)}
                            disabled={showing === text}
                        >
                            {text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
