import { Box2D } from "./Box2D";

export default function createParticleSystem(
  box2D: Box2D,
  world: Box2D.b2World
) {
  const psd = new box2D.b2ParticleSystemDef();
  psd.radius = 0.05;
  return world.CreateParticleSystem(psd);
}
