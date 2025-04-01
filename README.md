# NIT TV 🎥

NIT TV is an Omegle-style video chat platform exclusively for NIT students. It allows students to connect via random 1-on-1 video chats, ensuring a safe and exclusive environment for networking and discussions.

## 🚀 Features

* **🔒 NIT-Exclusive Access:** Only students with NIT's emails can log in.
* **📹 Random 1-on-1 Video Chat:** Get paired with other NIT students for real-time conversations.
* **⚡ Firebase Authentication:** Secure login with Google authentication.
* **🎥 WebRTC for Video Streaming:** Peer-to-peer video calls without servers storing any data.
* **📡 Real-time Matching System:** Instantly connects users with available peers.

## 🛠 Tech Stack

* **Frontend:** React.js
* **Backend:** Firebase (Authentication), WebSockets
* **Video Streaming:** WebRTC
* **Hosting:** Vercel, Render, Railways

## 📦 Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ankitsingh2105/NIT-TV.git
    ```

2.  **Install dependencies:**

    ```bash
    cd frontEnd
    npm i

    cd BackEnd
    npm i
    ```

3.  **Set up Firebase:**

    * Create a Firebase project.
    * Enable Google Authentication.
    * Add your Firebase config to the project.

4.  **Start the development server:**
    Frontend
    ```bash
    npm run dev
    ```
    BackEnd
    ```bash
    nodemon server
    ```

## 🔑 Authentication

NIT TV uses Firebase Authentication to restrict access to NIT students only. Users must sign in with Google, and only emails ending in:

* `"mnnit.ac.in",
        "nitap.ac.in",
        "manit.ac.in",
        "nitc.ac.in",
        "nitdelhi.ac.in",
        "nitdgp.ac.in",
        "nitgoa.ac.in",
        "nith.ac.in",
        "mnit.ac.in",
        "nitj.ac.in",
        "nitjsr.ac.in",
        "nitk.edu.in",
        "nitkkr.ac.in",
        "nitmanipur.ac.in",
        "nitm.ac.in",
        "nitmz.ac.in",
        "vnit.ac.in",
        "nitnagaland.ac.in",
        "nitp.ac.in",
        "nitpy.ac.in",
        "nitrr.ac.in",
        "nitrkl.ac.in",
        "nitsikkim.ac.in",
        "nits.ac.in",
        "nitsri.net",
        "nitt.edu",
        "nituk.ac.in",
        "nitw.ac.in",
        "nitdelhi.ac.in",
        "nitap.ac.in",`

will be allowed.

## 🖥 How It Works

1.  User logs in using Google Authentication.
2.  Email is verified (must belong to an NIT domain).
3.  If valid, the user is matched with another available NIT student.
4.  WebRTC handles video calls directly between users.
5.  When a chat ends, users can connect to a new random partner.


## 🤝 Contributing

Feel free to fork the repo and submit PRs! Open to feedback and suggestions.

Built with ❤️ for NIT students by NIT Students! 🎓
