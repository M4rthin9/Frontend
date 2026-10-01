import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** One easing for every entrance on the site: fast start, long settle. */
export const EASE_OUT = 'expo.out';

/** Breakpoints the scroll choreography switches on (match Tailwind's sm / lg). */
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  finePointer: '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
} as const;

export { gsap, ScrollTrigger };
