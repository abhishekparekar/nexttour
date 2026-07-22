// Premium Animation Variants - Ultra Smooth & Performant

// ==================== EASINGS ====================
export const easings = {
  premium: [0.22, 1, 0.36, 1],
  smooth: [0.4, 0, 0.2, 1],
  spring: { type: "spring", stiffness: 100, damping: 20 }
};

// ==================== VIEWPORT DEFAULTS ====================
export const viewportConfig = {
  once: true,
  margin: "-80px"
};

// ==================== HERO ANIMATIONS ====================
export const heroVariants = {
  container: {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
  },
  badge: {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, ease: easings.premium } }
  },
  heading: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: easings.premium } }
  },
  subtitle: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easings.premium, delay: 0.1 } }
  },
  stats: {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: easings.premium } }
  }
};

// ==================== CATEGORY ANIMATIONS ====================
export const categoryVariants = {
  container: {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  },
  header: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easings.premium } }
  },
  card: (index) => ({
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easings.premium } }
  })
};

// ==================== CARD ANIMATIONS ====================
export const cardVariants = {
  container: {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  },
  card: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easings.premium } }
  }
};

// ==================== IMAGE ANIMATIONS ====================
export const imageVariants = {
  container: {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  },
  image: {
    hidden: { opacity: 0, scale: 1.05 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: easings.smooth } }
  }
};

// ==================== FEATURE ANIMATIONS ====================
export const featureVariants = {
  container: {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  },
  header: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easings.premium } }
  },
  feature: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easings.premium } }
  }
};

// ==================== TESTIMONIAL ANIMATIONS ====================
export const testimonialVariants = {
  container: {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  },
  card: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easings.premium } }
  }
};

// ==================== CTA ANIMATIONS ====================
export const ctaVariants = {
  container: {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  },
  badge: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easings.premium } }
  },
  content: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easings.premium } }
  },
  buttons: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easings.premium } }
  }
};

// ==================== FOOTER ANIMATIONS ====================
export const footerVariants = {
  container: {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  },
  column: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easings.premium } }
  }
};

// ==================== TEXT ANIMATIONS ====================
export const textRevealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.03, ease: easings.premium }
  })
};

export const gradientShimmerVariants = {
  animate: {
    backgroundPosition: ["200% center", "-200% center"],
    transition: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "linear" }
  }
};

// ==================== CARD HOVER EFFECTS ====================
export const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -6, transition: { duration: 0.3, ease: easings.premium } }
};

// ==================== BUTTON ANIMATIONS ====================
export const buttonHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.03 },
  tap: { scale: 0.97 }
};

export const iconHoverVariants = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: 5, scale: 1.1 },
  tap: { scale: 0.95 }
};

// ==================== SCROLL PROGRESS ====================
export const scrollProgressVariants = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1, transition: { ease: "linear" } }
};

// ==================== LUXURY CONTAINER ====================
export const luxuryContainerVariants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

// ==================== REUSABLE VARIANTS ====================
export const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easings.premium } }
};

export const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: easings.premium } }
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easings.premium } }
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easings.premium } }
};

export const zoomBlurIn = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: easings.smooth } }
};

export const clipReveal = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: { clipPath: "inset(0 0% 0 0)", transition: { duration: 0.8, ease: easings.premium } }
};

export const lightSweepVariants = {
  initial: { x: "-100%", opacity: 0 },
  animate: { x: "200%", opacity: [0, 0.3, 0], transition: { duration: 0.8, repeat: Infinity, repeatDelay: 3 } }
};
