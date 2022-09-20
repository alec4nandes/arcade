import { useState } from "react";
import Dashboard from "./Dashboard";
import SignIn from "./SignIn";

export default function Arcade() {
    const [username, setUsername] = useState(),
        [email, setEmail] = useState(),
        [isVerified, setIsVerified] = useState();

    return isVerified ? (
        <Dashboard {...{ username }} />
    ) : (
        <SignIn
            {...{ username, setUsername, setEmail, isVerified, setIsVerified }}
        />
    );
}
