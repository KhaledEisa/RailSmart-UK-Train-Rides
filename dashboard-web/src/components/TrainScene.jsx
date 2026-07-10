import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const BODY = '#e8eaee'
const ROOF = '#cfd3da'
const STRIPE = '#C5A880'
const GLASS = '#101826'

const HST_URL = `${import.meta.env.BASE_URL}models/intercity125.stl`

// InterCity "black & gold" livery for the Intercity 125, banded by normalised
// height t (0 = bottom). The STL carries no colour, so we paint it to match the
// real scheme: black roof + upper body, white pinstripe split, gold lower body,
// thin red+white low, dark underframe.
const LIVERY = [
  [0.08, '#1f2126'], // underframe / bogies
  [0.105, '#e8e8e6'], // white pinstripe (low)
  [0.14, '#9e2f2a'], // red stripe
  [0.155, '#e8e8e6'], // white pinstripe
  [0.55, '#c39a37'], // gold lower bodyside
  [0.58, '#e8e8e6'], // white pinstripe (main split)
]
function liveryColorAt(t) {
  for (const [max, hex] of LIVERY) if (t < max) return hex
  return '#191a1e' // black upper body + roof
}

// ── Stylised train (primitives) ──────────────────────────────
function StylizedTrain({ color = STRIPE }) {
  const cars = [0, -3.2, -6.4]
  return (
    <group position={[0, 0.15, 0]}>
      {cars.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <mesh castShadow position={[0, 0.55, 0]}>
            <boxGeometry args={[1.5, 1.0, i === 0 ? 2.7 : 3.0]} />
            <meshStandardMaterial color={BODY} metalness={0.25} roughness={0.45} />
          </mesh>
          <mesh castShadow position={[0, 1.12, 0]}>
            <boxGeometry args={[1.42, 0.16, i === 0 ? 2.6 : 2.95]} />
            <meshStandardMaterial color={ROOF} metalness={0.3} roughness={0.5} />
          </mesh>
          {i === 0 && (
            <mesh castShadow position={[0, 0.55, 1.75]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.72, 0.55, 1.1, 24]} />
              <meshStandardMaterial color={BODY} metalness={0.25} roughness={0.4} />
            </mesh>
          )}
          <mesh position={[0.76, 0.62, 0]}>
            <boxGeometry args={[0.02, 0.4, i === 0 ? 2.0 : 2.4]} />
            <meshStandardMaterial color={GLASS} metalness={0.4} roughness={0.1} />
          </mesh>
          <mesh position={[-0.76, 0.62, 0]}>
            <boxGeometry args={[0.02, 0.4, i === 0 ? 2.0 : 2.4]} />
            <meshStandardMaterial color={GLASS} metalness={0.4} roughness={0.1} />
          </mesh>
          <mesh position={[0.77, 0.3, 0]}>
            <boxGeometry args={[0.02, 0.12, i === 0 ? 2.3 : 2.8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[-0.77, 0.3, 0]}>
            <boxGeometry args={[0.02, 0.12, i === 0 ? 2.3 : 2.8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0, -0.05, 0.9]}>
            <boxGeometry args={[1.3, 0.35, 0.6]} />
            <meshStandardMaterial color="#2a2f38" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.05, -0.9]}>
            <boxGeometry args={[1.3, 0.35, 0.6]} />
            <meshStandardMaterial color="#2a2f38" metalness={0.5} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Real HST model loaded from the user's STL ────────────────
// STL carries geometry only (no colour), and its axis/scale are unknown, so we
// bake an orient + scale + seat transform into a cloned geometry: longest axis
// becomes the train's length (along Z), sitting on the turntable at y≈0.
function HstTrain() {
  const raw = useLoader(STLLoader, HST_URL)
  const geometry = useMemo(() => {
    const g = raw.clone()
    g.center()

    // Try Z-up first (typical for CAD/STL exports), fall back if it looks wrong.
    g.rotateX(-Math.PI / 2)

    g.computeBoundingBox()
    const size = new THREE.Vector3()
    g.boundingBox.getSize(size)

    // Orient the longest horizontal axis to Z (down the "track").
    if (size.x > size.z) {
      g.rotateY(Math.PI / 2)
      g.computeBoundingBox()
      g.boundingBox.getSize(size)
    }

    // Scale so the length fills the turntable nicely.
    const s = 8.5 / Math.max(size.x, size.y, size.z)
    g.scale(s, s, s)

    // Seat the bottom on the turntable surface.
    g.computeBoundingBox()
    g.translate(0, -g.boundingBox.min.y, 0)
    g.computeVertexNormals()

    // Paint the black & gold livery by height (bands run horizontally).
    g.computeBoundingBox()
    const minY = g.boundingBox.min.y
    const span = g.boundingBox.max.y - minY || 1
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const col = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      col.set(liveryColorAt((pos.getY(i) - minY) / span))
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [raw])

  return (
    <mesh geometry={geometry} castShadow receiveShadow position={[0, -0.52, -2.6]}>
      <meshStandardMaterial vertexColors metalness={0.2} roughness={0.5} />
    </mesh>
  )
}

function ModelLoading() {
  return (
    <Html center>
      <div className="whitespace-nowrap rounded-full border border-white/15 bg-black/60 px-4 py-1.5 text-xs text-white/70 backdrop-blur">
        Loading Intercity 125 model…
      </div>
    </Html>
  )
}

function Turntable({ children, auto, speed = 0.35 }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (auto && ref.current) ref.current.rotation.y += dt * speed
  })
  return (
    <group ref={ref}>
      {children}
      {/* Just a thin glowing gold ring on the station floor — no solid disc, so
          the real platform shows through. */}
      <mesh position={[0, -0.5, -2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.5, 4.68, 96]} />
        <meshStandardMaterial
          color={STRIPE}
          emissive={STRIPE}
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[0, -0.49, -2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.28, 96]} />
        <meshStandardMaterial color={STRIPE} emissive={STRIPE} emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

export default function TrainScene({ auto = true, color = STRIPE, model = 'stylized' }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: [7, 3.8, 7.5], fov: 42 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <hemisphereLight args={['#aec8ff', '#1a1f2a', 0.8]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 10, 6]} intensity={1.6} castShadow />
      <directionalLight position={[-8, 5, -6]} intensity={0.6} color={STRIPE} />
      <pointLight position={[0, 3, 6]} intensity={0.6} color="#aec8ff" />

      <Suspense fallback={<ModelLoading />}>
        <Float speed={1} rotationIntensity={0} floatIntensity={0.4} floatingRange={[0, 0.12]}>
          <Turntable auto={auto} color={color}>
            {model === 'hst' ? <HstTrain /> : <StylizedTrain color={color} />}
          </Turntable>
        </Float>
        <ContactShadows position={[0, -0.5, -2.6]} opacity={0.5} scale={12} blur={2.2} far={5} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={8}
        maxDistance={18}
        minPolarAngle={0.6}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={false}
        target={[0, 0.4, -2.6]}
      />
    </Canvas>
  )
}
