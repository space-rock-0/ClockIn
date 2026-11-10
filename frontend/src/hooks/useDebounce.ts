import { useEffect, useRef } from "react";

export function useDebounce<T>(
    value: T,
    delay: number,
    callback: (val: T) => void
) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const callbackRef = useRef(callback);

    // 🔥 keep latest callback
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (timer.current) clearTimeout(timer.current);

        timer.current = setTimeout(() => {
            callbackRef.current(value); // 🔥 use ref
        }, delay);

        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [value, delay]); // ✅ no callback here
}