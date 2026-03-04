import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

export default function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500, delay = 0, className = '' }) {
    const animated = useAnimatedNumber(value, duration, delay);

    const formatNumber = (num) => {
        if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
        if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString('en-IN');
    };

    return (
        <span className={className}>
            {prefix}{typeof value === 'number' && value > 999 ? formatNumber(animated) : animated}{suffix}
        </span>
    );
}
