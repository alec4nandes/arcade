import "../../css/home.css";
import { SignOut } from "../SignIn";
import MoonAndTides from "./MoonAndTides";
import rule2 from "../../images/rules/rule-2.png";
import rule3 from "../../images/rules/rule-3.png";
import rule4 from "../../images/rules/rule-4.png";
import rule5 from "../../images/rules/rule-5.png";
import rule6 from "../../images/rules/rule-6.png";

export default function Home({
    username,
    setShowing,
    localData,
    setLocalData,
}) {
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
                    <p className="section-header">Rules:</p>
                    <ol>
                        <li>Each player starts with 7 cards.</li>
                        <li>
                            The game is called Kings Corner because only kings
                            go in the empty corner spaces.
                            <br />
                            <img
                                src={rule2}
                                alt="Player selects King of Spades from hand and places it in corner spot."
                            />
                        </li>
                        <li>
                            Players stack cards like in Solitaire: in descending
                            order and by alternating colors.{" "}
                            <em>
                                Example: a black 6 goes on a red 7, a red queen
                                goes on a black king, etc.
                            </em>
                            <br />
                            <img
                                src={rule3}
                                alt="Player selects 6 of Clubs and places it on the 7 of Hearts."
                            />
                        </li>
                        <li>
                            A player can move cards around on the board to open
                            a space
                            <br />
                            <img
                                src={rule4}
                                alt="Player moves 5 of Hearts on the board on top of 6 of Clubs, also on the board."
                            />
                        </li>
                        <li>
                            A player can place any stackable cards in an open
                            space.
                            <br />
                            <img
                                src={rule5}
                                alt="Player selects both 2 and Ace in hand and moves them into empty space on board."
                            />
                            <br />
                            <em>
                                Strategy note: by instead playing the 8 of Clubs
                                in the empty space, the player can then move the
                                7 of Hearts pile on top, and then play the 2 and
                                the Ace in the empty space. This move gets rid
                                of one more card.
                            </em>
                        </li>
                        <li>
                            A player can make as many moves as possible before
                            drawing a new card to signal the end of their turn.
                            <br />
                            <img
                                src={rule6}
                                alt="Draw pile on board is circled."
                            />
                        </li>
                        <li>
                            The first person to play all the cards in their hand
                            wins.
                        </li>
                    </ol>
                    <hr />
                    <p className="section-header">Player order:</p>
                    <ul>
                        <li>
                            The player with the most wins in the current game
                            goes first.
                        </li>
                        <li>The player with the fewest wins goes last.</li>
                        <li>
                            If players have the same score, then it's
                            alphabetical by username.
                        </li>
                    </ul>
                    <hr />
                    <p className="section-header">Color key:</p>
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
                </details>
                <details>
                    <summary>faq</summary>
                    <p className="section-header">
                        How can I change my username or password?
                    </p>
                    <ul>
                        <li>You cannot change your username at this time.</li>
                        <li>
                            For password assistance, please contact{" "}
                            <a href="mailto:al@fern.haus">al@fern.haus</a>
                        </li>
                    </ul>
                    <p className="section-header">
                        How can I delete my account?
                    </p>
                    <ul>
                        <li>
                            To delete your account and game stats, please
                            contact{" "}
                            <a href="mailto:al@fern.haus">al@fern.haus</a>
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
                    <MoonAndTides {...{ localData, setLocalData }} />{" "}
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
