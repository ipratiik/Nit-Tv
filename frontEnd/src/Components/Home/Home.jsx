import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
} from "firebase/auth";

import { LogIn, LogOut } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

// 🔹 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvGzs4QwqRuH7oO-LGuv2NnQEf3mkBWKQ",
  authDomain: "inbound-ranger-375215.firebaseapp.com",
  projectId: "inbound-ranger-375215",
  storageBucket: "inbound-ranger-375215.appspot.com",
  messagingSenderId: "620360233615",
  appId: "1:620360233615:web:f10161593a6c9a22bf36fa",
  measurementId: "G-LKLV799DLQ",
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
      if (
        !email.endsWith("@stu.manit.ac.in") &&
        !email.endsWith("@nit.ac.in")
      ) {
        setError("Only NIT students can log in.");
        await signOut(auth); // Log out unauthorized users
        toast.error("Login Failed! Try Again!");
        return;
      }

      setUser(result.user);
      setError(""); // Clear any previous errors
      toast.success(`Welcome, ${result.user.displayName}.`);
    } catch (err) {
      setError("Login failed. Try again.");
      console.error(err);
      toast.error("Login Failed! Try Again!");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    toast.success("Signed Out Successfully!");
  };

  return (
    <div
      className="-z-20 h-dvh"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke-width='2' stroke='%23E0E0E0'%3e%3cpath d='M0 .5H19.5V20'/%3e%3c/svg%3e")`,
      }}
    >
      <Toaster
        position="bottom-center"
        reverseOrder={false}
        toastOptions={{ duration: 3000 }}
      />
      <section className="container flex flex-col gap-8 md:gap-10">
        <header className="mx-auto flex w-full justify-between rounded-xl bg-emerald-500/30 md:w-2xl lg:w-5xl">
          <Link className="flex items-center justify-center gap-2 px-0.5">
            <img
              alt="Logo"
              src="/logo.webp"
              width={250}
              height={250}
              className="h-14 w-auto"
            />
          </Link>
          <button
            className={`${
              user ? "bg-red-500" : "bg-emerald-600"
            } m-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 tracking-wide text-white`}
            onClick={user ? handleLogout : handleGoogleLogin}
          >
            {user ? (
              <span className="flex items-center gap-2">
                <LogOut strokeWidth={3} className="size-3 md:size-5" />
                <p className="text-sm font-medium md:text-base md:font-bold">
                  Sign Out
                </p>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn strokeWidth={3} className="size-3 md:size-5" />
                <p className="text-sm font-medium md:text-base md:font-bold">
                  Get Started
                </p>
              </span>
            )}
          </button>
        </header>
        <main className="relative z-20 flex flex-col items-center gap-8 overflow-hidden rounded-3xl border-2 border-gray-400 px-4 py-12 shadow-2xl md:py-16">
          <span className="absolute inset-0 size-full bg-white" />
          <div className="absolute inset-0 z-10">
            <svg className="size-full">
              <defs>
                <pattern
                  id="grid-pattern"
                  width="30"
                  height="30"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    xmlns="http://www.w3.org/2000/svg"
                    d="M0 4H4M4 4V0M4 4H8M4 4V8"
                    stroke="currentColor"
                    strokeOpacity="0.3"
                    className="stroke-black"
                  />
                  <rect
                    x="18"
                    y="18"
                    width="1"
                    height="1"
                    fill="currentColor"
                    fillOpacity="0.25"
                    className="stroke-black"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          </div>
          {!user && (
            <div className="z-10 inline-flex w-fit items-center gap-4 rounded-lg border border-emerald-500 bg-emerald-200 px-3 py-1.5">
              <div className="relative size-2.5 rounded-full bg-green-500">
                <span className="ping-large absolute inset-0 rounded-full bg-green-600" />
              </div>

              <p className="text-xs font-bold text-black">
                Hop In - No Attendance Required
              </p>
            </div>
          )}
          {user ? (
            <div className="z-10 flex max-w-5xl flex-col items-center gap-4 text-3xl font-bold md:text-7xl">
              <img
                src={user.photoURL || "/Avatar.png"}
                alt="Profile"
                className="size-36 rounded-3xl border-2"
              />
              <p>Welcome, {user.displayName}.</p>
            </div>
          ) : (
            <p className="z-10 max-w-5xl text-center text-3xl font-bold md:text-7xl">
              Bringing NITians Closer, One Awkward Video Call At a Time
            </p>
          )}
          <p className="z-10 hidden max-w-5xl text-center text-3xl font-bold md:block">
            🎥 Video Chat. 💬 Text Chat. 🙊 Unlimited Gossip.
          </p>
          <div className="z-10 flex flex-col gap-2 text-center text-xl font-bold md:hidden">
            <p>🎥 Video Chat.</p>
            <p>💬 Text Chat.</p>
            <p>🙊 Unlimited Gossip.</p>
          </div>
          <div className="text-xm z-10 max-w-5xl text-center font-bold md:hidden">
            <p>
              Feeling adventurous? Join random NITians in surprise chat rooms
              and make new friends.
            </p>
          </div>
          {!user && (
            <p className="z-10 hidden max-w-5xl text-center text-xs font-medium md:block md:text-base">
              Whether it’s banter, brainstorming, or just random gossip – NIT TV
              is your spot!
              <br />
              We've got you covered!
            </p>
          )}
          {user && (
            <p className="z-10 hidden max-w-5xl text-center text-xs font-medium md:block md:text-base">
              Feeling adventurous? Join random NITians in surprise chat rooms
              and make new friends.
              <br />
              We've got you covered!
            </p>
          )}
          <button className="z-10 flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 px-4 py-2 font-medium text-white shadow-xl hover:shadow-2xl">
            {user ? (
              <Link to="/nitExclusive">👋 Join Your Buddies</Link>
            ) : (
              <span
                onClick={handleGoogleLogin}
                className="flex items-center gap-2"
              >
                <svg
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  strokeLinejoin="round"
                  strokeMiterlimit="2"
                  height={16}
                  width={16}
                >
                  <path
                    d="M32.582 370.734C15.127 336.291 5.12 297.425 5.12 256c0-41.426 10.007-80.291 27.462-114.735C74.705 57.484 161.047 0 261.12 0c69.12 0 126.836 25.367 171.287 66.793l-73.31 73.309c-26.763-25.135-60.276-38.168-97.977-38.168-66.56 0-123.113 44.917-143.36 105.426-5.12 15.36-8.146 31.65-8.146 48.64 0 16.989 3.026 33.28 8.146 48.64l-.303.232h.303c20.247 60.51 76.8 105.426 143.36 105.426 34.443 0 63.534-9.31 86.341-24.67 27.23-18.152 45.382-45.148 51.433-77.032H261.12v-99.142h241.105c3.025 16.757 4.654 34.211 4.654 52.364 0 77.963-27.927 143.592-76.334 188.276-42.356 39.098-100.305 61.905-169.425 61.905-100.073 0-186.415-57.483-228.538-141.032v-.233z"
                    fill="#FFFFFF"
                  />
                </svg>

                <p className="text-sm tracking-wide text-white">
                  Sign In With Google
                </p>
              </span>
            )}
          </button>
        </main>
      </section>
    </div>
  );
}
