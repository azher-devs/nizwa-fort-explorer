import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { FortModel } from './FortModel'
import type { Language } from '../i18n'

export type ViewerHandle = {
  reset: () => void
  zoom: (direction: 'in' | 'out') => void
}

type FortViewerProps = {
  selectedId: string | null
  onSelect: (id: string) => void
  autoRotate: boolean
  showHotspots?: boolean
  className?: string
  onLoadingChange?: (loading: boolean) => void
  language: Language
}

function Scene({ selectedId, onSelect, showHotspots, language }: Pick<FortViewerProps, 'selectedId' | 'onSelect' | 'showHotspots' | 'language'>) {
  return <>
    <color attach="background" args={['#f8f4ed']} />
    <ambientLight intensity={1.1} />
    <hemisphereLight args={['#fff8ec', '#876043', 0.9]} />
    <directionalLight position={[-5, 9, 7]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={24} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-0.00025} shadow-radius={10} />
    <directionalLight position={[7, 5, -4]} intensity={0.85} color="#f4c38d" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <shadowMaterial opacity={0.065} />
    </mesh>
    <Suspense fallback={null}>
      <FortModel selectedId={selectedId} onSelect={onSelect} showHotspots={showHotspots} language={language} />
    </Suspense>
  </>
}

export const FortViewer = forwardRef<ViewerHandle, FortViewerProps>(function FortViewer({ selectedId, onSelect, autoRotate, showHotspots = true, className = '', onLoadingChange, language }, ref) {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useRef<THREE.PerspectiveCamera>(null)
  const container = useRef<HTMLDivElement>(null)
  const defaultPosition = new THREE.Vector3(10.1, 8.2, 12.8)
  const tabletPosition = new THREE.Vector3(11.6, 9.4, 14.7)
  useEffect(() => {
    const frame = () => {
      if (!container.current || !camera.current || !controls.current) return
      const mobile = window.innerWidth < 760
      const tablet = window.innerWidth < 940
      camera.current.position.copy(mobile ? new THREE.Vector3(15, 12, 19) : tablet ? tabletPosition : defaultPosition)
      camera.current.fov = 35
      camera.current.zoom = 1
      camera.current.updateProjectionMatrix()
      controls.current.target.set(0, 0.93, 0)
      controls.current.minDistance = mobile ? 12 : 8
      controls.current.maxDistance = mobile ? 28 : 24
      controls.current.update()
    }
    const observer = new ResizeObserver(frame)
    if (container.current) observer.observe(container.current)
    requestAnimationFrame(frame)
    return () => observer.disconnect()
  }, [])
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (camera.current) {
        const mobile = window.innerWidth < 760
        const tablet = window.innerWidth < 940
        camera.current.position.copy(mobile ? new THREE.Vector3(15, 12, 19) : tablet ? tabletPosition : defaultPosition)
        camera.current.fov = 35
        camera.current.zoom = 1
        camera.current.updateProjectionMatrix()
      }
      controls.current?.target.set(0, 0.93, 0)
      controls.current?.update()
    },
    zoom: (direction) => {
      if (!camera.current || !controls.current) return
      const offset = camera.current.position.clone().sub(controls.current.target)
      offset.multiplyScalar(direction === 'in' ? 0.86 : 1.16).clampLength(controls.current.minDistance, controls.current.maxDistance)
      camera.current.position.copy(controls.current.target.clone().add(offset))
      controls.current.update()
      camera.current.updateProjectionMatrix()
    },
  }), [])
  return <div className={`fort-canvas ${className}`} ref={container}>
    <Canvas shadows dpr={[1, 1.7]} camera={{ position: [10.1, 8.2, 12.8], fov: 35, near: 0.1, far: 80 }} onCreated={({ camera: activeCamera }) => {
      const perspectiveCamera = activeCamera as THREE.PerspectiveCamera
      camera.current = perspectiveCamera
      requestAnimationFrame(() => {
        const mobile = window.innerWidth < 760
        const tablet = window.innerWidth < 940
        perspectiveCamera.position.copy(mobile ? new THREE.Vector3(15, 12, 19) : tablet ? tabletPosition : defaultPosition)
        perspectiveCamera.fov = 35
        perspectiveCamera.zoom = 1
        perspectiveCamera.updateProjectionMatrix()
        controls.current?.update()
      })
      onLoadingChange?.(false)
    }}>
      <Scene selectedId={selectedId} onSelect={onSelect} showHotspots={showHotspots} language={language} />
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={8} maxDistance={24} minPolarAngle={0.42} maxPolarAngle={1.43} target={[0, 0.93, 0]} autoRotate={autoRotate} autoRotateSpeed={0.45} enablePan />
    </Canvas>
  </div>
})
