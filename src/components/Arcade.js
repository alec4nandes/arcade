import { useState } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login";

export default function Arcade() {
    const [username, setUsername] = useState(),
        [email, setEmail] = useState(),
        [isVerified, setIsVerified] = useState();

    return isVerified ? (
        <Dashboard {...{ username }} />
    ) : (
        <Login
            {...{ username, setUsername, setEmail, isVerified, setIsVerified }}
        />
    );
}
