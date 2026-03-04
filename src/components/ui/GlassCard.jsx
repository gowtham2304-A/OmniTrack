import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', delay = 0, hover = true, glow = '', onClick, ...props }) {
    return (
        <motion.div
            className={`glass-card${hover ? '' : '-static'} p-5 ${glow ? `hover:${glow}` : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
            whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
            whileTap={onClick ? { scale: 0.99 } : undefined}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function GlassCardStatic({ children, className = '', delay = 0 }) {
    return (
        <motion.div
            className={`glass-card-static p-5 ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
        >
            {children}
        </motion.div>
    );
}
