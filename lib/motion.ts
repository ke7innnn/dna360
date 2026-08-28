import { type Variants } from 'framer-motion'

/**
 * Aurora Glass motion system
 *
 * Easing: cubic-bezier(0.22, 1, 0.36, 1) for entrances
 * Durations: 150ms micro, 250ms panel, 400ms route
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const DURATIONS = {
  micro: 0.15,
  panel: 0.25,
  route: 0.4,
} as const

/**
 * Fade up 8px — primary entrance for page content
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.panel,
      ease: EASE_OUT as unknown as number[],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: DURATIONS.micro,
      ease: EASE_OUT as unknown as number[],
    },
  },
}

/**
 * Stagger container — staggers children by 25ms, caps at 10
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.03,
    },
  },
}

/**
 * Stagger item — used inside staggerContainer
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.panel,
      ease: EASE_OUT as unknown as number[],
    },
  },
}

/**
 * Scale fade — for modals and dialogs
 */
export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATIONS.panel,
      ease: EASE_OUT as unknown as number[],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: DURATIONS.micro,
      ease: EASE_OUT as unknown as number[],
    },
  },
}

/**
 * Slide from right — for drawers
 */
export const slideRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: DURATIONS.panel,
      ease: EASE_OUT as unknown as number[],
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: DURATIONS.panel,
      ease: EASE_OUT as unknown as number[],
    },
  },
}

/**
 * Card hover — lift 2px, brighten border
 */
export const cardHover = {
  rest: {
    y: 0,
    transition: { duration: DURATIONS.micro, ease: EASE_OUT as unknown as number[] },
  },
  hover: {
    y: -2,
    transition: { duration: DURATIONS.micro, ease: EASE_OUT as unknown as number[] },
  },
}

/**
 * Page transition wrapper
 */
export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATIONS.route,
      ease: EASE_OUT as unknown as number[],
      staggerChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATIONS.micro,
    },
  },
}
