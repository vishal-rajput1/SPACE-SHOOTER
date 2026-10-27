
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import MainScene from "../game/scenes/MainScene";

export default function GameCanvas() {
  const gameContainer = useRef(null);

  useEffect(() => {
    if (!gameContainer.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainer.current,
      width: 960,
      height: 600,
      backgroundColor: "#07111f",
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
      },
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={gameContainer}
      style={{
        width: "100%",
        maxWidth: "960px",
        margin: "0 auto",
        overflow: "hidden",
        border: "1px solid #263b57",
        borderRadius: "12px",
      }}
    />
  );
}
