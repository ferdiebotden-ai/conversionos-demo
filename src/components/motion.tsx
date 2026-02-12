'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  fadeInUp,
  fadeIn,
  scaleIn,
  staggerContainer,
  staggerItem,
} from '@/lib/animations';

interface MotionProps {
  children: ReactNode;
  className?: string;
}

/** Fade in + slide up when scrolled into view */
export function FadeInUp({ children, className }: MotionProps) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      variants={fadeInUp}
      initial={shouldReduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Simple fade in when scrolled into view */
export function FadeIn({ children, className }: MotionProps) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      variants={fadeIn}
      initial={shouldReduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Scale up + fade in when scrolled into view */
export function ScaleIn({ children, className }: MotionProps) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      variants={scaleIn}
      initial={shouldReduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its children into view */
export function StaggerContainer({ children, className }: MotionProps) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      variants={staggerContainer}
      initial={shouldReduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual stagger item — must be inside StaggerContainer */
export function StaggerItem({ children, className }: MotionProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
