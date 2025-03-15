import { Renderer, Shader, Geometry } from "@pixi/core";
import { Mesh } from "@pixi/mesh";
import { Container } from "@pixi/display";
import { Ticker } from "@pixi/ticker";
import { DRAW_MODES } from "@pixi/constants";

// Assume you have a type definition for Box2D
import type { Box2D } from "./Box2D";

/**
 * Create a custom PixiJS renderer that draws Box2D particles as round points
 * using a custom WebGL shader. This approach uses gl_PointCoord to draw soft-edged circles.
 */
export function createRender(
  canvas: HTMLCanvasElement,
  box2D: Box2D,
  world: Box2D.b2World,
  particleSystem: Box2D.b2ParticleSystem
) {
  /**
   * 1. Create the PixiJS renderer
   */
  const renderer = new Renderer({
    view: canvas,
    width: canvas.width,
    height: canvas.height,
    backgroundColor: 0x000000, // Black background
    antialias: true,
  });

  /**
   * 2. Create the stage container and ticker
   */
  const stage = new Container();
  const ticker = new Ticker();

  /**
   * 3. Prepare the geometry buffers
   *
   * Each particle has:
   *  - aPosition (2 floats, x and y in pixel space)
   *  - aSize (1 float, controlling gl_PointSize)
   *  - aColor (3 floats, for RGB color)
   */
  const MAX_COUNT = 1000000; // Maximum number of particles
  const positions = new Float32Array(MAX_COUNT * 2); // (x, y)
  const sizes = new Float32Array(MAX_COUNT); // point size
  const colors = new Float32Array(MAX_COUNT * 3); // (r, g, b)

  // Create the geometry and bind the attributes
  const geometry = new Geometry()
    .addAttribute("aPosition", positions, 2)
    .addAttribute("aSize", sizes, 1)
    .addAttribute("aColor", colors, 3);

  /**
   * 4. Write the custom shaders
   *
   * Vertex shader:
   *  - Uses Pixi's matrices (projectionMatrix, translationMatrix) to convert
   *    pixel coordinates into clip space automatically.
   *  - Sets gl_PointSize to aSize.
   *  - Passes the color to the fragment shader.
   */
  const vertexSrc = `
  precision mediump float;

  // Attributes from the Geometry
  attribute vec2 aPosition;
  attribute float aSize;
  attribute vec3 aColor;

  // Uniforms automatically injected by PixiJS
  uniform mat3 translationMatrix;
  uniform mat3 projectionMatrix;

  // Passing color to the fragment shader
  varying vec3 vColor;

  void main() {
    // Convert from pixel space to clip space via PixiJS's matrices
    vec3 pos = vec3(aPosition, 1.0);
    pos = projectionMatrix * translationMatrix * pos;
    gl_Position = vec4(pos.xy, 0.0, 1.0);

    // Set the point size
    gl_PointSize = aSize;

    // Pass color to the fragment shader
    vColor = aColor;
  }
  `;

  /**
   * Fragment shader:
   *  - Uses gl_PointCoord to sample the pixel within the point.
   *  - Draws a circle by discarding fragments outside a radius of 0.5.
   *  - Uses smoothstep to create a soft edge.
   */
  const fragmentSrc = `
  precision mediump float;
  varying vec3 vColor;

  void main() {
    // gl_PointCoord: (0,0) in bottom-left, (1,1) in top-right of the point
    float dist = length(gl_PointCoord - vec2(0.5));
    // If outside the circle, discard
    if (dist > 0.5) {
      discard;
    }
    // Use smoothstep to create a soft edge
    float alpha = smoothstep(0.5, 0.45, dist);
    gl_FragColor = vec4(vColor, 1.0 - alpha);
  }
  `;

  // Create the shader program
  const shader = Shader.from(vertexSrc, fragmentSrc);

  // Create a mesh using our geometry and shader
  const mesh = new Mesh(geometry, shader);
  // Draw with points instead of triangles
  mesh.drawMode = DRAW_MODES.POINTS;
  // Add mesh to the stage
  stage.addChild(mesh);

  /**
   * 5. Update logic: read Box2D particle data, fill buffers, and render
   *
   * We assume Box2D uses a standard coordinate system where +y is up.
   * We'll map Box2D coordinates to pixel coordinates on the canvas.
   */
  const scale = 40.0;
  const offsetX = canvas.width / 2;
  const offsetY = canvas.height / 2;

  ticker.add(() => {
    // Step the physics simulation
    world.Step(1 / 60, 8, 3);

    const count = Math.min(particleSystem.GetParticleCount(), MAX_COUNT);
    const b2Vec2Bytes = 8; // 2 floats * 4 bytes each
    const posPtr = box2D.getPointer(particleSystem.GetPositionBuffer());
    const velPtr = box2D.getPointer(particleSystem.GetVelocityBuffer());

    const posArr = box2D.reifyArray(posPtr, count, b2Vec2Bytes, box2D.b2Vec2);
    const velArr = box2D.reifyArray(velPtr, count, b2Vec2Bytes, box2D.b2Vec2);

    for (let i = 0; i < count; i++) {
      // Convert Box2D coordinates to pixel space
      const px = offsetX + posArr[i].x * scale;
      const py = offsetY - posArr[i].y * scale; // Y up

      positions[i * 2] = px;
      positions[i * 2 + 1] = py;

      // Adjust size and color by velocity
      const speed = velArr[i].Length();
      sizes[i] = 1.0 + speed * 1.0; // gl_PointSize

      // Simple speed-based color
      const factor = Math.min(speed / 10.0, 1.0);
      const r = factor; // fade from 0..1
      const g = 0.3;
      const b = 1.0 - factor; // fade from 1..0
      colors[i * 3 + 0] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    // Hide any unused particles
    for (let i = count; i < MAX_COUNT; i++) {
      positions[i * 2] = -9999.0;
      positions[i * 2 + 1] = -9999.0;
      sizes[i] = 0.0;
    }

    // Update the geometry buffers
    geometry.getBuffer("aPosition").update(positions);
    geometry.getBuffer("aSize").update(sizes);
    geometry.getBuffer("aColor").update(colors);

    // Render the stage
    renderer.render(stage);
  });

  let running = false;

  return {
    start() {
      if (!running) {
        ticker.start();
        running = true;
      }
    },
    stop() {
      if (running) {
        ticker.stop();
        running = false;
      }
    },
  };
}
