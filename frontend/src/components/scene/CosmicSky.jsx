import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// High-Performance GPU Shader for Cosmic Nebula Sky Dome
const SkyDomeShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uTopColor: { value: new THREE.Color('#02010d') },    // Deep space zenith
    uMiddleColor: { value: new THREE.Color('#150936') }, // Deep cosmic violet
    uBottomColor: { value: new THREE.Color('#080417') }, // Horizon base
    uHorizonColor: { value: new THREE.Color('#38125c') },// Glowing horizon line
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uTopColor;
    uniform vec3 uMiddleColor;
    uniform vec3 uBottomColor;
    uniform vec3 uHorizonColor;
    uniform float uTime;
    varying vec3 vWorldPosition;

    // Fast GPU 2D noise for subtle cosmic nebula clouds
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    void main() {
      vec3 normPos = normalize(vWorldPosition);
      float h = normPos.y;
      
      // Multi-stop height gradient (smooth transition from horizon to zenith)
      vec3 skyColor;
      if (h < 0.05) {
        skyColor = mix(uBottomColor, uHorizonColor, max(0.0, h + 0.1) * 6.66);
      } else if (h < 0.35) {
        skyColor = mix(uHorizonColor, uMiddleColor, (h - 0.05) / 0.3);
      } else {
        skyColor = mix(uMiddleColor, uTopColor, (h - 0.35) / 0.65);
      }

      // Shimmering procedural nebula cloud overlay computed 100% on GPU
      vec2 uv = normPos.xz * 2.5 + vec2(uTime * 0.008, uTime * 0.005);
      float n1 = noise(uv * 3.0);
      float n2 = noise(uv * 6.0 + vec2(uTime * 0.01));
      float nebula = (n1 * 0.6 + n2 * 0.4);
      
      vec3 nebulaColor = mix(vec3(0.35, 0.1, 0.55), vec3(0.08, 0.45, 0.65), n1);
      skyColor += nebulaColor * nebula * 0.35 * max(0.0, h);

      gl_FragColor = vec4(skyColor, 1.0);
    }
  `
};

export function CosmicSky() {
  const materialRef = useRef();
  const moonRef = useRef();
  const moonRingRef = useRef();
  const starsGroupRef = useRef();

  // Create shader material instance
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(SkyDomeShaderMaterial.uniforms),
      vertexShader: SkyDomeShaderMaterial.vertexShader,
      fragmentShader: SkyDomeShaderMaterial.fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  // Generate lightweight static celestial star clusters
  const shootingStarsData = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      startX: (Math.sin(i * 2.5) * 120) - 60,
      startY: 70 + (i * 15),
      startZ: -100 - (i * 20),
      speed: 40 + (i * 15),
      length: 12 + (i * 4),
    }));
  }, []);

  const starRefs = useRef([]);

  useFrame((_, delta) => {
    // Advance GPU shader time
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }

    // Slow celestial rotation of Cyber Moon & Moon Ring
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * 0.03;
    }
    if (moonRingRef.current) {
      moonRingRef.current.rotation.z += delta * 0.02;
    }

    // Update shooting star streaks
    starRefs.current.forEach((starMesh, idx) => {
      if (!starMesh) return;
      const data = shootingStarsData[idx];
      starMesh.position.x += delta * data.speed;
      starMesh.position.y -= delta * (data.speed * 0.35);

      // Reset when shooting star leaves screen bounds
      if (starMesh.position.x > 180 || starMesh.position.y < 20) {
        starMesh.position.x = data.startX - 100;
        starMesh.position.y = data.startY + 40;
      }
    });
  });

  return (
    <group>
      {/* 1. Large High-Performance GPU Sky Dome */}
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[350, 32, 32]} />
        <primitive object={shaderMaterial} ref={materialRef} attach="material" />
      </mesh>

      {/* 2. Stunning Cyberpunk Celestial Ringed Moon */}
      <group position={[75, 115, -140]}>
        {/* Core Glowing Moon Sphere */}
        <mesh ref={moonRef}>
          <sphereGeometry args={[14, 32, 32]} />
          <meshStandardMaterial
            color="#ebd9ff"
            emissive="#a472ff"
            emissiveIntensity={1.4}
            roughness={0.4}
          />
        </mesh>

        {/* Outer Emissive Moon Halo Atmosphere */}
        <mesh scale={[1.18, 1.18, 1.18]}>
          <sphereGeometry args={[14, 24, 24]} />
          <meshBasicMaterial
            color="#bf94ff"
            transparent
            opacity={0.18}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Orbital Planetary Ring */}
        <mesh ref={moonRingRef} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
          <ringGeometry args={[18, 26, 64]} />
          <meshStandardMaterial
            color="#8c52ff"
            emissive="#6729ff"
            emissiveIntensity={1.8}
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Soft Point Light cast from Moon onto upper clouds */}
        <pointLight color="#a875ff" intensity={3} distance={250} decay={2} />
      </group>

      {/* 3. Passing Lightweight Shooting Star Streaks */}
      <group ref={starsGroupRef}>
        {shootingStarsData.map((star, idx) => (
          <mesh
            key={star.id}
            ref={(el) => (starRefs.current[idx] = el)}
            position={[star.startX, star.startY, star.startZ]}
            rotation={[0, 0, -Math.PI / 6]}
          >
            <cylinderGeometry args={[0.08, 0.6, star.length, 6]} />
            <meshBasicMaterial
              color="#e8d5ff"
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
