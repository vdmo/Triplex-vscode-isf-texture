import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useISFShader, basicVertexShader, convertISFToThreeShader } from '../utils/isfShader';

interface ISFMaterialProps {
  url: string;
  inputTexture?: THREE.Texture;
  uniforms?: { [key: string]: { value: any } };
}

export function ISFMaterial({ url, inputTexture, uniforms = {} }: ISFMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { shader, error, loading } = useISFShader(url);
  const { size } = useThree();
  
  // Generate default values for ISF uniforms from metadata
  const [isfUniforms, setIsfUniforms] = useState<{ [key: string]: { value: any } }>({});
  
  // Extract default values from ISF metadata
  useEffect(() => {
    if (shader?.metadata?.INPUTS) {
      const extractedUniforms: { [key: string]: { value: any } } = {};
      
      shader.metadata.INPUTS.forEach(input => {
        const name = input.NAME;
        const defaultValue = input.DEFAULT;
        
        if (defaultValue !== undefined) {
          extractedUniforms[name] = { value: defaultValue };
        } else {
          // Provide sensible defaults based on type
          switch (input.TYPE) {
            case 'float':
              extractedUniforms[name] = { value: 0.0 };
              break;
            case 'bool':
              extractedUniforms[name] = { value: false };
              break;
            case 'int':
              extractedUniforms[name] = { value: 0 };
              break;
            case 'color':
              extractedUniforms[name] = { value: [1.0, 1.0, 1.0, 1.0] };
              break;
            case 'point2d':
              extractedUniforms[name] = { value: new THREE.Vector2(0, 0) };
              break;
            case 'point3d':
              extractedUniforms[name] = { value: new THREE.Vector3(0, 0, 0) };
              break;
            case 'image':
              extractedUniforms[name] = { value: new THREE.Texture() };
              break;
          }
        }
      });
      
      setIsfUniforms(extractedUniforms);
    }
  }, [shader]);
  
  // Create and update the shader material
  useEffect(() => {
    if (!loading && shader && materialRef.current) {
      const { fragmentShader } = shader;
      const convertedFragmentShader = convertISFToThreeShader(fragmentShader);
      
      // Update the shader
      materialRef.current.fragmentShader = convertedFragmentShader;
      materialRef.current.vertexShader = basicVertexShader;
      materialRef.current.needsUpdate = true;
      
      // Set up any input textures
      if (inputTexture && materialRef.current.uniforms.inputImage) {
        materialRef.current.uniforms.inputImage.value = inputTexture;
      }
    }
    
    if (error) {
      console.error('Error loading ISF shader:', error);
    }
  }, [shader, loading, error, inputTexture]);
  
  // Update time and resolution uniforms on each frame
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
      materialRef.current.uniforms.resolution.value = new THREE.Vector2(size.width, size.height);
    }
  });
  
  // Combine all uniforms with priority: custom uniforms > ISF metadata defaults > base defaults
  const defaultUniforms = {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(size.width, size.height) },
    inputImage: { value: inputTexture || new THREE.Texture() },
    ...isfUniforms,  // Add ISF metadata defaults
    ...uniforms      // Custom uniforms override defaults
  };
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={defaultUniforms}
      vertexShader={basicVertexShader}
      fragmentShader={loading ? '' : (shader ? convertISFToThreeShader(shader.fragmentShader) : '')}
    />
  );
}

// Higher-order component to apply ISF material to any mesh
export function withISFMaterial(Component: React.ComponentType<any>) {
  return function WithISFMaterial(props: any & ISFMaterialProps) {
    const { url, inputTexture, uniforms, ...rest } = props;
    
    return (
      <Component {...rest}>
        <ISFMaterial url={url} inputTexture={inputTexture} uniforms={uniforms} />
      </Component>
    );
  };
}

// Pre-configured components with ISF material
export const ISFBox = withISFMaterial(({ children, ...props }: any) => (
  <mesh {...props}>
    <boxGeometry />
    {children}
  </mesh>
));

export const ISFSphere = withISFMaterial(({ children, ...props }: any) => (
  <mesh {...props}>
    <sphereGeometry />
    {children}
  </mesh>
));

export const ISFPlane = withISFMaterial(({ children, ...props }: any) => (
  <mesh {...props}>
    <planeGeometry />
    {children}
  </mesh>
));