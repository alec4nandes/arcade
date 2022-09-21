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
                    new
                    <br />
                    game
                </button>
            </div>
            <div className="info" data-accordion>
                <details>
                    <summary>how to play</summary>
                    <p>Instructions on how to play are coming soon.</p>
                </details>
                <details>
                    <summary>about</summary>
                    <p>
                        Kings Corner is a web app created by Alec Fernandes. For
                        any questions or concerns, please email{" "}
                        <a href="mailto:al@fern.haus">al@fern.haus</a>
                    </p>
                </details>
                <details>
                    <summary>moon and tides</summary>
                    <p>Stats on the moon and tides are coming soon.</p>
                </details>
            </div>
            <SignOut />
        </div>
    );
}

/* TOGGLE DETAILS */
// courtesy of chris@gomakethings.com

document.addEventListener("toggle", toggleHandler, true);

/**
 * Handle toggle events
 * @param  {Event} event The Event object
 */
function toggleHandler(event) {
    // Only run if accordion is open
    if (!event.target.hasAttribute("open")) return;

    // Only run on accordions inside our selector
    let parent = event.target.closest("[data-accordion]");
    if (!parent) return;

    // Get all open accordions inside parent
    let opened = parent.querySelectorAll("details[open]");

    // Close open ones that aren't current accordion
    for (let accordion of opened) {
        if (accordion === event.target) continue;
        accordion.removeAttribute("open");
    }
}

/* END TOGGLE DETAILS */
