import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initPortfolioMotion() {
  const media = gsap.matchMedia();

  media.add(
    {
      reduceMotion: "(prefers-reduced-motion: reduce)",
      fineDesktop: "(min-width: 900px) and (pointer: fine)",
    },
    ({ conditions }) => {
      if (conditions?.reduceMotion) return;

      const groups = document.querySelectorAll<HTMLElement>("[data-motion-stagger]");
      groups.forEach((group) => {
        const cards = Array.from(group.querySelectorAll<HTMLElement>(":scope > [data-motion-card]"));
        if (!cards.length) return;

        gsap.set(cards, { y: 12 });
        ScrollTrigger.batch(cards, {
          start: "top 90%",
          once: true,
          interval: 0.08,
          batchMax: 3,
          onEnter: (batch) => gsap.to(batch, {
            y: 0,
            duration: 0.55,
            stagger: 0.055,
            ease: "expo.out",
            overwrite: true,
          }),
        });
      });

      const timeline = document.querySelector<HTMLElement>("[data-scroll-progress]");
      const progressLine = timeline?.querySelector<HTMLElement>(".timeline-progress");
      if (timeline && progressLine) {
        gsap.to(progressLine, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: timeline,
            start: "top 76%",
            end: "bottom 70%",
            scrub: true,
          },
        });
      }

      if (!conditions?.fineDesktop) return;

      const lenis = new Lenis({
        anchors: true,
        autoRaf: false,
        lerp: 0.11,
        smoothWheel: true,
        syncTouch: false,
      });
      const updateScroll = () => ScrollTrigger.update();
      const tick = (time: number) => lenis.raf(time * 1000);
      lenis.on("scroll", updateScroll);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const hero = document.querySelector<HTMLElement>(".hero");
      const diagram = hero?.querySelector<HTMLElement>(".hero-visual");
      if (hero && diagram) {
        const orbitChips = gsap.utils.toArray<HTMLElement>(".orbit-chip", diagram);
        gsap.from(orbitChips, {
          y: 8,
          autoAlpha: 0.72,
          duration: 0.68,
          delay: 0.12,
          stagger: 0.085,
          ease: "expo.out",
          clearProps: "opacity,transform",
        });
        const scrollRange = { trigger: hero, start: "top top", end: "bottom top", scrub: 0.65 };
        gsap.to(diagram, { yPercent: -4, ease: "none", scrollTrigger: scrollRange });
        orbitChips.forEach((chip, index) => {
          gsap.to(chip, {
            y: index % 2 === 0 ? -9 : 9,
            ease: "none",
            scrollTrigger: scrollRange,
          });
        });
      }

      ScrollTrigger.refresh();
      return () => {
        lenis.destroy();
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
      };
    },
  );

  return () => media.revert();
}
