import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DoorExperience } from "./components/DoorExperience";
import { SecretJewelCase } from "./components/SecretJewelCase";
import { featuredProducts } from "./data/products";
import { cabinetProducts } from "./data/cabinetProducts";

const FeaturedWheel = lazy(() => import("./components/FeaturedWheel"));

const INSTAGRAM_URL = "https://www.instagram.com/gem__accessories_/";

export function App() {
  const wheelShellRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [motionWasChosen, setMotionWasChosen] = useState(false);
  const [wheelShouldLoad, setWheelShouldLoad] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      if (!motionWasChosen) setReducedMotion(media.matches);
    };

    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, [motionWasChosen]);

  useEffect(() => {
    // Only warm the first portrait during the entrance. The remaining images
    // wait until the WebGL chapter is close enough to be useful.
    const productsToWarm = wheelShouldLoad
      ? featuredProducts
      : featuredProducts.slice(0, 1);

    productsToWarm.forEach((product, index) => {
      const image = new window.Image();
      image.decoding = "async";
      image.fetchPriority = index === 0 ? "high" : "auto";
      image.src = product.image;
    });
  }, [wheelShouldLoad]);

  useEffect(() => {
    const shell = wheelShellRef.current;
    if (!shell || wheelShouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setWheelShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "140% 0px", threshold: 0.01 },
    );

    observer.observe(shell);
    return () => observer.disconnect();
  }, [wheelShouldLoad]);

  const toggleMotion = () => {
    setMotionWasChosen(true);
    setReducedMotion((current) => !current);
  };

  return (
    <div className={reducedMotion ? "site motion-is-reduced" : "site"}>
      <a className="skip-link" href="#featured-wheel">
        Skip to the featured pieces
      </a>

      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="Gem Accessories home">
          <span className="brand-mark__gem" aria-hidden="true">G</span>
          <span>
            <strong>Gem</strong>
            <small>Accessories · Sfax</small>
          </span>
        </a>

        <nav className="site-header__actions" aria-label="Experience controls">
          <button
            className="motion-toggle"
            type="button"
            onClick={toggleMotion}
            aria-pressed={reducedMotion}
          >
            <span aria-hidden="true">{reducedMotion ? "○" : "✦"}</span>
            {reducedMotion ? "Motion off" : "Motion on"}
          </button>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            Instagram <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="top">
        <DoorExperience reducedMotion={reducedMotion} />

        {wheelShouldLoad ? (
          <Suspense
            fallback={
              <section id="featured-wheel" className="wheel-loader" aria-label="Loading featured pieces">
                <span aria-hidden="true" />
                <p>Polishing the glass wheel…</p>
              </section>
            }
          >
            <FeaturedWheel
              products={featuredProducts}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        ) : (
          <section
            ref={wheelShellRef}
            id="featured-wheel"
            className="wheel-loader wheel-loader--waiting"
            aria-label="Featured jewellery wheel"
          >
            <span aria-hidden="true" />
            <p>The glass halo is waiting.</p>
          </section>
        )}

        <SecretJewelCase
          products={cabinetProducts}
          reducedMotion={reducedMotion}
        />

        <section className="prototype-note" aria-label="Prototype status">
          <p className="eyebrow">First concept · owner review pending</p>
          <p>
            The eight featured pieces are a prototype edit from the public
            Instagram archive. Final names, prices, materials and bestseller
            order will come from the owner.
          </p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            Meet Gem on Instagram <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <footer className="site-footer">
        <span>Made with light in Sfax</span>
        <strong>Gem Accessories</strong>
        <span>Concept 01 · 2026</span>
      </footer>
    </div>
  );
}
