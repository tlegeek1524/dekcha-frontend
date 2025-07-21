
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Enhanced Counter Animation Component with Real-time Updates
const CounterAnimation = ({ 
  fetchDataFunction, 
  duration = 1000, 
  pollingInterval = 30000, // Default 30 seconds
  className = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [latestValue, setLatestValue] = useState(0);
  const previousValueRef = useRef(0);
  const startTimeRef = useRef(null);
  const requestRef = useRef(null);
  const lastFetchTimeRef = useRef(0);

  // Easing function for smooth animation
  const easeOutExpo = (progress, start, end, duration) => {
    return start + (end - start) * (1 - Math.pow(2, -10 * progress / duration));
  };

  // Animation logic
  const animate = useCallback((timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const progress = timestamp - startTimeRef.current;
    const previousValue = previousValueRef.current;
    const targetValue = latestValue;
    const remaining = Math.max(0, duration - progress);

    if (remaining === 0) {
      setDisplayValue(targetValue);
      startTimeRef.current = null;
    } else {
      // Calculate current value using easeOutExpo animation
      const currentValue = easeOutExpo(progress, previousValue, targetValue, duration);
      
      setDisplayValue(Math.round(currentValue));
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [latestValue, duration]);

  // Fetch data function
  const fetchAndUpdateData = useCallback(async () => {
    try {
      // Fetch the latest value using the provided function
      const newValue = await fetchDataFunction();
      
      // Only update if the value has changed
      if (newValue !== latestValue) {
        previousValueRef.current = displayValue;
        setLatestValue(newValue);
        startTimeRef.current = null;
        
        // Cancel any existing animation
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
        
        // Start new animation
        requestRef.current = requestAnimationFrame(animate);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [fetchDataFunction, latestValue, displayValue, animate]);

  // Setup periodic polling and initial fetch
  useEffect(() => {
    // Immediate first fetch
    fetchAndUpdateData();

    // Setup interval for periodic polling
    const intervalId = setInterval(fetchAndUpdateData, pollingInterval);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [fetchAndUpdateData, pollingInterval]);

  return (
    <span className={className}>
      {displayValue}
    </span>
  );
};

export default CounterAnimation;
