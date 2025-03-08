import type { Box2D } from "./Box2D";

export default function createWaterDrop(
  box2D: Box2D,
  particleSystem: Box2D.b2ParticleSystem,
  x: number,
  y: number,
  radius: number
) {
  const shape = new box2D.b2CircleShape();
  shape.m_p.Set(x, y);
  shape.m_radius = radius;

  const pd = new box2D.b2ParticleGroupDef();
  pd.shape = shape;
  pd.flags = box2D.b2_waterParticle;
  particleSystem.CreateParticleGroup(pd);
}
