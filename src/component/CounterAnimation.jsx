import React, { useState, useEffect, useRef } from 'react';

// Component สำหรับแสดง counter animation
const CounterAnimation = ({ value, duration = 1000, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);
  const startTimeRef = useRef(null);
  const requestRef = useRef(null);

  const animate = (timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const progress = timestamp - startTimeRef.current;
    const previousValue = previousValueRef.current;
    const targetValue = value;
    const remaining = Math.max(0, duration - progress);

    if (remaining === 0) {
      setDisplayValue(targetValue);
    } else {
      // Calculate current value using easeOutExpo animation
      const currentValue = previousValue + (targetValue - previousValue) * 
        (1 - Math.pow(2, -10 * progress / duration));
      
      setDisplayValue(Math.round(currentValue));
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    previousValueRef.current = displayValue;
    startTimeRef.current = null;
    
    // Cancel any existing animation
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [value]);

  return (
    <span className={className}>
      {displayValue}
    </span>
  );
};

export default CounterAnimation;