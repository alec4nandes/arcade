import { SignOut } from "../SignIn";

export default function Home({ username, dashboardError }) {
    return (
        <>
            <h2 className="greeting">Hi, {username}!</h2>
            <em>{dashboardError}</em>
            <SignOut />
        </>
    );
}
