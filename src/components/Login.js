import { useEffect, useRef, useState } from "react";
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

export default function Login({
    username,
    setUsername,
    setEmail,
    isVerified,
    setIsVerified,
}) {
    const formRef = useRef(),
        [errorMessage, setErrorMessage] = useState(),
        [isSignUp, setIsSignUp] = useState(false);

    function getFormData() {
        return Object.fromEntries(new FormData(formRef.current));
    }

    async function signInHandler() {
        try {
            const { email, password } = getFormData();
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            rewriteError(error);
        }
    }

    async function signUpHandler() {
        try {
            const { username, email, password } = getFormData(),
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
        <div className="login">
            <h1>Sign {isSignUp ? "Up" : "In"}</h1>
            <button onClick={() => setIsSignUp((isSignUp) => !isSignUp)}>
                sign {isSignUp ? "in" : "up"} instead
            </button>
            <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
                {isSignUp && (
                    <>
                        <label>
                            username
                            <input name="username" type="text" required />
                        </label>
                        <br />
                    </>
                )}
                <label>
                    email
                    <input name="email" type="email" required />
                </label>
                <br />
                <label>
                    password
                    <input name="password" type="password" required />
                </label>
                <br />
                <button onClick={isSignUp ? signUpHandler : signInHandler}>
                    sign {isSignUp ? "up" : "in"}
                </button>
            </form>
            <hr />
            <em>{errorMessage || (username && !isVerified && missingEmail)}</em>
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

export { SignOut, getAllUsernames };
