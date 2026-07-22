import { motion } from 'framer-motion';

// Fade in up animation
export const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
};

// Fade in animation
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

// Scale in animation
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

// Stagger container for multiple items
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Animation wrapper component
export const AnimationWrapper = ({ 
  children, 
  variant = fadeInUp, 
  className = '',
  viewport = { once: true, margin: "-100px" }
}) => {
  return (
    <motion.div
      initial={variant.initial}
      whileInView={variant.animate}
      viewport={viewport}
      transition={variant.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Section wrapper with default fadeInUp
export const Section = ({ children, className = '', id = '' }) => {
  return (
    <motion.section
      id={id}
      initial={{ y: 40 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

// Card animation wrapper
export const CardAnimation = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ y: 20, scale: 0.95 }}
      whileInView={{ y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Premium hover effect wrapper
export const PremiumCard = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        scale: 1.02,
        y: -8,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.1)'
      }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Text reveal animation
export const TextReveal = ({ text, className = '', delay = 0 }) => {
  const words = text.split(' ');
  
  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ y: 20, rotateX: -90 }}
          whileInView={{ y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 0.5, 
            delay: delay + index * 0.05,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

// Gradient text animation
export const GradientText = ({ text, className = '', gradientClass = 'bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600' }) => {
  return (
    <motion.span
      className={`${gradientClass} bg-clip-text text-transparent inline-block ${className}`}
      initial={{ backgroundPosition: '0% 50%' }}
      animate={{ backgroundPosition: '200% 50%' }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        repeatType: 'reverse',
        ease: 'linear' 
      }}
      style={{ backgroundSize: '200% 200%' }}
    >
      {text}
    </motion.span>
  );
};

// Button animation wrapper
export const AnimatedButton = ({ children, className = '', onClick }) => {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  );
};

// Icon bounce animation
export const IconBounce = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.2, rotate: 5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.div>
  );
};
