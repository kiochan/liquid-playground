import type { Box2D } from "./Box2D";

export default function createWall(
  box2D: Box2D,
  world: Box2D["World"],
  x: number,
  y: number,
  width: number,
  height: number
) {
  const bodyDef = new box2D.b2BodyDef();
  bodyDef.type = box2D.b2_staticBody;
  bodyDef.position.Set(x, y);
  const body = world.CreateBody(bodyDef);

  const shape = new box2D.b2PolygonShape();
  shape.SetAsBox(width, height);
  const fixDef = new box2D.b2FixtureDef();
  fixDef.shape = shape;
  fixDef.density = 1;
  body.CreateFixture(fixDef);
}
