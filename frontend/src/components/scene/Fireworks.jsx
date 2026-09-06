import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Fireworks({ position = [0, 20, -10], color = '#ff0055' }) {
  const pointsRef = useRef();
  const particleCount = 100;
  
  const [positions, velocities, colors] = useMemo(() => {
    const p = new Float32Array(particleCount * 3);
    const v = new Float32Array(particleCount * 3);
    const c = new Float32Array(particleCount * 3);
    
    const colorObj = new THREE.Color(color);
    
    for (let i = 0; i < particleCount; i++) {
      // Start all particles at center (relative to the group)
      p[i * 3] = 0;
      p[i * 3 + 1] = 0;
      p[i * 3 + 2] = 0;
      
      // Random spherical velocities
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = Math.random() * 0.2 + 0.1;
      
      v[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
      v[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      v[i * 3 + 2] = speed * Math.cos(phi);
      
      // Colors with high intensity for bloom
      c[i * 3] = colorObj.r * 2;
      c[i * 3 + 1] = colorObj.g * 2;
      c[i * 3 + 2] = colorObj.b * 2;
    }
    
    return [p, v, c];
  }, [color]);

  useFrame(() => {
    if (!pointsRef.current) return;
    
    const p = pointsRef.current.geometry.attributes.position.array;
    
    // Update positions based on velocity and add gravity
    for (let i = 0; i < particleCount; i++) {
      // Gravity
      velocities[i * 3 + 1] -= 0.002; 
      
      p[i * 3] += velocities[i * 3];
      p[i * 3 + 1] += velocities[i * 3 + 1];
      p[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Reset if they fall too far (simple loop for continuous fireworks)
      if (p[i * 3 + 1] < -30) {
        p[i * 3] = 0;
        p[i * 3 + 1] = 0;
        p[i * 3 + 2] = 0;
        
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = Math.random() * 0.2 + 0.2;
        velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
        velocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
        velocities[i * 3 + 2] = speed * Math.cos(phi);
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group position={position}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.5} 
          vertexColors 
          transparent 
          blending={THREE.AdditiveBlending} 
          depthWrite={false} 
        />
      </points>
      <pointLight color={color} intensity={10} distance={50} />
    </group>
  );
}
