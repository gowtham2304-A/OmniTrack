import { useEffect, useState, useRef } from 'react';

export function useAnimatedNumber(target, duration = 1500, delay = 0) {
    const [current, setCurrent] = useState(0);
    const startTime = useRef(null);
    const rafId = useRef(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const animate = (timestamp) => {
                if (!startTime.current) startTime.current = timestamp;
                const elapsed = timestamp - startTime.current;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                setCurrent(Math.round(target * eased));

                if (progress < 1) {
                    rafId.current = requestAnimationFrame(animate);
                }
            };

            rafId.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timeout);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [target, duration, delay]);

    return current;
}

export function useInView(threshold = 0.1) {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, isInView];
}
