import { Box2D } from "@/helpers/Box2D";

export function createContext2DRender(
  canvas: HTMLCanvasElement,
  box2D: Box2D,
  world: Box2D.b2World,
  particleSystem: Box2D.b2ParticleSystem
) {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  let lastTime: number | null = null;

  const renderFn = (currentTime: DOMHighResTimeStamp) => {
    if (!lastTime) {
      lastTime = currentTime;
    }

    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    world.Step(deltaTime, 8, 3);

    ctx.clearRect(0, 0, width, height);

    const scale = 40;
    const offsetX = width / 2;
    const offsetY = height / 2;

    const b2Vec2Size = Float32Array.BYTES_PER_ELEMENT * 2;
    const count = particleSystem.GetParticleCount();
    const pbPositionPointer = box2D.getPointer(
      particleSystem.GetPositionBuffer()
    );
    const pbVelocityPointer = box2D.getPointer(
      particleSystem.GetVelocityBuffer()
    );
    const positionArr = box2D.reifyArray(
      pbPositionPointer,
      count,
      b2Vec2Size,
      box2D.b2Vec2
    );
    const velocityArr = box2D.reifyArray(
      pbVelocityPointer,
      count,
      b2Vec2Size,
      box2D.b2Vec2
    );

    for (let i = 0; i < positionArr.length; i++) {
      const { x, y } = positionArr[i];
      const v = velocityArr[i].Length();

      const screenX = offsetX + x * scale;
      const screenY = offsetY - y * scale;

      ctx.beginPath();
      ctx.arc(screenX, screenY, 1, 0, 2 * Math.PI);

      const red = (~~(
        Math.min(Math.pow(v / 12, 0.5), 1) * (0xff - 0x00) +
        0x00
      ))
        .toString(16)
        .padStart(2, "0");

      ctx.fillStyle = `#${red}aaff`;
      ctx.fill();
    }

    requestAnimationFrame(renderFn);
  };

  let handle: number = -1;

  const render = {
    start: () => {
      if (handle >= 0) return;
      lastTime = null;
      handle = requestAnimationFrame(renderFn);
    },
    stop: () => {
      cancelAnimationFrame(handle);
      handle = -1;
    },
  };

  return render;
}
