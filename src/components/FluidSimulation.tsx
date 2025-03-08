"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import Box2DFactory from "box2d-wasm";
import createWall from "@/helpers/createWall";
import createWaterDrop from "@/helpers/createWaterDrop";
import { createContext2DRender } from "@/helpers/context2DRender";
import { Box2D } from "@/helpers/Box2D";
import createParticleSystem from "@/helpers/createParticleSystem";

export type FluidSimulationRef = {
  addDrop: (x: number, y: number) => void;
  clear: () => void;
};

const FluidSimulation = forwardRef<FluidSimulationRef>((_, ref) => {
  const [box2D, setBox2D] = useState<Box2D | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const worldRef = useRef<Box2D.b2World | null>(null);
  const particleSystemRef = useRef<Box2D | null>(null);

  useEffect(() => {
    let isMounted = true;

    Box2DFactory().then((instance) => {
      if (isMounted) {
        setBox2D(instance);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!box2D) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gravity = new box2D.b2Vec2(0, -10);
    const world = new box2D.b2World(gravity);
    worldRef.current = world;

    createWall(box2D, world, -10, 0, 1, 20);
    createWall(box2D, world, 10, 0, 1, 20);
    createWall(box2D, world, 0, -8, 20, 1);

    const particleSystem = createParticleSystem(box2D, world);
    particleSystemRef.current = particleSystem;

    createWaterDrop(box2D, particleSystem, 0, 4, 1);

    const render = createContext2DRender(canvas, box2D, world, particleSystem);
    render.start();

    return () => {
      world.DestroyParticleSystem(particleSystem);
      render.stop();
    };
  }, [box2D]);

  useImperativeHandle(ref, () => ({
    addDrop: (x, y) => {
      const particleSystem = particleSystemRef.current;

      if (!box2D) return;
      if (!particleSystem) return;

      createWaterDrop(box2D, particleSystem, x, y, 1);
    },
    clear: () => {
      const world = worldRef.current;
      const oldParticleSystem = particleSystemRef.current;

      if (!box2D) return;
      if (!oldParticleSystem) return;
      if (!world) return;

      world.DestroyParticleSystem(oldParticleSystem);
      particleSystemRef.current = createParticleSystem(box2D, world);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="border border-gray-300 block mx-auto w-full"
      width={800}
      height={600}
    />
  );
});

export default FluidSimulation;
