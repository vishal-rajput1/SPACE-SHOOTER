import { useEffect, useRef } from "react";
import Phaser from "phaser";
import MainScene from "../game/scenes/MainScene";

export default function GameCanvas() {
  const gameContainer = useRef(null);

  useEffect(() => {
    if (!gameContainer.current) return undefined;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainer.current,
      width: 960,
      height: 600,
      backgroundColor: "#050b18",
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        activePointers: 3,
        touch: { capture: true },
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
      },
      dom: { createContainer: false },
      disableContextMenu: true,
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameContainer} className="phaser-host" />;
}
