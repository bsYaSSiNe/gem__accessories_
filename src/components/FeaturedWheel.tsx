"use client";

/* React DOM's generic lint rule does not know React Three Fiber JSX elements. */
/* eslint-disable react/no-unknown-property */
/* The render loop intentionally mutates one shared motion ref at frame rate. */
/* eslint-disable react-hooks/immutability */

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Image, RoundedBox } from "@react-three/drei";
import {
  AdditiveBlending,
  DoubleSide,
  MathUtils,
  type Group,
} from "three";

const MAX_WHEEL_PRODUCTS = 8;
const TWO_PI = Math.PI * 2;
const FRONT_ANGLE = Math.PI / 2;
const AUTO_ROTATION_SPEED = 0.105;
const DRAG_RADIANS_PER_PIXEL = 0.0068;
const AUTO_RESUME_DELAY_MS = 2000;
const COMPACT_VIEWPORT_QUERY =
  "(max-width: 760px), (pointer: coarse) and (max-height: 700px)";

type ImportMetaWithEnv = ImportMeta & {
  env?: {
    BASE_URL?: string;
  };
};

const runtimeBasePath =
  (import.meta as ImportMetaWithEnv).env?.BASE_URL ?? "/";

export type FeaturedProductFact = {
  label: string;
  value: string;
};

export type FeaturedProduct = {
  id: string;
  name: string;
  shortName?: string;
  image: string;
  alt?: string;
  category?: string;
  description?: string;
  story?: string;
  palette?: string;
  badge?: string;
  price?: string;
  availability?: string;
  materials?: readonly string[];
  details?: readonly string[];
  facts?: readonly FeaturedProductFact[];
  href?: string;
  sourceUrl?: string;
  ctaLabel?: string;
};

export type FeaturedWheelProps = {
  products: readonly FeaturedProduct[];
  reducedMotion: boolean;
  className?: string;
  assetBasePath?: string;
  initialIndex?: number;
  ariaLabel?: string;
  onChange?: (product: FeaturedProduct, index: number) => void;
};

const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

function normalizeIndex(index: number, count: number) {
  if (count === 0) return 0;
  return ((index % count) + count) % count;
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

/** Resolve root-style public assets correctly under a GitHub Pages base path. */
export function resolveFeaturedAssetPath(source: string, basePath?: string) {
  if (
    /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(source) ||
    source.startsWith("data:") ||
    source.startsWith("blob:")
  ) {
    return source;
  }

  const base = basePath ?? runtimeBasePath;
  const cleanSource = source.replace(/^\.\//, "").replace(/^\/+/, "");

  if (/^https?:\/\//i.test(base)) {
    return new URL(cleanSource, `${base.replace(/\/+$/, "")}/`).toString();
  }

  const cleanBase = trimSlashes(base);
  if (cleanBase && cleanSource.startsWith(`${cleanBase}/`)) {
    return `/${cleanSource}`;
  }

  return cleanBase ? `/${cleanBase}/${cleanSource}` : `/${cleanSource}`;
}

type WheelMotion = {
  angle: number;
  velocity: number;
  targetAngle: number | null;
  dragging: boolean;
  paused: boolean;
  resumeAt: number;
};

function wrappedAngle(value: number) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

function WheelLights({ compact }: { compact: boolean }) {
  return (
    <>
      <ambientLight intensity={0.68} color="#fff8ff" />
      <directionalLight
        position={[-5, 7, 4]}
        color="#ffe8f5"
        intensity={2.7}
      />
      <spotLight
        position={[0, 7, 5]}
        target-position={[0, -0.45, 0]}
        color="#fff4dc"
        intensity={115}
        distance={18}
        angle={0.44}
        penumbra={0.92}
        castShadow={!compact}
      />
      <pointLight
        position={[4.2, 1.8, 4.8]}
        color="#cddcff"
        intensity={42}
        distance={12}
      />
      <pointLight
        position={[-4.4, 0.2, 1.6]}
        color="#ffd5e9"
        intensity={36}
        distance={11}
      />
      {!compact ? (
        <pointLight
          position={[0, -0.7, -4]}
          color="#e9d1ff"
          intensity={30}
          distance={11}
        />
      ) : null}
    </>
  );
}

/** A layered optical-glass torus, laid flat on the XZ plane. */
function GlassRing({ radius, compact }: { radius: number; compact: boolean }) {
  const ringSegments = compact ? 80 : 112;

  return (
    <group position={[0, -0.5, 0]}>
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={!compact}
        receiveShadow={!compact}
      >
        <torusGeometry args={[radius, 0.13, compact ? 16 : 24, ringSegments]} />
        <meshPhysicalMaterial
          color="#ffe9f8"
          metalness={0.04}
          roughness={0.055}
          transmission={0.9}
          thickness={1.08}
          ior={1.48}
          clearcoat={1}
          clearcoatRoughness={0.045}
          transparent
          opacity={0.8}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <torusGeometry args={[radius - 0.15, 0.016, 8, ringSegments]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.68} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <torusGeometry args={[radius + 0.15, 0.026, 8, ringSegments]} />
        <meshStandardMaterial
          color="#efc9b1"
          emissive="#7b4938"
          emissiveIntensity={0.12}
          metalness={0.82}
          roughness={0.16}
        />
      </mesh>
    </group>
  );
}

function PlaqueFrame() {
  const frameColor = "#f2d3bd";

  return (
    <group position={[0, 0, 0.095]}>
      <mesh position={[0, 0.602, 0]}>
        <boxGeometry args={[0.92, 0.018, 0.022]} />
        <meshStandardMaterial color={frameColor} metalness={0.78} roughness={0.17} />
      </mesh>
      <mesh position={[0, -0.602, 0]}>
        <boxGeometry args={[0.92, 0.018, 0.022]} />
        <meshStandardMaterial color={frameColor} metalness={0.78} roughness={0.17} />
      </mesh>
      <mesh position={[0.452, 0, 0]}>
        <boxGeometry args={[0.018, 1.22, 0.022]} />
        <meshStandardMaterial color={frameColor} metalness={0.78} roughness={0.17} />
      </mesh>
      <mesh position={[-0.452, 0, 0]}>
        <boxGeometry args={[0.018, 1.22, 0.022]} />
        <meshStandardMaterial color={frameColor} metalness={0.78} roughness={0.17} />
      </mesh>
    </group>
  );
}

function ProductPlaque({
  product,
  imageUrl,
  selected,
  compact,
  onSelect,
}: {
  product: FeaturedProduct;
  imageUrl: string;
  selected: boolean;
  compact: boolean;
  onSelect: () => void;
}) {
  return (
    <group onClick={onSelect}>
      <RoundedBox
        args={[1.15, 1.5, 0.075]}
        radius={0.12}
        smoothness={compact ? 4 : 7}
        castShadow={!compact}
        receiveShadow={!compact}
      >
        {compact ? (
          <meshStandardMaterial
            color={selected ? "#fff8fd" : "#e9ddfb"}
            metalness={0.08}
            roughness={0.2}
            transparent
            opacity={selected ? 0.86 : 0.64}
            side={DoubleSide}
          />
        ) : (
          <meshPhysicalMaterial
            color={selected ? "#fff8fd" : "#e9ddfb"}
            metalness={0.025}
            roughness={0.075}
            transmission={0.74}
            thickness={0.72}
            ior={1.46}
            clearcoat={1}
            clearcoatRoughness={0.055}
            transparent
            opacity={selected ? 0.88 : 0.67}
            side={DoubleSide}
          />
        )}
      </RoundedBox>

      <Suspense
        fallback={
          <mesh position={[0, 0, 0.09]}>
            <planeGeometry args={[0.9, 1.18]} />
            <meshBasicMaterial
              color={selected ? "#f8ddec" : "#cfc8e8"}
              transparent
              opacity={selected ? 0.48 : 0.3}
              toneMapped={false}
            />
          </mesh>
        }
      >
        <Image
          url={imageUrl}
          scale={[0.9, 1.18]}
          position={[0, 0, 0.09]}
          radius={0.065}
          transparent
          opacity={selected ? 1 : 0.88}
          toneMapped={false}
        />
      </Suspense>
      <PlaqueFrame />

      <mesh position={[0, -0.72, 0.035]}>
        <sphereGeometry args={[0.047, compact ? 12 : 18, compact ? 12 : 18]} />
        <meshStandardMaterial
          color={selected ? "#fff3b2" : "#eecce8"}
          emissive={selected ? "#ffd66c" : "#8d6189"}
          emissiveIntensity={selected ? 1.6 : 0.18}
          metalness={0.42}
          roughness={0.16}
        />
      </mesh>

      {/* Product wording deliberately remains in the DOM, not in WebGL. */}
      <mesh visible={false} name={product.name} />
    </group>
  );
}

function PastelParticles({ compact }: { compact: boolean }) {
  const particleCount = compact ? 14 : 26;
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, index) => {
        const angle = (index / particleCount) * TWO_PI + 0.19;
        const radius = 3.3 + (index % 4) * 0.21;
        return {
          position: [
            Math.cos(angle) * radius,
            -0.38 + (index % 6) * 0.42,
            Math.sin(angle) * radius,
          ] as [number, number, number],
          size: index % 7 === 0 ? 0.068 : 0.028,
          color:
            index % 3 === 0
              ? "#ffd4ea"
              : index % 3 === 1
                ? "#d8e1ff"
                : "#fff0b8",
        };
      }),
    [particleCount],
  );

  return (
    <group>
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.position}>
          <sphereGeometry args={[particle.size, 10, 10]} />
          <meshBasicMaterial
            color={particle.color}
            transparent
            opacity={0.72}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function WheelScene({
  products,
  imageUrls,
  activeIndex,
  motion,
  onFrontChange,
  onSelect,
}: {
  products: readonly FeaturedProduct[];
  imageUrls: readonly string[];
  activeIndex: number;
  motion: MutableRefObject<WheelMotion>;
  onFrontChange: (index: number) => void;
  onSelect: (index: number) => void;
}) {
  const wheelRef = useRef<Group>(null);
  const plaqueRefs = useRef<Array<Group | null>>([]);
  const lastFrontIndex = useRef(activeIndex);
  const { camera, size } = useThree();
  const step = TWO_PI / products.length;
  const radius = 3.08;
  const compact =
    size.width < 760 || size.height < 680 || size.width / size.height > 1.35;

  useEffect(() => {
    camera.position.set(0, compact ? 4.05 : 3.45, compact ? 11.4 : 8.7);
    camera.lookAt(0, 0.2, 0);
    camera.updateProjectionMatrix();
  }, [camera, compact]);

  useFrame((_, frameDelta) => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const delta = Math.min(frameDelta, 0.05);
    const state = motion.current;
    const now = performance.now();

    if (!state.dragging) {
      if (state.paused) {
        state.velocity = MathUtils.damp(state.velocity, 0, 5, delta);
      } else if (state.targetAngle !== null) {
        const nextAngle = MathUtils.damp(
          state.angle,
          state.targetAngle,
          5.3,
          delta,
        );
        state.velocity = delta > 0 ? (nextAngle - state.angle) / delta : 0;
        state.angle = nextAngle;

        if (Math.abs(state.targetAngle - state.angle) < 0.0008) {
          state.angle = state.targetAngle;
          state.targetAngle = null;
          state.velocity = 0;
          state.resumeAt = now + AUTO_RESUME_DELAY_MS;
        }
      } else if (now < state.resumeAt) {
        state.angle += state.velocity * delta;
        state.velocity *= Math.exp(-2.7 * delta);
      } else {
        state.velocity = MathUtils.damp(
          state.velocity,
          AUTO_ROTATION_SPEED,
          1.6,
          delta,
        );
        state.angle += state.velocity * delta;
      }
    }

    /* The sign keeps the mathematical phase and Three's Y rotation aligned. */
    wheel.rotation.y = -state.angle;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    plaqueRefs.current.forEach((plaque, index) => {
      if (!plaque) return;
      const worldAngle = state.angle + index * step;
      const frontDistance = Math.abs(wrappedAngle(worldAngle - FRONT_ANGLE));
      if (frontDistance < nearestDistance) {
        nearestDistance = frontDistance;
        nearestIndex = index;
      }

      const frontness = (Math.sin(worldAngle) + 1) / 2;
      const isFront = index === activeIndex;
      const targetScale = 0.64 + frontness * 0.31 + (isFront ? 0.07 : 0);
      const scale = MathUtils.damp(plaque.scale.x, targetScale, 7.5, delta);
      plaque.scale.setScalar(scale);
      plaque.rotation.y = MathUtils.damp(
        plaque.rotation.y,
        state.angle - Math.cos(worldAngle) * 0.18,
        8,
        delta,
      );
      plaque.position.y = MathUtils.damp(
        plaque.position.y,
        isFront ? 0.72 : 0.65,
        6.5,
        delta,
      );
    });

    if (nearestIndex !== lastFrontIndex.current) {
      lastFrontIndex.current = nearestIndex;
      onFrontChange(nearestIndex);
    }
  });

  return (
    <>
      <WheelLights compact={compact} />

      <mesh
        position={[0, -1.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow={!compact}
      >
        <circleGeometry args={[4.6, compact ? 56 : 96]} />
        <meshStandardMaterial
          color="#e9deee"
          roughness={0.82}
          metalness={0.01}
          transparent
          opacity={0.2}
        />
      </mesh>

      <PastelParticles compact={compact} />

      <group ref={wheelRef} scale={compact ? 0.78 : 1}>
        <GlassRing radius={radius} compact={compact} />

        {products.map((product, index) => {
          const angle = index * step;
          return (
            <group
              key={product.id}
              position={[
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
              ]}
            >
              <mesh position={[0, -0.28, 0]} castShadow={!compact}>
                <cylinderGeometry args={[0.028, 0.04, 0.7, compact ? 12 : 18]} />
                <meshStandardMaterial
                  color="#efceb7"
                  metalness={0.76}
                  roughness={0.18}
                />
              </mesh>
              <mesh position={[0, -0.5, 0]}>
                <sphereGeometry args={[0.105, compact ? 12 : 20, compact ? 12 : 20]} />
                {compact ? (
                  <meshStandardMaterial
                    color="#fff2fb"
                    roughness={0.18}
                    transparent
                    opacity={0.78}
                  />
                ) : (
                  <meshPhysicalMaterial
                    color="#fff2fb"
                    transmission={0.74}
                    thickness={0.55}
                    roughness={0.08}
                    transparent
                    opacity={0.82}
                  />
                )}
              </mesh>
              <group
                ref={(node) => {
                  plaqueRefs.current[index] = node;
                }}
                position={[0, 0.65, 0]}
                scale={0.72}
              >
                <ProductPlaque
                  product={product}
                  imageUrl={imageUrls[index]}
                  selected={index === activeIndex}
                  compact={compact}
                  onSelect={() => onSelect(index)}
                />
              </group>
            </group>
          );
        })}
      </group>
    </>
  );
}

function DomWheelFallback({
  product,
  imageUrl,
  reducedMotion,
}: {
  product: FeaturedProduct;
  imageUrl: string;
  reducedMotion: boolean;
}) {
  return (
    <div
      className="featured-wheel__fallback"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <div
        className="featured-wheel__fallback-orbit"
        aria-hidden="true"
      />
      <figure className="featured-wheel__fallback-plaque">
        {/* A normal image keeps the product available when WebGL is unavailable. */}
        <img
          className="featured-wheel__fallback-image"
          src={imageUrl}
          alt={product.alt ?? product.name}
        />
      </figure>
    </div>
  );
}

function ProductDetails({
  product,
  compactViewport,
}: {
  product: FeaturedProduct;
  compactViewport: boolean;
}) {
  return (
    <div className="featured-wheel__details">
      <div className="featured-wheel__meta">
        {product.badge ? (
          <span className="featured-wheel__badge">{product.badge}</span>
        ) : null}
        {product.category ? (
          <p className="featured-wheel__category">{product.category}</p>
        ) : null}
      </div>

      <h3 className="featured-wheel__title">
        {product.shortName ?? product.name}
      </h3>

      {product.shortName ? (
        <p className="featured-wheel__full-name">{product.name}</p>
      ) : null}

      {product.story ?? product.description ? (
        <p className="featured-wheel__description">
          {product.story ?? product.description}
        </p>
      ) : null}

      {product.palette ? (
        <p className="featured-wheel__palette">{product.palette}</p>
      ) : null}

      {product.materials?.length ? (
        <p className="featured-wheel__materials">
          <span>Materials</span> {product.materials.join(" · ")}
        </p>
      ) : null}

      {product.details?.length ? (
        <ul className="featured-wheel__detail-list">
          {product.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}

      {product.facts?.length ? (
        <dl className="featured-wheel__facts">
          {product.facts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="featured-wheel__commerce">
        {product.price ? (
          <p className="featured-wheel__price">{product.price}</p>
        ) : null}
        {product.availability ? (
          <p className="featured-wheel__availability">
            {product.availability}
          </p>
        ) : null}
      </div>

      {product.href ? (
        <a className="featured-wheel__cta" href={product.href}>
          {product.ctaLabel ?? "Ask about this piece"}
        </a>
      ) : null}

      {product.sourceUrl ? (
        <a
          className="featured-wheel__source"
          href={product.sourceUrl}
          target="_blank"
          rel="noreferrer"
          tabIndex={compactViewport ? -1 : undefined}
        >
          View original Instagram post
        </a>
      ) : null}
    </div>
  );
}

function AccessibleProductCatalogue({
  products,
}: {
  products: readonly FeaturedProduct[];
}) {
  return (
    <ol style={visuallyHidden} aria-label="All products in this featured wheel">
      {products.map((product) => (
        <li key={product.id}>
          <h3>{product.name}</h3>
          <p>Model reference: {product.id}</p>
          <p>Image description: {product.alt ?? product.name}</p>
          {product.shortName ? <p>Display name: {product.shortName}</p> : null}
          {product.category ? <p>Category: {product.category}</p> : null}
          {product.story ? <p>{product.story}</p> : null}
          {product.description && product.description !== product.story ? (
            <p>{product.description}</p>
          ) : null}
          {product.palette ? <p>Palette: {product.palette}</p> : null}
          {product.badge ? <p>Label: {product.badge}</p> : null}
          {product.price ? <p>Price: {product.price}</p> : null}
          {product.availability ? (
            <p>Availability: {product.availability}</p>
          ) : null}
          {product.materials?.length ? (
            <p>Materials: {product.materials.join(", ")}</p>
          ) : null}
          {product.details?.length ? (
            <ul>
              {product.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
          {product.facts?.length ? (
            <dl>
              {product.facts.map((fact) => (
                <div key={`${fact.label}-${fact.value}`}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {product.href ? <span>{product.ctaLabel}</span> : null}
          {product.sourceUrl ? (
            <span>Original Instagram post</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function FeaturedWheel({
  products,
  reducedMotion,
  className,
  assetBasePath,
  initialIndex = 0,
  ariaLabel = "Featured jewellery carousel",
  onChange,
}: FeaturedWheelProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wheelProducts = useMemo(
    () => products.slice(0, MAX_WHEEL_PRODUCTS),
    [products],
  );
  const [activeIndex, setActiveIndex] = useState(() =>
    normalizeIndex(initialIndex, wheelProducts.length),
  );
  const [dragging, setDragging] = useState(false);
  const [wheelInView, setWheelInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );
  const [compactViewport, setCompactViewport] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(COMPACT_VIEWPORT_QUERY).matches,
  );
  const [statusMessage, setStatusMessage] = useState("");
  const drag = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    horizontal: false,
  });
  const motion = useRef<WheelMotion>({
    angle: FRONT_ANGLE - normalizeIndex(initialIndex, wheelProducts.length) *
      (TWO_PI / Math.max(1, wheelProducts.length)),
    velocity: 0,
    targetAngle: null,
    dragging: false,
    paused: false,
    resumeAt: 0,
  });
  const glOptions = useMemo(
    () => ({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance" as const,
      preserveDrawingBuffer: false,
    }),
    [],
  );
  const safeActiveIndex = normalizeIndex(activeIndex, wheelProducts.length);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_VIEWPORT_QUERY);
    const updateCompactViewport = () => setCompactViewport(media.matches);
    updateCompactViewport();
    media.addEventListener("change", updateCompactViewport);
    return () => media.removeEventListener("change", updateCompactViewport);
  }, []);

  useEffect(() => {
    const updatePageVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", updatePageVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updatePageVisibility);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setWheelInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "18% 0px", threshold: 0.01 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const updateFrontProduct = useCallback(
    (index: number) => {
      if (!wheelProducts.length) return;
      const nextIndex = normalizeIndex(index, wheelProducts.length);
      setActiveIndex((current) => {
        if (current === nextIndex) return current;
        onChange?.(wheelProducts[nextIndex], nextIndex);
        return nextIndex;
      });
    },
    [onChange, wheelProducts],
  );

  const select = useCallback(
    (index: number) => {
      if (!wheelProducts.length) return;
      const nextIndex = normalizeIndex(index, wheelProducts.length);
      const step = TWO_PI / wheelProducts.length;
      const desired = FRONT_ANGLE - nextIndex * step;
      const closestTurn = Math.round((motion.current.angle - desired) / TWO_PI);
      motion.current.targetAngle = desired + closestTurn * TWO_PI;
      motion.current.velocity = 0;
      motion.current.resumeAt = performance.now() + AUTO_RESUME_DELAY_MS;
      updateFrontProduct(nextIndex);
      setStatusMessage(
        `Showing ${wheelProducts[nextIndex].name}, ${nextIndex + 1} of ${wheelProducts.length}.`,
      );
    },
    [updateFrontProduct, wheelProducts],
  );

  const previous = useCallback(
    () => select(safeActiveIndex - 1),
    [safeActiveIndex, select],
  );
  const next = useCallback(
    () => select(safeActiveIndex + 1),
    [safeActiveIndex, select],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
    },
    [next, previous],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, a")) return;
      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastTime: performance.now(),
        horizontal: false,
      };
      motion.current.dragging = true;
      motion.current.targetAngle = null;
      motion.current.velocity = 0;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (drag.current.pointerId !== event.pointerId) return;

      const totalX = event.clientX - drag.current.startX;
      const totalY = event.clientY - drag.current.startY;
      if (!drag.current.horizontal) {
        if (Math.abs(totalX) < 5) return;
        if (Math.abs(totalY) > Math.abs(totalX)) return;
        drag.current.horizontal = true;
      }

      const now = performance.now();
      const deltaX = event.clientX - drag.current.lastX;
      const seconds = Math.max((now - drag.current.lastTime) / 1000, 1 / 120);
      const angleDelta = deltaX * DRAG_RADIANS_PER_PIXEL;
      motion.current.angle += angleDelta;
      motion.current.velocity = MathUtils.clamp(angleDelta / seconds, -2.7, 2.7);
      drag.current.lastX = event.clientX;
      drag.current.lastTime = now;
    },
    [],
  );

  const finishPointerGesture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (drag.current.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const wasHorizontalDrag = drag.current.horizontal;
      drag.current.pointerId = -1;
      motion.current.dragging = false;
      if (wasHorizontalDrag) motion.current.targetAngle = null;
      motion.current.resumeAt = performance.now() + AUTO_RESUME_DELAY_MS;
      setDragging(false);
      if (wasHorizontalDrag) {
        setStatusMessage(
          `Showing ${wheelProducts[safeActiveIndex].name}, ${safeActiveIndex + 1} of ${wheelProducts.length}.`,
        );
      }
    },
    [safeActiveIndex, wheelProducts],
  );

  const pauseForFocus = useCallback(() => {
    motion.current.paused = true;
  }, []);

  const resumeAfterFocus = useCallback(
    (event: ReactFocusEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      motion.current.paused = false;
      motion.current.resumeAt = performance.now() + AUTO_RESUME_DELAY_MS;
    },
    [],
  );

  const pauseForMouse = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") motion.current.paused = true;
    },
    [],
  );

  const resumeAfterMouse = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;
      motion.current.paused = false;
      motion.current.resumeAt = performance.now() + AUTO_RESUME_DELAY_MS;
    },
    [],
  );

  if (!wheelProducts.length) {
    return (
      <section
        className={["featured-wheel", "featured-wheel--empty", className]
          .filter(Boolean)
          .join(" ")}
        aria-label={ariaLabel}
      >
        <p className="featured-wheel__empty-message">
          The featured jewellery edit is being curated.
        </p>
      </section>
    );
  }

  const selected = wheelProducts[safeActiveIndex];
  const imageUrls = wheelProducts.map((product) =>
    resolveFeaturedAssetPath(product.image, assetBasePath),
  );

  return (
    <section
      ref={sectionRef}
      id="featured-wheel"
      data-compact={compactViewport ? "true" : "false"}
      className={[
        "featured-wheel",
        dragging ? "featured-wheel--dragging" : "",
        reducedMotion ? "featured-wheel--reduced-motion" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      onFocusCapture={pauseForFocus}
      onBlurCapture={resumeAfterFocus}
      onPointerEnter={pauseForMouse}
      onPointerLeave={resumeAfterMouse}
    >
      <div
        className="featured-wheel__room"
        style={{
          backgroundImage: `url(${resolveFeaturedAssetPath(
            "gem/environment/boutique-interior.webp",
            assetBasePath,
          )})`,
        }}
        aria-hidden="true"
      />

      <div
        className="featured-wheel__stage"
        role="slider"
        tabIndex={0}
        aria-label="Turn the featured jewellery wheel"
        aria-valuemin={1}
        aria-valuemax={wheelProducts.length}
        aria-valuenow={safeActiveIndex + 1}
        aria-valuetext={selected.name}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointerGesture}
        onPointerCancel={finishPointerGesture}
      >
        {reducedMotion ? (
          <DomWheelFallback
            product={selected}
            imageUrl={imageUrls[safeActiveIndex]}
            reducedMotion
          />
        ) : (
          <Canvas
            className="featured-wheel__canvas"
            aria-hidden="true"
            tabIndex={-1}
            camera={{ position: [0, 3.45, 8.7], fov: 40, near: 0.1, far: 40 }}
            dpr={compactViewport ? [1, 1.2] : [1, 1.4]}
            frameloop={wheelInView && pageVisible ? "always" : "demand"}
            gl={glOptions}
            shadows={compactViewport ? false : "basic"}
            fallback={
              <DomWheelFallback
                product={selected}
                imageUrl={imageUrls[safeActiveIndex]}
                reducedMotion={false}
              />
            }
          >
            <WheelScene
              products={wheelProducts}
              imageUrls={imageUrls}
              activeIndex={safeActiveIndex}
              motion={motion}
              onFrontChange={updateFrontProduct}
              onSelect={select}
            />
          </Canvas>
        )}
      </div>

      <div className="featured-wheel__content">
        <div className="featured-wheel__heading">
          <p>Owner’s spotlight · prototype edit</p>
          <h2>A wheel of little wonders.</h2>
        </div>
        <ProductDetails
          product={selected}
          compactViewport={compactViewport}
        />

        <div className="featured-wheel__controls" aria-label="Choose a product">
          <button
            className="featured-wheel__button featured-wheel__button--previous"
            type="button"
            onClick={previous}
            onKeyDown={onKeyDown}
            disabled={wheelProducts.length < 2}
            aria-label="Show previous featured product"
          >
            <span aria-hidden="true">←</span>
          </button>

          <p className="featured-wheel__counter">
            <span>{String(safeActiveIndex + 1).padStart(2, "0")}</span>
            <span aria-hidden="true"> / </span>
            <span className="featured-wheel__counter-total">
              {String(wheelProducts.length).padStart(2, "0")}
            </span>
          </p>

          <button
            className="featured-wheel__button featured-wheel__button--next"
            type="button"
            onClick={next}
            onKeyDown={onKeyDown}
            disabled={wheelProducts.length < 2}
            aria-label="Show next featured product"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <p className="featured-wheel__gesture-hint">
        <span className="featured-wheel__gesture-copy--wide">
          Drag, swipe, or use the arrow keys to turn the wheel.
        </span>
        <span className="featured-wheel__gesture-copy--compact">
          Swipe the halo · tap the arrows
        </span>
      </p>

      <p style={visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      <AccessibleProductCatalogue products={wheelProducts} />
    </section>
  );
}

export default FeaturedWheel;
