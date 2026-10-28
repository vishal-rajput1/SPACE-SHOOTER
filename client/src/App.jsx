import GameCanvas from "./components/GameCanvas";

export default function App() {
  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="game-frame" aria-label="Space Shooter Odyssey game">
        <GameCanvas />
      </section>
      <div className="app-corner-mark" aria-hidden="true">
        <span className="corner-dot" />
        SPACE SHOOTER ODYSSEY
      </div>
    </main>
  );
}
