import { useEffect, useState } from 'react';

/**
 * Hook to detect user's prefers-reduced-motion preference
 * Following Emil Kowalski's motion engineering principles
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (event) => setReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * Hook for scroll-triggered animations with IntersectionObserver
 */
export function useScrollAnimation(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options.once !== false) {
            observer.unobserve(element);
          }
        } else if (options.once === false) {
          setIsVisible(false);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px'
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, options.once]);

  return [elementRef, isVisible];
}

/**
 * Hook for staggering child animations
 */
export function useStaggeredAnimation(count, baseDelay = 100) {
  const [visibleItems, setVisibleItems] = useState(new Set());
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the animation
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              setVisibleItems(prev => new Set([...prev, i]));
            }, i * baseDelay);
          }
          observer.unobserve(container);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [count, baseDelay]);

  return [containerRef, visibleItems];
}

/**
 * Hook for spring-based animations (Emil Kowalski style)
 */
export function useSpring(initialValue = 0, config = {}) {
  const {
    stiffness = 120,
    damping = 14,
    mass = 1,
    precision = 0.01,
    velocity = 0
  } = config;

  const [value, setValue] = useState(initialValue);
  const [target, setTarget] = useState(initialValue);
  const animationRef = useRef(null);
  const velocityRef = useRef(velocity);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = () => {
      const displacement = target - value;
      const springForce = displacement * stiffness;
      const dampingForce = velocityRef.current * damping;
      const acceleration = (springForce - dampingForce) / mass;

      velocityRef.current += acceleration * 0.016; // ~60fps
      const newValue = value + velocityRef.current * 0.016;

      setValue(newValue);

      if (Math.abs(newValue - target) > precision || Math.abs(velocityRef.current) > precision) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
        velocityRef.current = 0;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, value, stiffness, damping, mass, precision]);

  const setTargetValue = (newTarget) => {
    setTarget(newTarget);
  };

  return [value, setTargetValue];
}

import { useRef } from 'react';