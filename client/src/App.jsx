
import GameCanvas from "./components/GameCanvas";
import { GAME_NAME } from "./config/gameConfig";

export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07111f",
        color: "#e5efff",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          maxWidth: "960px",
          margin: "0 auto 24px",
        }}
      >
        <p style={{ color: "#60a5fa", letterSpacing: "3px" }}>
          MISSION CONTROL
        </p>

        <h1>{GAME_NAME}</h1>

        <p style={{ color: "#94a3b8" }}>
          Your journey through deep space begins here.
        </p>
      </header>

      <GameCanvas />

      <p
        style={{
          maxWidth: "960px",
          margin: "16px auto",
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        PHASE 2 · GAME ENGINE INITIALIZED
      </p>
    </main>
  );
}
