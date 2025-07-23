import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SimpleISFSphere } from '../components/SimpleISFMaterial';

/**
 * Example component demonstrating how to animate shader parameters using React hooks
 */
export function AnimatedShaderExample() {
  // Step 1: Create state variables for shader parameters you want to animate
  const [rate1, setRate1] = useState(1.9);
  const [color1, setColor1] = useState(0.45);
  const [color2, setColor2] = useState(1.0);
  const [depthX, setDepthX] = useState(0.85);
  const [depthY, setDepthY] = useState(0.25);
  
  // For more complex animations, you can use refs to store values
  // that don't need to trigger re-renders
  const animationRef = useRef({
    time: 0,
    direction: 1
  });

  // Step 2: Set up useEffect hooks to update parameters over time
  
  // Example 1: Simple interval-based animation
  useEffect(() => {
    // Create an interval that updates parameters every 100ms
    const interval = setInterval(() => {
      // Update rate1 parameter, cycling between min and max values
      setRate1(prev => {
        const newValue = prev + 0.05;
        return newValue > 3.0 ? -3.0 : newValue;
      });
      
      // Update color1 parameter with a different pattern
      setColor1(prev => {
        const newValue = prev + 0.02;
        return newValue > 2.5 ? -2.5 : newValue;
      });
    }, 100);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this runs once on mount
  
  // Example 2: Animation based on sin/cos for smooth oscillation
  useEffect(() => {
    const interval = setInterval(() => {
      // Use sine wave to oscillate depthX between 0.1 and 0.9
      setDepthX(0.5 + 0.4 * Math.sin(Date.now() * 0.001));
      
      // Use cosine wave for depthY (offset from depthX)
      setDepthY(0.5 + 0.4 * Math.cos(Date.now() * 0.001));
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, []);
  
  // Example 3: Using useFrame for animation synced with render loop
  useFrame(({ clock }) => {
    // Get the elapsed time
    const t = clock.getElapsedTime();
    
    // Update color2 based on time
    setColor2(Math.sin(t * 0.5) * 1.125);
    
    // For values that don't need to trigger re-renders,
    // you can update the ref directly
    animationRef.current.time = t;
  });
  
  // Step 3: Pass the state variables to the uniforms prop
  return (
    <SimpleISFSphere
      position={[0, 0, 0]}
      scale={1.2}
      castShadow
      receiveShadow
      url="/shaders/colorDiffusionFlow.fs"
      uniforms={{
        // Connect state variables to shader uniforms
        rate1: { value: rate1 },
        rate2: { value: 0.6 },
        loopcycle: { value: 85.0 },
        color1: { value: color1 },
        color2: { value: color2 },
        cycle1: { value: 1.33 },
        cycle2: { value: 0.22 },
        nudge: { value: 0.095 },
        depthX: { value: depthX },
        depthY: { value: depthY }
      }}
    />
  );
}

/**
 * Example showing how to create interactive controls for shader parameters
 */
export function InteractiveShaderExample() {
  // Step 1: Create state variables for all shader parameters
  const [params, setParams] = useState({
    rate1: 1.9,
    rate2: 0.6,
    loopcycle: 85.0,
    color1: 0.45,
    color2: 1.0,
    cycle1: 1.33,
    cycle2: 0.22,
    nudge: 0.095,
    depthX: 0.85,
    depthY: 0.25
  });
  
  // Step 2: Create update functions for each parameter
  const updateParam = (name: string, value: number) => {
    setParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Step 3: Pass the state variables to the uniforms prop
  return (
    <>
      <SimpleISFSphere
        position={[0, 0, 0]}
        scale={1.2}
        castShadow
        receiveShadow
        url="/shaders/colorDiffusionFlow.fs"
        uniforms={{
          // Convert state object to uniforms object
          rate1: { value: params.rate1 },
          rate2: { value: params.rate2 },
          loopcycle: { value: params.loopcycle },
          color1: { value: params.color1 },
          color2: { value: params.color2 },
          cycle1: { value: params.cycle1 },
          cycle2: { value: params.cycle2 },
          nudge: { value: params.nudge },
          depthX: { value: params.depthX },
          depthY: { value: params.depthY }
        }}
      />
      
      {/* UI controls would go here in a real application */}
    </>
  );
}