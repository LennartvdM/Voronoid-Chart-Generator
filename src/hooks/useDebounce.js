import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce a value - only updates after delay of no changes
 *
 * @param {T} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {T} Debounced value
 * @template T
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Create a debounced callback function
 *
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebouncedCallback(callback, delay) {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * State setter with debounced updates to an external handler
 * Immediately updates local state but debounces the external update
 *
 * @param {T} initialValue - Initial value
 * @param {Function} onUpdate - External update handler (debounced)
 * @param {number} delay - Debounce delay
 * @returns {[T, Function]} State value and setter
 * @template T
 */
export function useDebouncedState(initialValue, onUpdate, delay = 100) {
  const [value, setValue] = useState(initialValue);
  const debouncedUpdate = useDebouncedCallback(onUpdate, delay);

  const setValueWithDebounce = useCallback((newValue) => {
    setValue(newValue);
    debouncedUpdate(newValue);
  }, [debouncedUpdate]);

  return [value, setValueWithDebounce];
}
