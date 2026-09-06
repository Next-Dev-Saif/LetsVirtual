import { useGLTF } from '@react-three/drei';

export function IslandEnvironment() {
  const { scene } = useGLTF('/assets/AnotherIsland.glb');
  
  // You can traverse the scene to enable shadows or modify materials here if needed
  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <group>
      <primitive object={scene} />
      {/* Basic ambient lighting to ensure it's visible */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </group>
  );
}

useGLTF.preload('/assets/AnotherIsland.glb');
