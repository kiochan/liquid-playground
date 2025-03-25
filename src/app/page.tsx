"use client";

import Image from "next/image";
import React, { useEffect, useRef } from "react";
import FluidSimulation, {
  FluidSimulationRef,
} from "@/components/FluidSimulation";
import settings from "@/const/settings";

export default function Home() {
  const fluidSimulationRef = useRef<FluidSimulationRef | null>(null);

  useEffect(() => {
    const requestPermissionIfNeeded = async () => {
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        // @ts-ignore：only for ios
        typeof DeviceMotionEvent.requestPermission === "function"
      ) {
        try {
          // @ts-ignore：only for ios
          const response = await DeviceMotionEvent.requestPermission();
          if (response !== "granted") {
            console.warn("DeviceMotion permission not granted");
            return;
          }
        } catch (error) {
          console.error("DeviceMotion permission error:", error);
          return;
        }
      }
      initGravityControl();
    };

    const initGravityControl = () => {
      if (!fluidSimulationRef.current) return;

      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (isMobile) {
        const handleOrientation = (e: DeviceOrientationEvent) => {
          if (!fluidSimulationRef.current) return;
          const x = (e.gamma ?? 0) / 90;
          const y = (e.beta ?? 0) / 90;
          fluidSimulationRef.current.setGravity(x, y);
        };

        window.addEventListener("deviceorientation", handleOrientation, true);
        return () =>
          window.removeEventListener(
            "deviceorientation",
            handleOrientation,
            true
          );
      } else {
        const handleMouseMove = (e: MouseEvent) => {
          if (!fluidSimulationRef.current) return;
          const x = e.clientX / window.innerWidth - 0.5;
          const y = -(e.clientY / window.innerHeight - 0.5);
          fluidSimulationRef.current.setGravity(x, y);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
      }
    };

    requestPermissionIfNeeded();
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center justify-items-center">
        <FluidSimulation ref={fluidSimulationRef} />
        <div className="flex gap-4 items-center flex-col sm:flex-row justify-center">
          <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            onClick={() => fluidSimulationRef.current?.clear()}
          >
            Clear Canvas
          </button>
          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            onClick={() =>
              fluidSimulationRef.current?.addDrop(
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
              )
            }
          >
            Add a Drop
          </button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href={settings.link.repo}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Source Code
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href={settings.link.homepage}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to kiochan.one →
        </a>
      </footer>
    </div>
  );
}
