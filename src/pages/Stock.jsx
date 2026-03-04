import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { loadStock } from '../services/dataLoader';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const urgencyConfig = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Critical', icon: AlertTriangle },
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Warning', icon: Clock },
    moderate: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', label: 'Moderate', icon: TrendingDown },
    healthy: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Healthy', icon: Package },
};

function CircularProgress({ percent, color, size = 80, strokeWidth = 6 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
                    transition={{ duration: 1.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold" style={{ color }}>{percent}%</span>
            </div>
        </div>
    );
}

export default function Stock() {
    const [stockData, setStockData] = useState([]);

    useEffect(() => {
        loadStock().then(setStockData);
    }, []);

    const summaryStats = {
        critical: stockData.filter(s => s.urgency === 'critical').length,
        warning: stockData.filter(s => s.urgency === 'warning').length,
        healthy: stockData.filter(s => s.urgency === 'healthy' || s.urgency === 'moderate').length,
        totalUnits: stockData.reduce((s, d) => s + d.stock, 0),
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Critical Items', value: summaryStats.critical, color: '#ef4444', icon: AlertTriangle },
                    { label: 'Low Stock', value: summaryStats.warning, color: '#f59e0b', icon: Clock },
                    { label: 'Healthy Items', value: summaryStats.healthy, color: '#10b981', icon: Package },
                    { label: 'Total Units', value: summaryStats.totalUnits, color: '#7c3aed', icon: Package },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} variants={item}>
                            <GlassCard delay={i * 0.08}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-[#5a5a6e] font-medium uppercase tracking-wider">{stat.label}</span>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                                        <Icon size={16} style={{ color: stat.color }} />
                                    </div>
                                </div>
                                <AnimatedNumber value={stat.value} className="text-2xl font-bold text-white" delay={i * 100} />
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            {/* Stock Health Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stockData.map((product, i) => {
                    const config = urgencyConfig[product.urgency];
                    const UrgencyIcon = config.icon;

                    return (
                        <motion.div key={product.id} variants={item}>
                            <GlassCard
                                delay={0.3 + i * 0.05}
                                className={`relative overflow-hidden ${product.urgency === 'critical' ? 'critical-pulse' : ''}`}
                            >
                                {/* Urgency Badge */}
                                <div
                                    className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                                    style={{ background: config.bg, color: config.color }}
                                >
                                    <UrgencyIcon size={10} />
                                    {config.label}
                                </div>

                                {/* Product */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-xl">
                                        {product.image}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white truncate max-w-[140px]">{product.name}</h3>
                                        <span className="text-[10px] text-[#5a5a6e] font-mono">{product.sku}</span>
                                    </div>
                                </div>

                                {/* Circular Progress */}
                                <div className="flex items-center justify-between mb-4">
                                    <CircularProgress percent={product.stockPercent} color={config.color} />
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">{product.stock}</p>
                                        <p className="text-[10px] text-[#5a5a6e]">units left</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-[#5a5a6e]">Daily Sales Rate</span>
                                        <span className="text-xs font-medium text-white">{product.dailySalesRate}/day</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-[#5a5a6e]">Days of Stock</span>
                                        <span className="text-xs font-bold" style={{ color: config.color }}>{product.daysOfStock} days</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-[#5a5a6e]">Reorder Date</span>
                                        <span className="text-xs font-medium text-white">{product.reorderDate}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-[#5a5a6e]">Reorder Qty</span>
                                        <span className="text-xs font-medium text-[#7c3aed]">{product.reorderQty} units</span>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
