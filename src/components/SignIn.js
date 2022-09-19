import "../css/sign-in.css";
import { useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "../database";
import logo from "../images/kings-corner-logo-purple-small.png";
import nightLogo from "../images/kings-corner-logo-purple-nightmode-small.png";

export default function SignIn({
    username,
    setUsername,
    setEmail,
    isVerified,
    setIsVerified,
}) {
    const [errorMessage, setErrorMessage] = useState(),
        [isSignUp, setIsSignUp] = useState(false);

    async function signInHandler(event) {
        try {
            const { email, password } = getFormData(event.target);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            rewriteError(error);
        }
    }

    async function signUpHandler(event) {
        try {
            const { username, email, password } = getFormData(event.target),
                trimmed = username.trim().toLowerCase();
            if (trimmed.length > 30) {
                throw Error("Username is too long.");
            }
            if (!trimmed.match(/^[A-Za-z0-9_]+$/)) {
                throw Error(
                    "Username must contain only letters, numbers, and underscores (_)."
                );
            }
            const allUsernames = await getAllUsernames(rewriteError);
            if (allUsernames.includes(trimmed)) {
                throw Error("Username already exists.");
            }
            const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                ),
                user = userCredential.user;
            await updateProfile(user, {
                displayName: trimmed,
            });
            await verifyEmail(email);
            await addUsernameToList(trimmed);
            setUsername(trimmed);
            setIsSignUp(false);
        } catch (error) {
            rewriteError(error);
        }
    }

    async function addUsernameToList(username) {
        try {
            await updateDoc(doc(firestore, "User Info", "usernames"), {
                all: arrayUnion(username),
            });
        } catch (error) {
            rewriteError(error);
        }
    }

    async function verifyEmail(email) {
        try {
            await sendEmailVerification(auth.currentUser, {
                url: "http://localhost:3000",
            });
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            window.localStorage.setItem("emailForSignIn", email);
        } catch (error) {
            rewriteError(error);
        }
    }

    const missingEmail = (
        <>
            Please click the verification link that was sent to your registered
            email.
            <br />
            <SignOut {...{ setErrorMessage }} />
        </>
    );

    function rewriteError(error) {
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
            ? setErrorMessage("Invalid login credentials.")
            : error.code === "auth/weak-password"
            ? setErrorMessage("Password is too weak.")
            : error.code === "auth/invalid-email"
            ? setErrorMessage("Email is invalid.")
            : error.code === "auth/email-already-in-use"
            ? setErrorMessage("Email already registered.")
            : error.code === "auth/missing-email"
            ? setErrorMessage(missingEmail)
            : setErrorMessage(error.message);
    }

    useEffect(() => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const { displayName, email, emailVerified } = user;
                setUsername(displayName);
                setEmail(email);
                setIsVerified(emailVerified);
                setErrorMessage();
            } else {
                setUsername();
                setEmail();
                setIsVerified(false);
            }
        });
    }, [setEmail, setIsVerified, setUsername]);

    return (
        <div className="sign-in">
            <div className="sign-in-form-container">
                <img
                    className="logo"
                    src={
                        window.matchMedia &&
                        window.matchMedia("(prefers-color-scheme: dark)")
                            .matches
                            ? nightLogo
                            : logo
                    }
                    alt="Four overlapping crowns with the four playing card suit symbols."
                />
                <h1>Kings Corner</h1>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        isSignUp ? signUpHandler(event) : signInHandler(event);
                    }}
                    spellCheck="false"
                >
                    {isSignUp && (
                        <input
                            id="username"
                            name="username"
                            placeholder="username"
                            type="text"
                            required
                        />
                    )}
                    <input
                        id="email"
                        name="email"
                        placeholder="email"
                        type="email"
                        required
                    />
                    <input
                        id="password"
                        name="password"
                        placeholder="password"
                        type="password"
                        required
                    />
                    <button type="submit">sign {isSignUp ? "up" : "in"}</button>
                </form>
                <button
                    className="instead"
                    onClick={() => {
                        setIsSignUp((isSignUp) => !isSignUp);
                        setErrorMessage();
                    }}
                >
                    sign {isSignUp ? "in" : "up"} instead
                </button>
                <em>
                    {errorMessage || (username && !isVerified && missingEmail)}
                </em>
            </div>
        </div>
    );
}

const SignOut = ({ setErrorMessage }) => (
    <button
        onClick={() => {
            signOut(auth);
            setErrorMessage?.();
        }}
    >
        sign out
    </button>
);

async function getAllUsernames(errorCallback) {
    try {
        const result = await getDoc(doc(firestore, "User Info", "usernames"));
        return result.data().all;
    } catch (error) {
        errorCallback(error);
    }
}

function getFormData(formElem) {
    return Object.fromEntries(new FormData(formElem));
}

export { SignOut, getAllUsernames, getFormData };
