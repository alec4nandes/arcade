import { Logo } from "./SignIn";
import "../css/header.css";

export default function Header() {
    return (
        <div className="header">
            <Logo />
            <div className="header-text">
                <h1>Kings Corner</h1>
                <div className="navigation">
                    <button>dashboard</button>
                    <button>games</button>
                    <button>scoreboards</button>
                    <button>challenge</button>
                </div>
            </div>
        </div>
    );
}
