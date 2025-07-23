import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useShaderText, basicVertexShader, prepareShaderForThree } from '../utils/simpleIsfShader';

interface SimpleISFMaterialProps {
  url: string;
  inputTexture?: THREE.Texture;
  uniforms?: { [key: string]: { value: any } };
}

export function SimpleISFMaterial({ url, inputTexture, uniforms = {} }: SimpleISFMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { shaderText, error, loading } = useShaderText(url);
  const { size } = useThree();
  
  // Create and update the shader material
  useEffect(() => {
    if (!loading && shaderText && materialRef.current) {
      const processedShader = prepareShaderForThree(shaderText);
      
      // Update the shader
      materialRef.current.fragmentShader = processedShader;
      materialRef.current.vertexShader = basicVertexShader;
      materialRef.current.needsUpdate = true;
      
      // Set up any input textures
      if (inputTexture && materialRef.current.uniforms.inputImage) {
        materialRef.current.uniforms.inputImage.value = inputTexture;
      }
    }
    
    if (error) {
      console.error('Error loading shader:', error);
    }
  }, [shaderText, loading, error, inputTexture]);
  
  // Update time and resolution uniforms on each frame
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
      materialRef.current.uniforms.resolution.value = new THREE.Vector2(size.width, size.height);
    }
  });
  
  // Combine default uniforms with custom uniforms
  const defaultUniforms = {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(size.width, size.height) },
    inputImage: { value: inputTexture || new THREE.Texture() },
    ...uniforms
  };
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={defaultUniforms}
      vertexShader={basicVertexShader}
      fragmentShader={loading ? '' : (shaderText ? prepareShaderForThree(shaderText) : '')}
    />
  );
}

// Higher-order component to apply ISF material to any mesh
export function withSimpleISFMaterial(Component: React.ComponentType<any>) {
  return function WithSimpleISFMaterial(props: any & SimpleISFMaterialProps) {
    const { url, inputTexture, uniforms, ...rest } = props;
    
    return (
      <Component {...rest}>
        <SimpleISFMaterial url={url} inputTexture={inputTexture} uniforms={uniforms} />
      </Component>
    );
  };
}

// Pre-configured components with ISF material
export const SimpleISFBox = withSimpleISFMaterial(({ children, ...props }: any) => (
  <mesh {...props}>
    <boxGeometry />
    {children}
  </mesh>
));

export const SimpleISFSphere = withSimpleISFMaterial(({ children, ...props }: any) => (
  <mesh {...props}>
    <sphereGeometry />
    {children}
  </mesh>
));

export const SimpleISFPlane = withSimpleISFMaterial(({ children, ...props }: any) => (
  <mesh {...props}>
    <planeGeometry />
    {children}
  </mesh>
));