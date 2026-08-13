"use client";

import { useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type AssetResolver = (path: string) => string;

export type DoorExperienceProps = {
  /** Resolve public assets when the site is hosted below a sub-path. */
  assetUrl?: AssetResolver;
  /** Disables the pinned journey and presents the boutique already open. */
  reducedMotion?: boolean;
  className?: string;
};

type DoorSide = "left" | "right";

function resolvePublicAsset(path: string) {
  const env = (import.meta as ImportMeta & {
    env?: { BASE_URL?: string };
  }).env;
  const base = env?.BASE_URL ?? "/";

  return `${base.replace(/\/?$/, "/")}${path.replace(/^\/+/, "")}`;
}

function DoorLeaf({ side }: { side: DoorSide }) {
  return (
    <div
      className={`door-experience__door door-experience__door--${side}`}
      data-door-side={side}
    >
      <div className="door-experience__door-edge" />
      <div className="door-experience__door-face">
        <div className="door-experience__door-glaze" />
        <div className="door-experience__door-crown">
          <span className="door-experience__crown-wing door-experience__crown-wing--outer" />
          <span className="door-experience__crown-gem" />
          <span className="door-experience__crown-wing door-experience__crown-wing--inner" />
        </div>

        <div className="door-experience__panel door-experience__panel--upper">
          <span className="door-experience__panel-inset" />
          <span className="door-experience__panel-flourish door-experience__panel-flourish--top" />
          <span className="door-experience__panel-medallion" />
          <span className="door-experience__panel-flourish door-experience__panel-flourish--bottom" />
        </div>

        <div className="door-experience__panel door-experience__panel--lower">
          <span className="door-experience__panel-inset" />
          <span className="door-experience__panel-diamond" />
        </div>

        <div className="door-experience__door-beading door-experience__door-beading--outer" />
        <div className="door-experience__door-beading door-experience__door-beading--inner" />
        <span className="door-experience__door-knob" />
      </div>
    </div>
  );
}

export function DoorExperience({
  assetUrl = resolvePublicAsset,
  reducedMotion = false,
  className = "",
}: DoorExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const boutiqueImage = assetUrl("gem/environment/boutique-interior.webp");

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const leftDoor = root.querySelector<HTMLElement>(
        ".door-experience__door--left",
      );
      const rightDoor = root.querySelector<HTMLElement>(
        ".door-experience__door--right",
      );
      const intro = root.querySelector<HTMLElement>(
        ".door-experience__intro",
      );
      const reveal = root.querySelector<HTMLElement>(
        ".door-experience__reveal",
      );
      const seam = root.querySelector<HTMLElement>(
        ".door-experience__light-seam",
      );
      const bloom = root.querySelector<HTMLElement>(
        ".door-experience__light-bloom",
      );
      const boutique = root.querySelector<HTMLElement>(
        ".door-experience__boutique",
      );
      const doorway = root.querySelector<HTMLElement>(
        ".door-experience__doorway",
      );
      const scrollCue = root.querySelector<HTMLElement>(
        ".door-experience__scroll-cue",
      );

      if (
        !leftDoor ||
        !rightDoor ||
        !intro ||
        !reveal ||
        !seam ||
        !bloom ||
        !boutique ||
        !doorway
      ) {
        return;
      }

      if (reducedMotion) {
        gsap.set(leftDoor, { rotateY: -108 });
        gsap.set(rightDoor, { rotateY: 108 });
        gsap.set([intro, seam, scrollCue], { autoAlpha: 0 });
        gsap.set(bloom, { autoAlpha: 0.22, scale: 1 });
        gsap.set(reveal, { autoAlpha: 1, y: 0 });
        gsap.set(boutique, { scale: 1, filter: "brightness(1) saturate(1)" });
        return;
      }

      gsap.set(leftDoor, {
        rotateY: 0,
        transformOrigin: "left center",
        force3D: true,
      });
      gsap.set(rightDoor, {
        rotateY: 0,
        transformOrigin: "right center",
        force3D: true,
      });
      gsap.set(intro, { autoAlpha: 1, y: 0 });
      gsap.set(reveal, { autoAlpha: 0, y: 46 });
      gsap.set(seam, { autoAlpha: 0.18, scaleY: 0.18 });
      gsap.set(bloom, { autoAlpha: 0, scale: 0.35 });
      gsap.set(boutique, {
        scale: 1.13,
        filter: "brightness(0.5) saturate(0.72)",
        force3D: true,
      });

      const journey = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => {
            const compactJourney = window.matchMedia(
              "(max-width: 760px), (pointer: coarse) and (max-height: 700px)",
            ).matches;
            return `+=${window.innerHeight * (compactJourney ? 2.7 : 3.4)}`;
          },
          pin: true,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      journey
        .to(intro, { autoAlpha: 0, y: -38, duration: 0.16 }, 0.08)
        .to(scrollCue, { autoAlpha: 0, y: 12, duration: 0.1 }, 0.08)
        .to(seam, { autoAlpha: 1, scaleY: 1, duration: 0.2 }, 0.14)
        .to(bloom, { autoAlpha: 0.92, scale: 1.35, duration: 0.25 }, 0.22)
        .to(
          doorway,
          { scale: 1.035, transformOrigin: "center center", duration: 0.48 },
          0.22,
        )
        .to(leftDoor, { rotateY: -112, duration: 0.48 }, 0.29)
        .to(rightDoor, { rotateY: 112, duration: 0.48 }, 0.29)
        .to(
          boutique,
          {
            scale: 1,
            filter: "brightness(1) saturate(1)",
            duration: 0.58,
          },
          0.28,
        )
        .to(bloom, { autoAlpha: 0.2, scale: 1.75, duration: 0.28 }, 0.54)
        .to(seam, { autoAlpha: 0, scaleX: 22, duration: 0.18 }, 0.56)
        .to(reveal, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.7);
    },
    { scope: rootRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  const skipEntrance = () => {
    const featuredWheel = document.querySelector<HTMLElement>("#featured-wheel");
    featuredWheel?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const rootStyle = (reducedMotion
    ? { minHeight: "100svh", height: "100svh" }
    : undefined) as CSSProperties | undefined;

  return (
    <section
      ref={rootRef}
      className={`door-experience ${className}`.trim()}
      style={rootStyle}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-labelledby={
        reducedMotion ? "door-reveal-title" : "door-experience-title"
      }
      aria-describedby="door-experience-description"
    >
      <button
        className="door-experience__skip"
        type="button"
        onClick={skipEntrance}
        aria-label="Skip the animated entrance and view featured jewelry"
      >
        Skip entrance
      </button>

      <div className="door-experience__stage">
        <div className="door-experience__boutique" aria-hidden="true">
          <img
            className="door-experience__boutique-image"
            src={boutiqueImage}
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority="high"
          />
          <div className="door-experience__boutique-haze" />
        </div>

        <div className="door-experience__reveal">
          <p className="door-experience__eyebrow">Welcome inside</p>
          {reducedMotion ? (
            <h1 id="door-reveal-title" className="door-experience__reveal-title">
              Jewels made to feel like you.
            </h1>
          ) : (
            <p id="door-reveal-title" className="door-experience__reveal-title">
              Jewels made to feel like you.
            </p>
          )}
          <p className="door-experience__reveal-copy">
            Meet the pieces selected to shine first.
          </p>
        </div>

        <div className="door-experience__doorway" aria-hidden="true">
          <div className="door-experience__frame door-experience__frame--outer" />
          <div className="door-experience__frame door-experience__frame--inner" />
          <div className="door-experience__frame-crown">
            <span className="door-experience__frame-crown-wing door-experience__frame-crown-wing--left" />
            <span className="door-experience__frame-crown-jewel" />
            <span className="door-experience__frame-crown-wing door-experience__frame-crown-wing--right" />
          </div>
          <DoorLeaf side="left" />
          <DoorLeaf side="right" />
          <div className="door-experience__light-seam" />
          <div className="door-experience__light-bloom" />
        </div>

        <div className="door-experience__intro">
          <p className="door-experience__eyebrow">A little light is waiting</p>
          {reducedMotion ? (
            <p id="door-experience-title" className="door-experience__title">
              Open the doors to Gem
            </p>
          ) : (
            <h1 id="door-experience-title" className="door-experience__title">
              Open the doors to Gem
            </h1>
          )}
          <p
            id="door-experience-description"
            className="door-experience__description"
          >
            Scroll slowly. Your jewelry story begins beyond the glow.
          </p>
        </div>

        <div className="door-experience__scroll-cue" aria-hidden="true">
          <span className="door-experience__scroll-label">Scroll to enter</span>
          <span className="door-experience__scroll-track">
            <span className="door-experience__scroll-dot" />
          </span>
        </div>
      </div>
    </section>
  );
}

export default DoorExperience;
