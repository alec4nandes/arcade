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
                    <p>
                        During your turn and when playing the computer, the
                        following color key applies:
                    </p>
                    <ul>
                        <li>Newly dealt cards are highlighted red.</li>
                        <li>
                            Selected cards are highlighted yellow.
                            <ul>
                                <li>
                                    You can select multiple cards at once by
                                    stacking them in your hand, just like you
                                    would on the board{" "}
                                    <em>
                                        (placing a lower card on a higher card)
                                    </em>
                                    .
                                </li>
                            </ul>
                        </li>
                        <li>
                            Successful plays on the board are highlighted green.
                        </li>
                    </ul>
                    <p>More instructions on how to play are coming soon.</p>
                </details>
                <details>
                    <summary>faq</summary>
                    <ul>
                        <li>
                            How can I change my username or password?
                            <ul>
                                <li>
                                    You cannot change your username at this
                                    time.
                                </li>
                                <li>
                                    For password assistance, please contact{" "}
                                    <a href="mailto:al@fern.haus">
                                        al@fern.haus
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            How can I delete my account?
                            <ul>
                                <li>
                                    To delete your account and game stats,
                                    please contact{" "}
                                    <a href="mailto:al@fern.haus">
                                        al@fern.haus
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
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
