import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function splitWords(element: HTMLElement) {
  if (element.dataset.motionSplit === "true") return [];
  const text = element.textContent?.trim() ?? "";
  if (!text) return [];

  element.dataset.motionSplit = "true";
  const accessibleText = document.createElement("span");
  accessibleText.className = "sr-only motion-accessible-text";
  accessibleText.textContent = text;
  const words = text.split(/\s+/).map((word) => {
    const span = document.createElement("span");
    span.className = "motion-word";
    span.setAttribute("aria-hidden", "true");
    span.textContent = word;
    return span;
  });
  element.replaceChildren(accessibleText, ...words);
  return words;
}

export function initPortfolioMotion() {
  const media = gsap.matchMedia();

  media.add(
    {
      reduceMotion: "(prefers-reduced-motion: reduce)",
      motionAllowed: "(prefers-reduced-motion: no-preference)",
      fineDesktop: "(min-width: 900px) and (pointer: fine)",
    },
    ({ conditions }) => {
      if (conditions?.reduceMotion || !conditions?.motionAllowed) return;

      const introHeaders = gsap.utils.toArray<HTMLElement>(".hero h1, .page-intro h1, .case-hero h1");
      introHeaders.forEach((heading) => {
        const words = splitWords(heading);
        if (!words.length) return;
        gsap.from(words, {
          yPercent: 112,
          rotateX: -28,
          autoAlpha: 0,
          duration: 1.15,
          stagger: 0.085,
          delay: 0.08,
          ease: "power4.out",
          clearProps: "all",
        });
      });

      const introCopy = gsap.utils.toArray<HTMLElement>(".hero > div:first-child > .hero-copy, .page-intro > p:not(.eyebrow), .case-lede");
      introCopy.forEach((copy) => {
        gsap.from(copy, { y: 24, autoAlpha: 0, duration: 0.72, delay: 0.24, ease: "power3.out", clearProps: "all" });
      });

      const groups = document.querySelectorAll<HTMLElement>("[data-motion-stagger]");
      groups.forEach((group) => {
        const cards = Array.from(group.querySelectorAll<HTMLElement>(":scope > [data-motion-card]"));
        if (!cards.length) return;

        cards.forEach((card) => {
          const image = card.querySelector<HTMLElement>(".device-frame img, .concept-cover img, .resource-card > img");
          if (!image) return;
          gsap.set(image, { clipPath: "inset(0 100% 0 0 round 8px)", scale: 1.08, transformOrigin: "center center" });
          gsap.to(image, {
            clipPath: "inset(0 0 0 0 round 8px)",
            scale: 1,
            duration: 1.25,
            ease: "power3.inOut",
            scrollTrigger: { trigger: card, start: "top 86%", once: true },
          });
        });

        ScrollTrigger.batch(cards, {
          start: "top 88%",
          once: true,
          interval: 0.1,
          batchMax: 3,
          onEnter: (batch) => gsap.fromTo(batch,
            { y: 54, autoAlpha: 0, rotateX: 3, transformOrigin: "50% 100%" },
            { y: 0, autoAlpha: 1, rotateX: 0, duration: 1.05, stagger: 0.16, ease: "power3.out", overwrite: true, clearProps: "transform,opacity,visibility" },
          ),
        });
      });

      const timeline = document.querySelector<HTMLElement>("[data-scroll-progress]");
      const progressLine = timeline?.querySelector<HTMLElement>(".timeline-progress");
      if (timeline && progressLine) {
        gsap.to(progressLine, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: timeline, start: "top 76%", end: "bottom 70%", scrub: 0.7 },
        });
      }

      const hero = document.querySelector<HTMLElement>(".hero");
      const diagram = hero?.querySelector<HTMLElement>(".hero-visual");
      if (diagram) {
        const orbitChips = gsap.utils.toArray<HTMLElement>(".orbit-chip", diagram);
        gsap.from(orbitChips, {
          y: 24,
          scale: 0.92,
          autoAlpha: 0,
          duration: 0.95,
          delay: 0.4,
          stagger: 0.13,
          ease: "back.out(1.35)",
          clearProps: "all",
        });
      }

      const fineDesktop = Boolean(conditions?.fineDesktop);
      let lenis: Lenis | undefined;
      let tick: ((time: number) => void) | undefined;
      if (fineDesktop) {
        lenis = new Lenis({ anchors: true, autoRaf: false, lerp: 0.085, smoothWheel: true, syncTouch: false });
        const updateScroll = () => ScrollTrigger.update();
        tick = (time) => lenis?.raf(time * 1000);
        lenis.on("scroll", updateScroll);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        if (hero && diagram) {
          const orbitChips = gsap.utils.toArray<HTMLElement>(".orbit-chip", diagram);
          const scrollRange = { trigger: hero, start: "top top", end: "bottom top", scrub: 0.75 };
          gsap.to(diagram, { yPercent: -9, scale: 0.96, ease: "none", scrollTrigger: scrollRange });
          orbitChips.forEach((chip, index) => {
            gsap.to(chip, { y: index % 2 === 0 ? -22 : 22, ease: "none", scrollTrigger: scrollRange });
          });
        }
      }

      ScrollTrigger.refresh();
      return () => {
        lenis?.destroy();
        if (tick) gsap.ticker.remove(tick);
        if (fineDesktop) gsap.ticker.lagSmoothing(500, 33);
        document.querySelectorAll<HTMLElement>("[data-motion-split='true']").forEach((heading) => {
          const label = heading.querySelector(".motion-accessible-text")?.textContent ?? heading.textContent ?? "";
          heading.removeAttribute("data-motion-split");
          heading.textContent = label;
        });
      };
    },
  );

  return () => media.revert();
}
