<div align="center">
  <h1>🌌 VIRTUAL-LAB</h1>
  <p><strong>A collaborative, real-time 2D physics sandbox for interactive learning and experimentation.</strong></p>
</div>

---

## 📖 Overview

**VIRTUAL-LAB** is a multiplayer physics simulation environment designed for interactive learning and experimentation. It allows users to spawn objects, tweak advanced physics properties, and watch realistic gravity and collisions play out—all while collaborating with others over the internet in real-time. 

## Features

* 🌍 **Real-Time Multiplayer:** Create or join rooms using a 6-digit code. Actions are synced across all users in the room using WebSockets.
* ⚛️ **Advanced Physics Engine:** Powered by `matter.js`, featuring rigid-body physics, collisions, restitution (bouncing), and friction.
* 🛠️ **Object Control:** Use the Properties Panel to edit Mass, Density, Air Drag, Restitution, Velocity, and geometric properties (radius, sides).
* 📊 **Live Telemetry & Analytics:** Monitor live kinetic energy, potential energy, momentum, and speed with graphs.
* 💾 **Cloud Save & Export:** Save your workspaces to the server, load physics templates, or export environments locally as `.json` files.
* ⏸️ **Time Controls:** Play, pause, or reload the simulation.

---

## 💻 Tech Stack

* **Frontend:** React (Vite), TailwindCSS, custom Glassmorphism UI
* **Physics:** Matter.js
* **Backend:** Node.js, Express.js
* **Multiplayer/Sockets:** Socket.io
* **Database:** MongoDB (with local JSON fallback)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd "virtual lab (cc)"
   ```

2. **Install all dependencies:**
   The project contains a root script that installs dependencies for both the frontend (`client`) and backend (`server`) automatically:
   ```bash
   npm run install:all
   ```

### Running the Application

1. **Start the Development Servers:**
   To run both the React frontend and the Node.js backend simultaneously, run the following command from the root directory:
   ```bash
   npm run dev
   ```
   
2. **Access the App:**
   * Open your browser and go to: `http://localhost:5173`
   * The backend server will be running on: `http://localhost:3001`

*(Note: To test multiplayer locally, simply open `http://localhost:5173` in two different browser tabs!)*

---

## 📂 Project Structure

```text
virtual-lab/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI, Canvas, Analytics, and Multiplayer panels
│   │   ├── hooks/          # Custom hooks (e.g., useMultiplayer)
│   │   └── App.jsx         # Main application layout
│   └── tailwind.config.js  # Styling configurations
│
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   └── index.js        # Express server & Socket.io logic
│   └── .env                # Server environment variables
│
└── package.json            # Root configuration & concurrently scripts
```

## Acknowledgements
* Built using React, Node.js, and Socket.io.
* Physics algorithms powered by [Matter.js](https://brm.io/matter-js/).
