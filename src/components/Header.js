import { Logo } from "./SignIn";
import "../css/header.css";

export default function Header({ showing, setCurrentGameKey, setShowing }) {
    const buttonsText = ["home", "games", "scores", "challenge"];

    return (
        <header className="header">
            <Logo />
            <div className="header-text">
                <h1>Kings Corner</h1>
                <nav className="navigation">
                    {buttonsText.map((text) => (
                        <button
                            key={`nav button ${text}`}
                            onClick={() => {
                                setCurrentGameKey();
                                setShowing(text);
                            }}
                            disabled={showing === text}
                        >
                            {text}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
}
