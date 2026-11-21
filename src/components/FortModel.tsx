import { useLayoutEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { FortSection } from '../data/sections'
import { sections } from '../data/sections'
import { localizeSections, uiText, type Language } from '../i18n'

const sand = '#a76b40'
const lightSand = '#bb8051'
const darkSand = '#7c4d30'
const sectionGlow: Record<string, string> = {
  tower: '#d84f47', gate: '#8769c2', well: '#4d90ca', council: '#df8a40',
  'outer-wall': '#d84f47', storage: '#8369c3', cannons: '#5c8c6c', guards: '#68a778',
}

function useSectionHighlight(ref: RefObject<THREE.Group | null>, selected: boolean, color: string) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    root.traverse((object) => {
      const mesh = object as THREE.Mesh
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
      materials.forEach((material) => {
        const litMaterial = material as THREE.Material & { emissive?: THREE.Color; emissiveIntensity?: number }
        if (!litMaterial.emissive) return
        litMaterial.emissive.set(selected ? color : '#000000')
        litMaterial.emissiveIntensity = selected ? 0.3 : 0
      })
    })
  }, [color, ref, selected])
}

function createSandTexture() {
  const size = 256
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = (y * size + x) * 4
    const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    const noise = ((grain - Math.floor(grain)) - 0.5) * 7 + Math.sin(y * 0.09 + x * 0.017) * 1.8
    data[i] = Math.max(0, Math.min(255, 185 + noise))
    data[i + 1] = Math.max(0, Math.min(255, 126 + noise * 0.78))
    data[i + 2] = Math.max(0, Math.min(255, 75 + noise * 0.6))
    data[i + 3] = 255
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3.2, 1.5)
  texture.needsUpdate = true
  return texture
}

function createRockGeometry() {
  const segments = 96
  const layers = [
    { radius: 0.42, y: -0.06 }, { radius: 1.08, y: -0.1 }, { radius: 1.86, y: -0.04 },
    { radius: 2.62, y: 0.02 }, { radius: 3.43, y: 0.04 }, { radius: 3.9, y: -0.19 },
    { radius: 4.15, y: -0.48 }, { radius: 3.95, y: -0.79 },
  ]
  const positions: number[] = []
  const indices: number[] = []
  positions.push(0, -0.04, 0)
  for (let ring = 0; ring < layers.length; ring += 1) {
    const { radius, y: layerY } = layers[ring]
    for (let i = 0; i < segments; i += 1) {
      const a = (i / segments) * Math.PI * 2
      const irregular = 1 + 0.07 * Math.sin(3 * a + ring * 0.7) + 0.035 * Math.cos(7 * a - ring * 0.7) + 0.015 * Math.sin(13 * a + ring)
      const x = radius * irregular * Math.cos(a)
      const z = radius * 0.86 * irregular * Math.sin(a)
      const y = layerY + 0.055 * Math.sin(5 * a + ring * 0.8) + 0.028 * Math.cos(9 * a - ring * 0.2)
      positions.push(x, y, z)
    }
  }
  for (let i = 0; i < segments; i += 1) indices.push(0, 1 + ((i + 1) % segments), 1 + i)
  for (let ring = 0; ring < layers.length - 1; ring += 1) {
    const inner = 1 + ring * segments
    const outer = inner + segments
    for (let i = 0; i < segments; i += 1) {
      const next = (i + 1) % segments
      indices.push(inner + i, outer + next, outer + i, inner + i, inner + next, outer + next)
    }
  }
  const bottomCenter = positions.length / 3
  positions.push(0, -1.02, 0)
  const bottomRing = 1 + (layers.length - 1) * segments
  for (let i = 0; i < segments; i += 1) indices.push(bottomCenter, bottomRing + i, bottomRing + ((i + 1) % segments))
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function CrenellationRing({ radius, y, count, size = 0.25, height = 0.35, color = lightSand }: { radius: number; y: number; count: number; size?: number; height?: number; color?: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2
      dummy.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius)
      dummy.rotation.set(0, -a, 0)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [count, radius, y])

  return <instancedMesh ref={mesh} args={[undefined, undefined, count]} receiveShadow>
    <boxGeometry args={[size, height, size * 0.82]} />
    <meshStandardMaterial color={color} roughness={0.92} />
  </instancedMesh>
}

function MasonrySurface({ radius, rows, columns, baseY, pitch }: { radius: number; rows: number; columns: number; baseY: number; pitch: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    const palette = ['#ae7549', '#b47b4f', '#b77e51', '#a96e44', '#b17649']
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column
      const offset = row % 2 ? 0.5 : 0
      const a = ((column + offset) / columns) * Math.PI * 2
      const irregularity = Math.sin(index * 12.989) * 0.018
      const courseOffset = Math.sin(column * 3.7 + row * 1.3) * 0.018
      dummy.position.set(Math.cos(a) * (radius + irregularity), baseY + row * pitch + courseOffset, Math.sin(a) * (radius + irregularity))
      dummy.rotation.set(0, Math.PI / 2 - a, 0)
      dummy.scale.set(0.94 + ((index * 17) % 7) * 0.018, 0.9 + ((index * 11) % 5) * 0.035, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
      mesh.current.setColorAt(index, new THREE.Color(palette[(row * 3 + column * 7) % palette.length]))
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [baseY, columns, pitch, radius, rows])
  return <instancedMesh ref={mesh} args={[undefined, undefined, rows * columns]} castShadow receiveShadow>
    <boxGeometry args={[0.32, 0.18, 0.034]} />
    <meshStandardMaterial roughness={0.98} />
  </instancedMesh>
}

function ArcMasonrySurface({ radius, start, end, height, pitch = 0.16 }: { radius: number; start: number; end: number; height: number; pitch?: number }) {
  const rows = Math.max(1, Math.floor(height / pitch))
  const columns = Math.max(1, Math.ceil((end - start) * radius / 0.29))
  const mesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    const palette = ['#ae7549', '#b47b4f', '#b77e51', '#a96e44']
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column
      const offset = row % 2 ? 0.5 : 0
      const a = start + (end - start) * (column + offset + 0.5) / columns
      dummy.position.set(Math.cos(a) * radius, 0.075 + row * pitch, Math.sin(a) * radius)
      dummy.rotation.set(0, Math.PI / 2 - a, 0)
      dummy.scale.set(0.94 + ((index * 13) % 5) * 0.025, 0.92 + ((index * 7) % 4) * 0.04, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
      mesh.current.setColorAt(index, new THREE.Color(palette[(row * 3 + column * 5) % palette.length]))
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [columns, end, pitch, radius, rows, start])
  const brickWidth = (end - start) * radius / columns * 0.9
  return <instancedMesh ref={mesh} args={[undefined, undefined, rows * columns]} castShadow receiveShadow>
    <boxGeometry args={[brickWidth, pitch * 0.82, 0.034]} />
    <meshStandardMaterial roughness={0.98} />
  </instancedMesh>
}

function Flag({ baseY }: { baseY: number }) {
  return (
    <group position={[0.05, baseY, 0.02]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 1.55, 8]} />
        <meshStandardMaterial color="#554536" roughness={0.8} />
      </mesh>
      <group position={[0.27, 1.22, 0]}>
        <mesh position={[0, 0.23, 0]} castShadow><boxGeometry args={[0.55, 0.19, 0.015]} /><meshStandardMaterial color="#fff7ed" /></mesh>
        <mesh position={[0, 0.04, 0]} castShadow><boxGeometry args={[0.55, 0.19, 0.015]} /><meshStandardMaterial color="#d22630" /></mesh>
        <mesh position={[0, -0.15, 0]} castShadow><boxGeometry args={[0.55, 0.19, 0.015]} /><meshStandardMaterial color="#14804a" /></mesh>
        <mesh position={[-0.255, 0.04, 0]}><boxGeometry args={[0.09, 0.56, 0.02]} /><meshStandardMaterial color="#d22630" /></mesh>
      </group>
    </group>
  )
}

function TowerOpenings({ radius, y, count, width = 0.12, height = 0.25, highlighted = false }: { radius: number; y: number; count: number; width?: number; height?: number; highlighted?: boolean }) {
  const group = useRef<THREE.Group>(null)
  useSectionHighlight(group, highlighted, sectionGlow.cannons)
  return <group ref={group}>{Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2
    return <group key={i} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]} rotation={[0, -a + Math.PI / 2, 0]}>
      <mesh position={[0, 0, 0.002]}><boxGeometry args={[width, height, 0.028]} /><meshStandardMaterial color="#392d23" roughness={1} /></mesh>
      <mesh position={[0, -height * 0.62, 0.02]}><boxGeometry args={[width * 1.65, 0.04, 0.07]} /><meshStandardMaterial color={darkSand} roughness={1} /></mesh>
    </group>
  })}</group>
}

function createWallArcGeometry(radius: number, thickness: number, height: number, start: number, end: number, segments: number) {
  const positions: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segments; i += 1) {
    const a = start + (end - start) * i / segments
    const c = Math.cos(a)
    const s = Math.sin(a)
    positions.push(c * radius, 0, s * radius, c * radius, height, s * radius)
    positions.push(c * (radius - thickness), 0, s * (radius - thickness), c * (radius - thickness), height, s * (radius - thickness))
  }
  const stride = 4
  for (let i = 0; i < segments; i += 1) {
    const p = i * stride
    const q = p + stride
    indices.push(p, q, q + 1, p, q + 1, p + 1) // outer face
    indices.push(p + 2, p + 3, q + 3, p + 2, q + 3, q + 2) // inner face
    indices.push(p + 1, q + 1, q + 3, p + 1, q + 3, p + 3) // top
    indices.push(p, p + 2, q + 2, p, q + 2, q) // bottom
  }
  // Close the two exposed ends of this wall run.
  indices.push(0, 1, 3, 0, 3, 2)
  const last = segments * stride
  indices.push(last, last + 2, last + 3, last, last + 3, last + 1)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function WallCrenels({ radius, y, start, end, count, size = 0.22, height = 0.28 }: { radius: number; y: number; start: number; end: number; count: number; size?: number; height?: number }) {
  return <group>
    {Array.from({ length: count }, (_, i) => {
      const a = start + (end - start) * (i + 0.5) / count
      return <mesh key={i} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]} rotation={[0, -a, 0]} castShadow receiveShadow>
        <boxGeometry args={[size, height, size * 0.8]} />
        <meshStandardMaterial color={i % 3 === 0 ? '#c78b55' : lightSand} roughness={0.94} />
      </mesh>
    })}
  </group>
}

function CurvedWall({ radius, thickness, height, y, start, end, crenelCount, color = sand, highlighted = false, highlightColor = sectionGlow['outer-wall'] }: { radius: number; thickness: number; height: number; y: number; start: number; end: number; crenelCount: number; color?: string; highlighted?: boolean; highlightColor?: string }) {
  const group = useRef<THREE.Group>(null)
  useSectionHighlight(group, highlighted, highlightColor)
  const geometry = useMemo(() => createWallArcGeometry(radius, thickness, height, start, end, Math.max(24, Math.ceil((end - start) * 24))), [radius, thickness, height, start, end])
  return <group ref={group} position={[0, y, 0]}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.94} side={THREE.DoubleSide} />
    </mesh>
    <ArcMasonrySurface radius={radius + 0.02} start={start} end={end} height={height} />
    <mesh position={[0, height - 0.025, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius + 0.035, radius + 0.035, 0.08, Math.max(24, Math.ceil((end - start) * 30)), 1, true, start, end - start]} />
      <meshStandardMaterial color="#9d633c" roughness={0.96} side={THREE.DoubleSide} />
    </mesh>
    <WallCrenels radius={radius + 0.02} y={height + 0.16} start={start} end={end} count={crenelCount} />
  </group>
}

function SquareTower({ position, width, height, texture }: { position: [number, number, number]; width: number; height: number; texture: THREE.DataTexture }) {
  const crenels = 8
  return <group position={position}>
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, height, width]} />
      <meshStandardMaterial map={texture} bumpMap={texture} bumpScale={0.04} roughness={0.96} />
    </mesh>
    <mesh position={[0, height - 0.04, 0]} castShadow>
      <boxGeometry args={[width + 0.12, 0.12, width + 0.12]} />
      <meshStandardMaterial color="#99603a" roughness={0.96} />
    </mesh>
    {Array.from({ length: crenels }, (_, i) => {
      const side = i % 4
      const along = Math.floor(i / 4) === 0 ? -width * 0.28 : width * 0.28
      const edge = width / 2 + 0.02
      const x = side === 0 ? along : side === 1 ? edge : side === 2 ? -along : -edge
      const z = side === 0 ? edge : side === 1 ? along : side === 2 ? -edge : -along
      return <mesh key={i} position={[x, height + 0.13, z]} castShadow>
        <boxGeometry args={[side % 2 === 0 ? width * 0.27 : 0.18, 0.27, side % 2 === 0 ? 0.18 : width * 0.27]} />
        <meshStandardMaterial color={lightSand} roughness={0.92} />
      </mesh>
    })}
    <mesh position={[0, height * 0.62, width / 2 + 0.006]}>
      <boxGeometry args={[0.12, 0.2, 0.025]} />
      <meshStandardMaterial color="#35281f" roughness={1} />
    </mesh>
  </group>
}

function Entrance({ position, rotation = 0, highlighted = false }: { position: [number, number, number]; rotation?: number; highlighted?: boolean }) {
  const group = useRef<THREE.Group>(null)
  useSectionHighlight(group, highlighted, sectionGlow.gate)
  return <group ref={group} position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.52, 1.48, 0.92]} />
      <meshStandardMaterial color="#b77a47" roughness={0.96} />
    </mesh>
    <mesh position={[0, 0.43, 0.468]}>
      <boxGeometry args={[0.57, 0.83, 0.035]} />
      <meshStandardMaterial color="#34251d" roughness={1} />
    </mesh>
    <mesh position={[0, 0.86, 0.49]}>
      <torusGeometry args={[0.285, 0.045, 8, 24, Math.PI]} />
      <meshStandardMaterial color="#d49b63" roughness={0.9} />
    </mesh>
    <mesh position={[0, 1.51, 0]} castShadow>
      <boxGeometry args={[1.74, 0.17, 1.06]} />
      <meshStandardMaterial color="#99613b" roughness={0.96} />
    </mesh>
    <mesh position={[0, 1.18, -0.34]} castShadow>
      <boxGeometry args={[1.5, 0.38, 0.18]} />
      <meshStandardMaterial color="#bf8250" roughness={0.95} />
    </mesh>
  </group>
}

function IllustrativeSectionGeometry({ selectedId }: { selectedId: string | null }) {
  const well = useRef<THREE.Group>(null)
  const council = useRef<THREE.Group>(null)
  const storage = useRef<THREE.Group>(null)
  useSectionHighlight(well, selectedId === 'well', sectionGlow.well)
  useSectionHighlight(council, selectedId === 'council', sectionGlow.council)
  useSectionHighlight(storage, selectedId === 'storage', sectionGlow.storage)
  return <>
    {/* The following location-specific rooms are illustrative learning markers, not surveyed archaeology. */}
    <group ref={well} position={[-1.45, 0.12, 2.45]} scale={0.86}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.37, 0.4, 0.48, 24, 1, true]} />
        <meshStandardMaterial color={selectedId === 'well' ? '#78aee2' : '#a66e43'} emissive={selectedId === 'well' ? sectionGlow.well : '#000000'} emissiveIntensity={selectedId === 'well' ? 0.32 : 0} roughness={0.96} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.075, 8, 24]} /><meshStandardMaterial color={selectedId === 'well' ? '#91c5f5' : '#c28b58'} emissive={selectedId === 'well' ? sectionGlow.well : '#000000'} emissiveIntensity={selectedId === 'well' ? 0.32 : 0} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 24]} /><meshStandardMaterial color="#30251d" roughness={1} />
      </mesh>
    </group>
    <group ref={council} position={[-2.1, 0.35, 2.1]} scale={0.78}>
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow><boxGeometry args={[0.9, 0.92, 0.72]} /><meshStandardMaterial color={selectedId === 'council' ? '#e59a4d' : '#b27a4b'} emissive={selectedId === 'council' ? sectionGlow.council : '#000000'} emissiveIntensity={selectedId === 'council' ? 0.3 : 0} roughness={0.96} /></mesh>
      <mesh position={[0, 0.28, 0.37]}><boxGeometry args={[0.32, 0.56, 0.035]} /><meshStandardMaterial color="#39291e" roughness={1} /></mesh>
      <mesh position={[0, 0.96, 0]} castShadow><boxGeometry args={[1.02, 0.12, 0.84]} /><meshStandardMaterial color={selectedId === 'council' ? '#f0ad63' : '#8f5a38'} emissive={selectedId === 'council' ? sectionGlow.council : '#000000'} emissiveIntensity={selectedId === 'council' ? 0.3 : 0} roughness={0.97} /></mesh>
    </group>
    <group ref={storage} position={[3.1, 0.35, 1.7]} scale={0.82}>
      <mesh position={[0, 0.39, 0]} castShadow receiveShadow><boxGeometry args={[0.78, 0.78, 0.72]} /><meshStandardMaterial color={selectedId === 'storage' ? '#a98bd7' : '#a66e43'} emissive={selectedId === 'storage' ? sectionGlow.storage : '#000000'} emissiveIntensity={selectedId === 'storage' ? 0.34 : 0} roughness={0.96} /></mesh>
      <mesh position={[0, 0.28, 0.37]}><boxGeometry args={[0.28, 0.48, 0.035]} /><meshStandardMaterial color="#39291e" roughness={1} /></mesh>
      <mesh position={[0, 0.82, 0]} castShadow><boxGeometry args={[0.88, 0.12, 0.82]} /><meshStandardMaterial color={selectedId === 'storage' ? '#c0a3ed' : '#8f5a38'} emissive={selectedId === 'storage' ? sectionGlow.storage : '#000000'} emissiveIntensity={selectedId === 'storage' ? 0.34 : 0} roughness={0.97} /></mesh>
    </group>
  </>
}

function MainTower({ texture, highlighted, highlightCannons }: { texture: THREE.DataTexture; highlighted: boolean; highlightCannons: boolean }) {
  const group = useRef<THREE.Group>(null)
  useSectionHighlight(group, highlighted, sectionGlow.tower)
  // The visible wall and parapet are kept close to the published 34:45 height/diameter ratio.
  // This removes the extra height previously added by the parapet and crenels on top of a full 34:45 wall.
  return <group ref={group}>
      <mesh position={[0, 1.675, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.18, 2.3, 3.35, 96, 16, false]} />
      <meshStandardMaterial map={texture} bumpMap={texture} bumpScale={0.055} roughness={0.94} />
    </mesh>
      <MasonrySurface radius={2.315} rows={16} columns={42} baseY={0.12} pitch={0.2} />
      <mesh position={[0, 3.42, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[2.22, 2.22, 0.18, 96]} />
      <meshStandardMaterial color={sand} roughness={0.96} />
    </mesh>
      <mesh position={[0, 3.55, 0]}>
      <cylinderGeometry args={[2.2, 2.2, 0.08, 96]} />
      <meshStandardMaterial color="#d29a64" roughness={0.95} />
    </mesh>
      <CrenellationRing radius={2.19} y={3.75} count={52} size={0.18} height={0.28} />
      <TowerOpenings radius={2.35} y={1.05} count={18} width={0.1} height={0.2} highlighted={highlightCannons} />
      <TowerOpenings radius={2.34} y={2.55} count={18} width={0.1} height={0.2} />
      <Flag baseY={3.89} />
  </group>
}

function OuterArchitecture({ texture, selectedId }: { texture: THREE.DataTexture; selectedId: string | null }) {
  return <group>
    {/* Inner defended walk: split arcs expose changes in level around the tower. */}
    <CurvedWall radius={2.7} thickness={0.34} height={0.86} y={0.12} start={1.06} end={2.92} crenelCount={21} highlighted={selectedId === 'guards'} highlightColor={sectionGlow.guards} />
    <CurvedWall radius={2.91} thickness={0.34} height={1.02} y={0.12} start={0.12} end={0.62} crenelCount={9} />
    <CurvedWall radius={2.78} thickness={0.34} height={0.88} y={0.12} start={3.22} end={5.88} crenelCount={28} highlighted={selectedId === 'guards'} highlightColor={sectionGlow.guards} />
    {/* Outer wall is intentionally broken into unequal runs around the entrance. */}
    <CurvedWall radius={3.25} thickness={0.44} height={1.05} y={0.08} start={0.08} end={0.56} crenelCount={7} color="#a96e42" highlighted={selectedId === 'outer-wall'} />
    <CurvedWall radius={3.55} thickness={0.42} height={1.3} y={0.08} start={1.02} end={1.68} crenelCount={9} color="#b77a49" highlighted={selectedId === 'outer-wall'} />
    <CurvedWall radius={3.86} thickness={0.44} height={0.98} y={0.08} start={2.23} end={2.95} crenelCount={10} color="#ad7044" highlighted={selectedId === 'outer-wall'} />
    <CurvedWall radius={3.48} thickness={0.42} height={1.05} y={0.08} start={3.28} end={5.82} crenelCount={30} color="#a96e42" highlighted={selectedId === 'outer-wall'} />
    {/* Uneven square flanking towers establish the stepped reference silhouette. */}
    <SquareTower position={[-3.45, 0.08, 1.72]} width={0.78} height={1.48} texture={texture} />
    <SquareTower position={[3.24, 0.08, 0.85]} width={0.8} height={1.78} texture={texture} />
    <SquareTower position={[-1.36, 0.08, 3.28]} width={0.88} height={1.52} texture={texture} />
    <SquareTower position={[2.48, 0.08, -1.82]} width={0.76} height={1.78} texture={texture} />
    <SquareTower position={[-2.56, 0.08, -1.65]} width={0.72} height={0.94} texture={texture} />
    <Entrance position={[2.02, 0.08, 2.56]} rotation={0.9} highlighted={selectedId === 'gate'} />
    {/* A descending approach ramp and broad steps make the entrance legible. */}
    <group position={[2.1, -0.03, 3.35]} rotation={[0, 0.9, 0]}>
      <mesh position={[0, 0.08, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 0.18, 1.65]} />
        <meshStandardMaterial color="#c48b59" roughness={0.98} />
      </mesh>
      {Array.from({ length: 3 }, (_, i) => <mesh key={i} position={[0, 0.12 + i * 0.075, 1.02 + i * 0.22]} castShadow receiveShadow>
        <boxGeometry args={[1.38, 0.16, 0.3]} />
        <meshStandardMaterial color={i % 2 ? '#c38a57' : '#d19a64'} roughness={0.97} />
      </mesh>)}
    </group>
    <IllustrativeSectionGeometry selectedId={selectedId} />
  </group>
}

function RockyBase() {
  const rockGeometry = useMemo(() => createRockGeometry(), [])
  return <group>
    <mesh geometry={rockGeometry} position={[0, 0.05, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#8b5a36" roughness={1} flatShading side={THREE.DoubleSide} />
    </mesh>
    {Array.from({ length: 58 }, (_, i) => {
      // Denser, larger broken stones along the front toe; lighter scatter behind the walls.
      const a = i < 38 ? 0.12 + i * 0.079 : (i * 2.399) % (Math.PI * 2)
      const r = i < 38 ? 3.5 + ((i * 37) % 100) / 100 * 0.62 : 3.15 + ((i * 29) % 100) / 100 * 0.96
      const size = i < 38 ? 0.17 + ((i * 19) % 100) / 100 * 0.29 : 0.11 + ((i * 13) % 100) / 100 * 0.22
      return <mesh key={i} position={[Math.cos(a) * r, -0.04 + (i % 4) * 0.04, Math.sin(a) * r]} rotation={[0.2 * (i % 4), a, 0.18 * (i % 3)]} scale={[1.35 + (i % 3) * 0.18, 0.72 + (i % 2) * 0.18, 0.9 + (i % 4) * 0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[size, 0]} /><meshStandardMaterial color={i % 3 ? '#9a6740' : '#ad7549'} roughness={1} flatShading />
      </mesh>
    })}
  </group>
}

function Hotspot({ section, selected, visible, onSelect, language }: { section: FortSection; selected: boolean; visible: boolean; onSelect: (id: string) => void; language: Language }) {
  return <group position={section.position} visible={visible} name={`hotspot-${section.id}`}>
    <Html center zIndexRange={[30, 20]}>
      <button type="button" className={`hotspot ${selected ? 'hotspot--selected' : ''} ${selected && ['outer-wall', 'well', 'council'].includes(section.id) ? 'hotspot--left' : ''}`} style={{ '--hotspot-color': section.color } as CSSProperties}
        aria-label={`${uiText[language].select} ${section.name}`} aria-pressed={selected} title={section.name}
        onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSelect(section.id) }}>
        <span aria-hidden="true">{selected ? '✓' : ''}</span>{selected && <span className="hotspot-label" aria-hidden="true">{section.name}</span>}
      </button>
    </Html>
  </group>
}

export function FortModel({ selectedId, onSelect, showHotspots = true, language }: { selectedId: string | null; onSelect: (id: string) => void; showHotspots?: boolean; language: Language }) {
  const texture = useMemo(() => createSandTexture(), [])
  return <group position={[0, 0, 0]} rotation={[0, 0.45, 0]}>
    <RockyBase />
    <OuterArchitecture texture={texture} selectedId={selectedId} />
    <MainTower texture={texture} highlighted={selectedId === 'tower'} highlightCannons={selectedId === 'cannons'} />
    {localizeSections(language, sections).map((section) => <Hotspot key={section.id} section={section} selected={selectedId === section.id} visible={showHotspots} onSelect={onSelect} language={language} />)}
  </group>
}
