import { useState, useEffect } from 'react';
import { SimpleISFBox, SimpleISFMaterial, SimpleISFSphere } from './components/SimpleISFMaterial';

export function Scene() {
  // You can use state to control shader uniforms
  const [speed, setSpeed] = useState(1.0);
  const [colorA, setColorA] = useState([1.0, 0.0, 0.0, 1.0]);
  const [colorB, setColorB] = useState([0.0, 0.0, 1.0, 1.0]);
  
  // State for ColorDiffusionFlow shader
  const [rate1, setRate1] = useState(1.9);
  const [rate2, setRate2] = useState(0.6);
  const [color1, setColor1] = useState(0.45);
  const [color2, setColor2] = useState(1.0);

  // Optional: Change uniforms over time for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed((prevSpeed) => (prevSpeed + 0.1) % 5);
      setRate1((prevRate) => (prevRate + 0.05) % 3.0);
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
      
      {/* New object with ColorDiffusionFlow shader */}
      <SimpleISFSphere
        position={[0, 1.5, 0]}
        scale={1.2}
        castShadow
        receiveShadow
        url="/shaders/colorDiffusionFlow.fs"
        uniforms={{
          rate1: { value: rate1 },
          rate2: { value: rate2 },
          loopcycle: { value: 85.0 },
          color1: { value: color1 },
          color2: { value: color2 },
          cycle1: { value: 1.33 },
          cycle2: { value: 0.22 },
          nudge: { value: 0.095 },
          depthX: { value: 0.85 },
          depthY: { value: 0.25 }
        }}
      />
    </>
  );
}
