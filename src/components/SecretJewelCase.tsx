import { useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { CabinetProduct } from "../data/cabinetProducts";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type SecretJewelCaseProps = {
  products: readonly CabinetProduct[];
  reducedMotion: boolean;
};

const drawerColors = ["#f7c8d7", "#d9d3f8", "#cfe9ef", "#f8deb3", "#ecc9de"];

export function SecretJewelCase({
  products,
  reducedMotion,
}: SecretJewelCaseProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeChapter, setActiveChapter] = useState<number | "finale" | null>(
    null,
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const stage = root.querySelector<HTMLElement>(".jewel-case__stage");
      const intro = root.querySelector<HTMLElement>(".jewel-case__intro");
      const cabinet = root.querySelector<HTMLElement>(".jewel-case__cabinet");
      const finale = root.querySelector<HTMLElement>(".jewel-case__finale");
      const ambient = root.querySelector<HTMLElement>(".jewel-case__ambient");
      const drawers = gsap.utils.toArray<HTMLElement>(".jewel-case__drawer", root);
      const cameos = gsap.utils.toArray<HTMLElement>(".jewel-case__cameo", root);
      const labels = gsap.utils.toArray<HTMLElement>(".jewel-case__product-copy", root);

      if (!stage || !intro || !cabinet || !finale || !ambient || drawers.length === 0) {
        return;
      }

      if (reducedMotion) {
        setActiveChapter(null);
        gsap.set([intro, cabinet, finale, drawers, cameos, labels], {
          clearProps: "all",
          autoAlpha: 1,
        });
        return;
      }

      const compactJourney = window.matchMedia(
        "(max-width: 760px), (pointer: coarse) and (max-height: 700px)",
      ).matches;
      const shortViewport = window.matchMedia("(max-height: 640px)").matches;
      const finalePositions = compactJourney
        ? [
            { x: "-26vw", y: "-19vh", scale: 0.34, rotation: -10 },
            { x: "-17vw", y: "15vh", scale: 0.31, rotation: 7 },
            { x: "0vw", y: "-22vh", scale: 0.39, rotation: 0 },
            { x: "17vw", y: "15vh", scale: 0.31, rotation: -7 },
            { x: "26vw", y: "-19vh", scale: 0.34, rotation: 10 },
          ].map((position) => ({
            ...position,
            scale: position.scale * (shortViewport ? 0.92 : 1),
          }))
        : [
            { x: "-36vw", y: "-19vh", scale: 0.5, rotation: -12 },
            { x: "-20vw", y: "18vh", scale: 0.45, rotation: 8 },
            { x: "0vw", y: "-23vh", scale: 0.58, rotation: -2 },
            { x: "20vw", y: "18vh", scale: 0.45, rotation: -8 },
            { x: "36vw", y: "-18vh", scale: 0.5, rotation: 12 },
          ];

      gsap.set(cabinet, { rotateX: 7, rotateY: -10, scale: 0.88, y: 40 });
      gsap.set(drawers, { z: 0, y: 0 });
      gsap.set(cameos, { autoAlpha: 0, y: 120, rotateZ: -7, scale: 0.72 });
      gsap.set(labels, { autoAlpha: 0, y: 24 });
      gsap.set(finale, { autoAlpha: 0 });

      const journey = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () =>
            `+=${window.innerHeight * (compactJourney ? 5.2 : 6.5)}`,
          pin: stage,
          pinSpacing: false,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;
            let nextChapter: number | "finale" | null = null;

            if (progress >= 0.84) {
              nextChapter = "finale";
            } else if (progress >= 0.14) {
              nextChapter = Math.min(
                products.length - 1,
                Math.floor((progress - 0.14) / 0.135),
              );
            }

            setActiveChapter((current) =>
              current === nextChapter ? current : nextChapter,
            );
          },
        },
      });

      journey
        .to(intro, { autoAlpha: 0, y: -36, duration: 0.12 }, 0.04)
        .to(cabinet, { rotateX: 2, rotateY: 0, scale: 1, y: 0, duration: 0.15 }, 0.04);

      products.forEach((_, index) => {
        const at = 0.14 + index * 0.135;
        const previousCameo = cameos[index - 1];
        const previousLabel = labels[index - 1];
        const drawer = drawers[index];
        const cameo = cameos[index];
        const label = labels[index];

        if (previousCameo && previousLabel) {
          journey
            .to(previousCameo, { autoAlpha: 0.2, scale: 0.58, y: -80, duration: 0.06 }, at)
            .to(previousLabel, { autoAlpha: 0, y: -16, duration: 0.04 }, at);
        }

        journey
          .to(drawer, { z: 145, y: 12, duration: 0.07 }, at)
          .to(
            cameo,
            {
              autoAlpha: 1,
              y: -34,
              rotateZ: index % 2 === 0 ? -2 : 2,
              scale: 1,
              duration: 0.085,
              ease: "power2.out",
            },
            at + 0.025,
          )
          .to(label, { autoAlpha: 1, y: 0, duration: 0.055 }, at + 0.055)
          .to(
            ambient,
            { xPercent: (index - 2) * 9, rotate: index % 2 ? 6 : -5, duration: 0.11 },
            at,
          )
          .to(drawer, { z: 14, y: 0, duration: 0.05 }, at + 0.085);
      });

      journey
        .to([cabinet, ...labels], { autoAlpha: 0, scale: 0.84, duration: 0.08 }, 0.82)
        .to(
          cameos,
          {
            left: compactJourney ? "25%" : "50%",
            top: "50%",
            duration: 0.001,
          },
          0.835,
        )
        .to(
          cameos,
          {
            autoAlpha: 1,
            x: (index) => finalePositions[index]?.x ?? 0,
            y: (index) => finalePositions[index]?.y ?? 0,
            scale: (index) => finalePositions[index]?.scale ?? 0.5,
            rotateZ: (index) => finalePositions[index]?.rotation ?? 0,
            duration: 0.1,
          },
          0.84,
        )
        .to(finale, { autoAlpha: 1, duration: 0.08 }, 0.87);

      return () => setActiveChapter(null);
    },
    { scope: rootRef, dependencies: [products, reducedMotion], revertOnUpdate: true },
  );

  return (
    <section
      ref={rootRef}
      className={`jewel-case${reducedMotion ? " jewel-case--reduced" : ""}`}
      aria-labelledby="jewel-case-title"
      data-active-chapter={activeChapter ?? "intro"}
    >
      <div className="jewel-case__stage">
        <div
          className="jewel-case__ambient"
          aria-hidden="true"
          inert={reducedMotion ? true : undefined}
        >
          <span className="jewel-case__orb jewel-case__orb--one" />
          <span className="jewel-case__orb jewel-case__orb--two" />
          <span className="jewel-case__orbit jewel-case__orbit--one" />
          <span className="jewel-case__orbit jewel-case__orbit--two" />
          {Array.from({ length: 14 }, (_, index) => (
            <span
              className="jewel-case__spark"
              style={{ "--spark-index": index } as CSSProperties}
              key={index}
            />
          ))}
        </div>

        <header className="jewel-case__intro">
          <p className="eyebrow">Beyond the glass wheel · five more pieces</p>
          <h2 id="jewel-case-title">
            Open the <em>secret</em> jewel case.
          </h2>
          <p>Five drawers. Five little worlds. Keep scrolling to open them.</p>
        </header>

        <div className="jewel-case__cabinet" aria-hidden="true">
          <div className="jewel-case__cabinet-top">
            <span>G</span>
            <small>Gem’s private edit</small>
          </div>
          <div className="jewel-case__drawer-stack">
            {products.map((product, index) => (
              <div
                className="jewel-case__drawer"
                style={{ "--drawer-color": drawerColors[index] } as CSSProperties}
                key={product.id}
              >
                <span className="jewel-case__drawer-number">0{index + 1}</span>
                <span className="jewel-case__drawer-line" />
                <span className="jewel-case__drawer-handle" />
                <span className="jewel-case__drawer-name">{product.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="jewel-case__products">
          {products.map((product, index) => (
            <div
              className="jewel-case__product"
              style={{ "--product-index": index } as CSSProperties}
              key={product.id}
            >
              <a
                className={`jewel-case__cameo${
                  activeChapter === index || activeChapter === "finale"
                    ? " jewel-case__cameo--interactive"
                    : ""
                }`}
                href={product.sourceUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`View ${product.name} on Instagram`}
                aria-hidden={
                  !reducedMotion &&
                  activeChapter !== index &&
                  activeChapter !== "finale"
                }
                tabIndex={
                  !reducedMotion &&
                  (activeChapter === index || activeChapter === "finale")
                    ? 0
                    : -1
                }
                inert={reducedMotion ? true : undefined}
              >
                <span className="jewel-case__cameo-glow" aria-hidden="true" />
                <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                <span className="jewel-case__cameo-index">0{index + 1}</span>
              </a>
              <div className="jewel-case__product-copy">
                <p>{product.category}</p>
                <h3>{product.name}</h3>
                <span>{product.story}</span>
                <small>{product.palette}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="jewel-case__finale">
          <p>Five more reasons to stay a little longer.</p>
          <strong>The secret edit</strong>
          <span>05 pieces · prototype collection</span>
        </div>

        <p className="jewel-case__scroll-note">Scroll to open the next drawer</p>

        <ol className="jewel-case__catalogue" aria-label="Five more prototype pieces">
          {products.map((product) => (
            <li key={`catalogue-${product.id}`}>
              <img src={product.image} alt="" loading="lazy" decoding="async" />
              <div>
                <p>{product.category}</p>
                <h3>{product.name}</h3>
                <span>{product.story}</span>
                <small>{product.palette}</small>
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={reducedMotion ? undefined : -1}
                >
                  View source post
                </a>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
