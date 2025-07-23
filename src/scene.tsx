import { useState, useEffect } from 'react';
import { SimpleISFBox, SimpleISFMaterial } from './components/SimpleISFMaterial';

export function Scene() {
  // You can use state to control shader uniforms
  const [speed, setSpeed] = useState(1.0);
  const [colorA, setColorA] = useState([1.0, 0.0, 0.0, 1.0]);
  const [colorB, setColorB] = useState([0.0, 0.0, 1.0, 1.0]);

  // Optional: Change uniforms over time for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed((prevSpeed) => (prevSpeed + 0.1) % 5);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Method 1: Using pre-configured Simple ISF components */}
      <SimpleISFBox
        position={[-1.5, 0, 0]}
        castShadow
        receiveShadow
        url="/shaders/sample.fs"
        uniforms={{
          speed: { value: speed },
          colorA: { value: colorA },
          colorB: { value: colorB }
        }}
      />

      {/* Method 2: Using SimpleISFMaterial with any mesh */}
      <mesh position={[1.5, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <SimpleISFMaterial
          url="/shaders/sample.fs"
          uniforms={{
            speed: { value: 2.0 },
            colorA: { value: [0.0, 1.0, 0.0, 1.0] },
            colorB: { value: [1.0, 1.0, 0.0, 1.0] }
          }}
        />
      </mesh>
    </>
  );
}
