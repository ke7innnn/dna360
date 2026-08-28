"use client";

import { useEffect, useRef, useState } from "react";

export default function AuraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    // Detect mobile or low concurrency devices for ultra-smooth performance
    const isMobile = window.innerWidth < 768;
    const isLowConcurrency = typeof navigator !== "undefined" && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isMobile || isLowConcurrency || prefersReducedMotion) {
      setIsLowPower(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const updateSize = () => {
      if (!canvas) return;
      const targetWidth = Math.min(window.innerWidth, 800);
      const scale = targetWidth / window.innerWidth;
      width = canvas.width = Math.floor(window.innerWidth * scale);
      height = canvas.height = Math.floor(window.innerHeight * scale);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    // Sunset Flare Aurora Nodes (Coral Rose, Warm Amber, Sunset Gold, Deep Plum)
    const nodes = [
      { x: width * 0.2, y: height * 0.3, vx: 0.3, vy: 0.2, radius: 450, color: "rgba(255, 94, 98, " },
      { x: width * 0.8, y: height * 0.7, vx: -0.2, vy: -0.3, radius: 550, color: "rgba(255, 153, 102, " },
      { x: width * 0.5, y: height * 0.5, vx: 0.2, vy: -0.2, radius: 500, color: "rgba(255, 209, 102, " },
      { x: width * 0.3, y: height * 0.8, vx: -0.3, vy: 0.2, radius: 400, color: "rgba(180, 45, 80, " },
      { x: width * 0.7, y: height * 0.2, vx: 0.2, vy: 0.4, radius: 480, color: "rgba(255, 120, 80, " },
    ];

    let time = 0;

    const render = () => {
      time += 0.005;

      ctx.fillStyle = "#080407";
      ctx.fillRect(0, 0, width, height);

      nodes.forEach((node, i) => {
        node.x += Math.sin(time + i) * 0.5 + node.vx;
        node.y += Math.cos(time + i * 1.5) * 0.5 + node.vy;

        if (node.x < -100 || node.x > width + 100) node.vx *= -1;
        if (node.y < -100 || node.y > height + 100) node.vy *= -1;

        const pulseOpacity = 0.14 + Math.sin(time * 1.2 + i) * 0.04;

        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius
        );

        gradient.addColorStop(0, `${node.color}${pulseOpacity})`);
        gradient.addColorStop(0.5, `${node.color}${pulseOpacity * 0.3})`);
        gradient.addColorStop(1, "rgba(8, 4, 7, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* 1. HTML5 Canvas */}
      {!isLowPower ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover opacity-60 transform-gpu"
        />
      ) : (
        <div className="absolute inset-0 bg-[#080407] bg-gradient-to-tr from-[#0b050a] via-[#160a13] to-[#080407]" />
      )}

      {/* 2. Fast CSS Radial Ambient Glows (Sunset Flare Spectrum) */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full opacity-25 pointer-events-none transform-gpu"
        style={{ background: "radial-gradient(circle, rgba(255,94,98,0.35) 0%, rgba(255,153,102,0.15) 45%, transparent 70%)" }}
      />
      <div 
        className="absolute -bottom-[25%] -right-[15%] w-[75vw] h-[75vw] max-w-[1000px] max-h-[1000px] rounded-full opacity-25 pointer-events-none transform-gpu"
        style={{ background: "radial-gradient(circle, rgba(255,209,102,0.3) 0%, rgba(180,45,80,0.15) 45%, transparent 70%)" }}
      />

      {/* 3. Bottom Vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080407] via-[#080407]/50 to-transparent pointer-events-none" />

    </div>
  );
}
