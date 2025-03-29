# Manit TV 🎥

Manit TV is an Omegle-style video chat platform exclusively for NIT students. It allows students to connect via random 1-on-1 video chats, ensuring a safe and exclusive environment for networking and discussions.

## 🚀 Features

* **🔒 NIT-Exclusive Access:** Only students with `@stu.manit.ac.in` and `@nit.ac.in` emails can log in.
* **📹 Random 1-on-1 Video Chat:** Get paired with other NIT students for real-time conversations.
* **⚡ Firebase Authentication:** Secure login with Google authentication.
* **🎥 WebRTC for Video Streaming:** Peer-to-peer video calls without servers storing any data.
* **📡 Real-time Matching System:** Instantly connects users with available peers.

## 🛠 Tech Stack

* **Frontend:** React.js
* **Backend:** Firebase (Authentication, Firestore for real-time matching)
* **Video Streaming:** WebRTC
* **Hosting:** Firebase Hosting / Vercel

## 📦 Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/manit-tv](https://github.com/ankitsingh2105/ManitTV.git
    cd manit-tv
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Firebase:**

    * Create a Firebase project.
    * Enable Google Authentication.
    * Add your Firebase config to the project.

4.  **Start the development server:**

    ```bash
    npm start
    ```

## 🔑 Authentication

Manit TV uses Firebase Authentication to restrict access to NIT students only. Users must sign in with Google, and only emails ending in:

* `@stu.manit.ac.in`

will be allowed.

## 🖥 How It Works

1.  User logs in using Google Authentication.
2.  Email is verified (must belong to an NIT domain).
3.  If valid, the user is matched with another available NIT student.
4.  WebRTC handles the video call directly between users.
5.  When a chat ends, users can connect to a new random partner.


## 🤝 Contributing

Feel free to fork the repo and submit PRs! Open to feedback and suggestions.

## 📜 License

MIT License © 2025 Manit TV

Built with ❤️ for NIT students! 🎓
