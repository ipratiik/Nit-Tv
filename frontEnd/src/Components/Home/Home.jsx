import React, { useState, useEffect } from 'react';
import "./Home.css";
import { Link } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";

// 🔹 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvGzs4QwqRuH7oO-LGuv2NnQEf3mkBWKQ",
    authDomain: "inbound-ranger-375215.firebaseapp.com",
    projectId: "inbound-ranger-375215",
    storageBucket: "inbound-ranger-375215.appspot.com",
    messagingSenderId: "620360233615",
    appId: "1:620360233615:web:f10161593a6c9a22bf36fa",
    measurementId: "G-LKLV799DLQ"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🔹 Ensure session persistence
setPersistence(auth, browserLocalPersistence).catch(console.error);

export default function Home() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");

    // 🔹 Keep user logged in even after refresh
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (loggedInUser) => {
            if (loggedInUser) {
                setUser(loggedInUser);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const email = result.user.email;

            // 🔹 Restrict login to MANIT/NIT students
            // if (!email.endsWith("@stu.manit.ac.in") && !email.endsWith("@nit.ac.in")) {
            //     setError("Only NIT students can log in.");
            //     await signOut(auth); // Log out unauthorized users
            //     return;
            // }

            setUser(result.user);
            setError(""); // Clear any previous errors
        } catch (err) {
            setError("Login failed. Try again.");
            console.error(err);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
    };

    return (
        <div className="homePage">
            <nav className="navbar">
                <h1 style={{fontSize : "70px"}}>Manit TV</h1>
            </nav>

            <main className="content">
                {user ? (
                    <center>
                        <p>Welcome, {user.displayName}</p>
                        <button onClick={handleLogout}>Logout</button>
                        <button>
                            <Link to="/nitExclusive" className="button-link">Go to Chat Room</Link>
                        </button>
                    </center>
                ) : (
                    <center>
                        <button onClick={handleGoogleLogin}>Login with Google</button>
                        {error && <p className="error-message">{error}</p>}
                    </center>
                )}
            </main>
        </div>
    );
}
