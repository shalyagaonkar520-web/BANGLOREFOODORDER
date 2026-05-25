import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Float, Stars, MeshDistortMaterial, Text, PresentationControls, Environment, ContactShadows, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// STYLIZED SCOOTER COMPONENT
// ═══════════════════════════════════════════════════════════════
function ScooterRider({ speed = 1 }) {
  const scooterRef = useRef<THREE.Group>(null);
  const frontWheelRef = useRef<THREE.Mesh>(null);
  const backWheelRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (scooterRef.current) {
      // Subtle lean and bounce
      scooterRef.current.rotation.z = Math.sin(time * 3) * 0.02;
      scooterRef.current.position.y = Math.sin(time * 10) * 0.02;
    }
    if (frontWheelRef.current) frontWheelRef.current.rotation.x += 0.2;
    if (backWheelRef.current) backWheelRef.current.rotation.x += 0.2;
  });

  return (
    <group ref={scooterRef}>
      {/* Scooter Body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.4, 0.1, 1]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Main Frame (Orange Accent) */}
      <mesh position={[0, 0.7, -0.2]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.6, 0.1]} />
        <meshStandardMaterial color="#FF4D00" emissive="#FF4D00" emissiveIntensity={0.5} />
      </mesh>

      {/* Seat */}
      <mesh position={[0, 0.8, -0.4]}>
        <boxGeometry args={[0.35, 0.1, 0.4]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Handlebar */}
      <group position={[0, 1.1, 0.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {/* Headlight */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.15, 0.1, 0.1]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 0, 0.5]} distance={5} intensity={2} color="#fff" />
      </group>

      {/* Wheels */}
      <mesh ref={frontWheelRef} position={[0, 0.2, 0.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh ref={backWheelRef} position={[0, 0.2, -0.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Delivery Box */}
      <mesh position={[0, 1.1, -0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.4]} />
        <meshStandardMaterial color="#FF4D00" />
        {/* Logo Sticker */}
        <mesh position={[0, 0, -0.21]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </mesh>

      {/* Rider (Simplified) */}
      <group position={[0, 1.2, -0.2]}>
        {/* Torso */}
        <mesh>
          <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* Helmet */}
        <mesh position={[0, 0.5, 0.1]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#FF4D00" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// CITY STREET ENVIRONMENT
// ═══════════════════════════════════════════════════════════════
function CityStreet() {
  const groupRef = useRef<THREE.Group>(null);
  const roadCount = 10;
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.z += delta * 15; // Speed of movement
      if (groupRef.current.position.z > 20) {
        groupRef.current.position.z = 0;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 200]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Road Lines */}
      {[...Array(20)].map((_, i) => (
        <mesh key={i} position={[0, 0.01, -i * 10 + 50]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 4]} />
          <meshStandardMaterial color="#FF4D00" emissive="#FF4D00" emissiveIntensity={0.5} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Abstract Buildings (Glow Boxes) */}
      {[...Array(40)].map((_, i) => (
        <group key={i} position={[i % 2 === 0 ? -8 : 8, 2, -Math.floor(i / 2) * 15 + 50]}>
          <mesh>
            <boxGeometry args={[4, 15, 4]} />
            <meshStandardMaterial color="#050505" metalness={1} roughness={0} />
          </mesh>
          {/* Windows/Lights */}
          {[...Array(5)].map((_, j) => (
            <mesh key={j} position={[i % 2 === 0 ? 2.01 : -2.01, j * 2 - 4, Math.sin(i + j) * 1]}>
              <planeGeometry args={[0.5, 0.3]} />
              <meshStandardMaterial color="#333" emissive={i % 5 === 0 ? "#FF4D00" : "#111"} emissiveIntensity={2} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANIMATION COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DeliveryAnimation({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Preparing your feast...");

  useEffect(() => {
    console.log("DeliveryAnimation mounted");
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next === 30) setStatus("Courier is on the move!");
        if (next === 60) setStatus("Almost at your doorstep...");
        if (next === 90) setStatus("Arrived! Delivering fresh.");
        if (next >= 100) {
          clearInterval(timer);
          onFinish();
          return 100;
        }
        return next;
      });
    }, 60); // Slightly faster
    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col"
    >
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 3, 8], fov: 45 }}>
          <PerspectiveCamera makeDefault position={[0, 3, 8]} />
          <color attach="background" args={["#050505"]} />
          
          <ambientLight intensity={1} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <pointLight position={[-10, -10, -10]} intensity={2} color="#FF4D00" />

          <Suspense fallback={null}>
            <PresentationControls
              global
              rotation={[0, 0.3, 0]}
              polar={[-Math.PI / 4, Math.PI / 4]}
              azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
              <group position={[0, -1, 0]}>
                <ScooterRider />
                <CityStreet />
              </group>
            </PresentationControls>
            
            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          </Suspense>
        </Canvas>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#050505] to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#050505] to-transparent" />
          
          {/* Status Text */}
          <div className="absolute top-20 left-0 w-full text-center space-y-4 px-6">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              key={status}
              className="space-y-2"
            >
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
                {status.split(' ').map((word, i) => (
                   <span key={i} className={i % 2 !== 0 ? "text-brand" : ""}>{word} </span>
                ))}
              </h2>
              <p className="text-white/20 font-black uppercase tracking-[6px] text-xs">Estimated arrival: 15-20 Mins</p>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-xs px-10">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-brand shadow-[0_0_15px_rgba(255,77,0,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-4">
               <span className="text-[8px] font-black text-brand uppercase tracking-widest">Kitchen</span>
               <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Your Home</span>
            </div>
          </div>
        </div>

        {/* Skip Button */}
        <button 
          onClick={onFinish}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all pointer-events-auto"
        >
          Skip to WhatsApp
        </button>
      </div>
      
      {/* Sound Visualizer Decoration (Fake) */}
      <div className="h-24 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-center gap-1">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ height: [4, Math.random() * 40 + 10, 4] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
            className="w-1 bg-[#FF4D00]/30 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
}
