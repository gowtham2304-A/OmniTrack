import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, RotateCcw, ShoppingCart, IndianRupee } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import SparkLine from '../components/charts/SparkLine';
import { loadPlatformSummaries } from '../services/dataLoader';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

function formatCurrency(num) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toLocaleString('en-IN')}`;
}

function PlatformCard({ platform, index }) {
    const [flipped, setFlipped] = useState(false);

    return (
        <motion.div
            variants={item}
            className="perspective-[1000px] h-[280px]"
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
        >
            <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 glass-card p-5 flex flex-col"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                            style={{ background: `${platform.color}15` }}
                        >
                            {platform.icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">{platform.name}</h3>
                            <span className="text-[10px] uppercase tracking-wider text-[#5a5a6e]">{platform.category}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <p className="text-[10px] text-[#5a5a6e] uppercase">Revenue</p>
                            <p className="text-base font-bold text-white">{formatCurrency(platform.revenue)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[#5a5a6e] uppercase">Profit</p>
                            <p className="text-base font-bold" style={{ color: platform.profit > 0 ? '#10b981' : '#ef4444' }}>
                                {formatCurrency(platform.profit)}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <SparkLine data={platform.sparkline} color={platform.color} height={60} />
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                        <span className="text-[10px] text-[#5a5a6e]">Hover for details →</span>
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: platform.color }}
                        />
                    </div>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 glass-card p-5 flex flex-col"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        {platform.icon} {platform.name}
                    </h3>

                    <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#5a5a6e] flex items-center gap-1.5"><IndianRupee size={12} /> Revenue</span>
                            <span className="text-sm font-medium text-white">{formatCurrency(platform.revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#5a5a6e] flex items-center gap-1.5"><TrendingUp size={12} /> Margin</span>
                            <span className="text-sm font-medium" style={{ color: parseFloat(platform.margin) > 20 ? '#10b981' : '#f59e0b' }}>
                                {platform.margin}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#5a5a6e] flex items-center gap-1.5"><ShoppingCart size={12} /> Orders</span>
                            <span className="text-sm font-medium text-white">{platform.orders.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#5a5a6e] flex items-center gap-1.5"><IndianRupee size={12} /> AOV</span>
                            <span className="text-sm font-medium text-white">₹{platform.avgOrderValue}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#5a5a6e] flex items-center gap-1.5"><RotateCcw size={12} /> Return Rate</span>
                            <span className="text-sm font-medium" style={{ color: parseFloat(platform.returnRate) > 10 ? '#ef4444' : '#10b981' }}>
                                {platform.returnRate}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#5a5a6e] flex items-center gap-1.5"><IndianRupee size={12} /> Fees</span>
                            <span className="text-sm font-medium text-[#f59e0b]">{formatCurrency(platform.fees)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function Platforms() {
    const [platformSummaries, setPlatformSummaries] = useState([]);
    const [sortBy, setSortBy] = useState('revenue');

    useEffect(() => {
        loadPlatformSummaries().then(setPlatformSummaries);
    }, []);

    const sorted = [...platformSummaries].sort((a, b) => b[sortBy] - a[sortBy]);

    const comparisonData = sorted.map(p => ({
        name: p.name.split(' ')[0],
        revenue: p.revenue,
        profit: p.profit,
        fill: p.color,
    }));

    const returnData = sorted.map(p => ({
        name: p.name.split(' ')[0],
        returnRate: parseFloat(p.returnRate),
        fill: parseFloat(p.returnRate) > 12 ? '#ef4444' : parseFloat(p.returnRate) > 8 ? '#f59e0b' : '#10b981',
    }));

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Sort Controls */}
            <motion.div variants={item} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#5a5a6e] mr-2">Sort by:</span>
                {['revenue', 'profit', 'orders'].map(s => (
                    <motion.button
                        key={s}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === s
                            ? 'bg-gradient-to-r from-[rgba(124,58,237,0.2)] to-[rgba(6,182,212,0.15)] text-white border border-[rgba(124,58,237,0.3)]'
                            : 'text-[#5a5a6e] hover:text-white bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)]'
                            }`}
                        onClick={() => setSortBy(s)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </motion.button>
                ))}
            </motion.div>

            {/* Platform Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {sorted.map((platform, i) => (
                    <PlatformCard key={platform.id} platform={platform} index={i} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Comparison */}
                <motion.div variants={item}>
                    <GlassCard delay={0.5} hover={false} className="!p-0">
                        <div className="p-5 pb-0">
                            <h3 className="text-sm font-semibold text-white">Revenue Comparison</h3>
                            <p className="text-xs text-[#5a5a6e]">Across all platforms</p>
                        </div>
                        <div className="p-4 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                    <XAxis type="number" stroke="#5a5a6e" fontSize={10} tickFormatter={v => formatCurrency(v)} />
                                    <YAxis type="category" dataKey="name" stroke="#5a5a6e" fontSize={10} width={70} />
                                    <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', fontSize: '12px' }} />
                                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]} animationDuration={1500}>
                                        {comparisonData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} fillOpacity={0.7} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Return Rate */}
                <motion.div variants={item}>
                    <GlassCard delay={0.6} hover={false} className="!p-0">
                        <div className="p-5 pb-0">
                            <h3 className="text-sm font-semibold text-white">Return Rate</h3>
                            <p className="text-xs text-[#5a5a6e]">Platform-wise return percentage</p>
                        </div>
                        <div className="p-4 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={returnData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="name" stroke="#5a5a6e" fontSize={10} />
                                    <YAxis stroke="#5a5a6e" fontSize={10} tickFormatter={v => `${v}%`} />
                                    <Tooltip formatter={v => `${v}%`} contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', fontSize: '12px' }} />
                                    <Bar dataKey="returnRate" radius={[6, 6, 0, 0]} animationDuration={1500}>
                                        {returnData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} fillOpacity={0.7} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </motion.div>
    );
}
