"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles, Stars } from "@react-three/drei";
import { Ghost as GhostIcon } from "lucide-react";
import * as THREE from "three";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

function FallbackGhost() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="relative">
        <div className="absolute inset-0 -m-20 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute inset-0 -m-8 rounded-full bg-cyan-400/10 blur-2xl" />
        <GhostIcon
          size={150}
          className="relative animate-drift text-violet-300/80 drop-shadow-[0_0_35px_rgba(139,92,246,0.65)]"
          strokeWidth={0.75}
        />
      </div>
    </div>
  );
}

function createGhostGeometry() {
  const geometry = new THREE.SphereGeometry(1, 72, 56);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i);
    let y = position.getY(i) * 1.22;
    let z = position.getZ(i);

    // Flare and ripple the lower half into a classic draped skirt.
    if (y < 0.08) {
      const depth = Math.min(1, Math.max(0, -y));
      const angle = Math.atan2(z, x);
      const wave = Math.sin(angle * 5 + depth * 1.2);
      const flare = 1 + depth * depth * 0.42 + wave * 0.055 * depth;
      x *= flare;
      z *= flare;
      y += Math.sin(angle * 5) * 0.075 * depth - depth * depth * 0.04;
    }

    // Taper the crown slightly.
    if (y > 0.62) {
      const k = 1 - (y - 0.62) * 0.14;
      x *= k;
      z *= k;
    }

    position.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function GlowEye({ x, blinkRef }: { x: number; blinkRef: React.RefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.scale.y = THREE.MathUtils.damp(
      ref.current.scale.y,
      blinkRef.current ?? 1,
      22,
      delta,
    );
  });
  return (
    <group ref={ref} position={[x, 0.15, 0.86]}>
      <mesh>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial
          color="#d9fbff"
          emissive="#67e8f9"
          emissiveIntensity={3.2}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={[2.1, 1.7, 0.7]} position={[0, 0, -0.02]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} />
      </mesh>
      <pointLight color="#67e8f9" intensity={2.6} distance={1.7} decay={2} />
    </group>
  );
}

function Ghost() {
  const geometry = useMemo(createGhostGeometry, []);
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const blinkRef = useRef(1);
  const nextBlink = useRef(2.4);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { x, y } = state.pointer;

    if (inner.current) {
      inner.current.rotation.y = THREE.MathUtils.damp(
        inner.current.rotation.y,
        x * 0.42,
        3.5,
        delta,
      );
      inner.current.rotation.x = THREE.MathUtils.damp(
        inner.current.rotation.x,
        -y * 0.24,
        3.5,
        delta,
      );
      inner.current.position.x = THREE.MathUtils.damp(
        inner.current.position.x,
        x * 0.28,
        3,
        delta,
      );
    }
    if (outer.current) {
      outer.current.position.y = Math.sin(t * 0.9) * 0.09;
      outer.current.rotation.z = Math.sin(t * 0.45) * 0.02;
    }

    if (t > nextBlink.current) {
      blinkRef.current = 0.08;
      if (t > nextBlink.current + 0.16) {
        blinkRef.current = 1;
        nextBlink.current = t + 2.8 + Math.random() * 3.4;
      }
    } else {
      blinkRef.current = 1;
    }
  });

  return (
    <group ref={outer}>
      <Float speed={1.35} rotationIntensity={0.16} floatIntensity={0.55}>
        <group ref={inner} position={[0, 0.15, 0]}>
          {/* halo rings behind the spirit */}
          <mesh position={[0, 0.05, -1.1]}>
            <torusGeometry args={[1.72, 0.008, 12, 120]} />
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.55} />
          </mesh>
          <mesh position={[0, 0.05, -1.15]} rotation={[0, 0, 0.5]}>
            <torusGeometry args={[2.05, 0.005, 12, 120]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.28} />
          </mesh>

          {/* the ghost body */}
          <mesh geometry={geometry} renderOrder={1}>
            <meshPhysicalMaterial
              color="#b7a4ff"
              emissive="#6d28d9"
              emissiveIntensity={0.55}
              transparent
              opacity={0.62}
              roughness={0.12}
              metalness={0.02}
              transmission={0.42}
              thickness={0.9}
              ior={1.18}
              clearcoat={1}
              clearcoatRoughness={0.15}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* subtle spectral shell */}
          <mesh geometry={geometry} scale={1.015} renderOrder={0}>
            <meshBasicMaterial
              color="#c4b5fd"
              wireframe
              transparent
              opacity={0.05}
              depthWrite={false}
            />
          </mesh>

          <GlowEye x={-0.32} blinkRef={blinkRef} />
          <GlowEye x={0.32} blinkRef={blinkRef} />

          {/* little glowing mouth */}
          <mesh position={[0, -0.22, 0.9]} scale={[1, 0.72, 1]} renderOrder={2}>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#22d3ee"
              emissiveIntensity={1.4}
              transparent
              opacity={0.7}
              toneMapped={false}
            />
          </mesh>

          {/* wispy arms */}
          <mesh position={[-0.92, -0.24, 0.2]} rotation={[0, 0, 0.55]}>
            <capsuleGeometry args={[0.11, 0.5, 8, 16]} />
            <meshPhysicalMaterial
              color="#b7a4ff"
              transparent
              opacity={0.38}
              roughness={0.2}
              transmission={0.35}
              thickness={0.4}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0.92, -0.24, 0.2]} rotation={[0, 0, -0.55]}>
            <capsuleGeometry args={[0.11, 0.5, 8, 16]} />
            <meshPhysicalMaterial
              color="#b7a4ff"
              transparent
              opacity={0.38}
              roughness={0.2}
              transmission={0.35}
              thickness={0.4}
              depthWrite={false}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function Scene({ reduced }: { reduced: boolean }) {
  return (
    <>
      <fog attach="fog" args={["#080812", 7, 18]} />
      <ambientLight intensity={0.55} color="#c4b5fd" />
      <directionalLight position={[4, 5, 6]} intensity={2.4} color="#e9e2ff" />
      <pointLight position={[-3.2, 1.2, 3]} intensity={14} color="#22d3ee" distance={9} decay={2} />
      <pointLight position={[3.4, -0.8, 2.6]} intensity={20} color="#8b5cf6" distance={10} decay={2} />
      <pointLight position={[0, 2.2, -2]} intensity={10} color="#f472b6" distance={8} decay={2} />

      <Ghost />

      <Sparkles
        count={reduced ? 24 : 64}
        scale={[7, 4.6, 5]}
        size={2.2}
        speed={reduced ? 0 : 0.28}
        opacity={0.65}
        color="#c4b5fd"
      />
      <Sparkles
        count={reduced ? 12 : 34}
        scale={[6.2, 4, 4.4]}
        size={1.5}
        speed={reduced ? 0 : 0.42}
        opacity={0.55}
        color="#67e8f9"
      />
      <Stars radius={42} depth={24} count={700} factor={4} saturation={0.2} fade speed={reduced ? 0 : 0.35} />

      <ContactShadows
        position={[0, -2.05, 0]}
        opacity={0.35}
        scale={6.5}
        blur={2.6}
        far={4}
        resolution={256}
        color="#4c1d95"
        frames={1}
      />
    </>
  );
}

export default function Ghost3D() {
  const [reduced, setReduced] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(supportsWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!webgl) return <FallbackGhost />;

  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [0, 0.2, 6.4], fov: 40 }}
      dpr={[1, 1.75]}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Scene reduced={reduced} />
    </Canvas>
  );
}
