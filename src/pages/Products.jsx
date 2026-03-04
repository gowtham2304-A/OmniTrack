import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { ChevronDown, Award, TrendingUp, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { loadProductPerformance } from '../services/dataLoader';

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

const medalColors = {
    1: { bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '🥇' },
    2: { bg: 'from-gray-300/20 to-gray-400/10', border: 'border-gray-400/30', text: 'text-gray-300', icon: '🥈' },
    3: { bg: 'from-amber-600/20 to-amber-700/10', border: 'border-amber-600/30', text: 'text-amber-500', icon: '🥉' },
};

const stockColors = {
    critical: { color: '#ef4444', label: 'Critical', pulse: true },
    low: { color: '#f59e0b', label: 'Low Stock' },
    medium: { color: '#06b6d4', label: 'Medium' },
    healthy: { color: '#10b981', label: 'Healthy' },
};

function ProductCard({ product }) {
    const [expanded, setExpanded] = useState(false);
    const medal = medalColors[product.rank];
    const stockInfo = stockColors[product.stockStatus];

    return (
        <motion.div variants={item}>
            <motion.div
                className="glass-card overflow-hidden cursor-pointer"
                onClick={() => setExpanded(!expanded)}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Main Row */}
                <div className="p-5 flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 text-center">
                        {medal ? (
                            <span className="text-2xl">{medal.icon}</span>
                        ) : (
                            <span className="text-sm font-bold text-[#5a5a6e]">#{product.rank}</span>
                        )}
                    </div>

                    {/* Product Image/Icon */}
                    <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-2xl flex-shrink-0">
                        {product.image}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#5a5a6e] font-mono">{product.sku}</span>
                            <span className="text-[10px] text-[#5a5a6e]">•</span>
                            <span className="text-[10px] text-[#5a5a6e]">{product.category}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] text-[#5a5a6e] uppercase">Revenue</p>
                            <p className="text-sm font-bold text-white">{formatCurrency(product.totalRevenue)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-[#5a5a6e] uppercase">Profit</p>
                            <p className="text-sm font-bold text-[#10b981]">{formatCurrency(product.profit)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-[#5a5a6e] uppercase">Margin</p>
                            <p className="text-sm font-bold" style={{ color: parseFloat(product.margin) > 30 ? '#10b981' : '#f59e0b' }}>
                                {product.margin}%
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-[#5a5a6e] uppercase">Sales</p>
                            <p className="text-sm font-bold text-white">{product.totalSales.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${stockInfo.pulse ? 'critical-pulse' : ''}`}
                                style={{ background: `${stockInfo.color}15`, color: stockInfo.color }}
                            >
                                {stockInfo.pulse && <AlertTriangle size={10} />}
                                {product.stock} units
                            </span>
                        </div>
                    </div>

                    {/* Expand */}
                    <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[#5a5a6e]"
                    >
                        <ChevronDown size={18} />
                    </motion.div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.04)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-4">
                                    {/* Sales Trend */}
                                    <div className="glass-card-static p-4">
                                        <h4 className="text-xs text-[#5a5a6e] mb-3 font-medium">Sales Trend (30d)</h4>
                                        <div className="h-[140px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={product.dailySales}>
                                                    <defs>
                                                        <linearGradient id={`prod-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                                                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                                    <XAxis dataKey="day" stroke="#5a5a6e" fontSize={9} />
                                                    <YAxis stroke="#5a5a6e" fontSize={9} />
                                                    <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px' }} />
                                                    <Area type="monotone" dataKey="sales" stroke="#7c3aed" fill={`url(#prod-${product.id})`} strokeWidth={1.5} animationDuration={1200} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Platform Breakdown */}
                                    <div className="glass-card-static p-4">
                                        <h4 className="text-xs text-[#5a5a6e] mb-3 font-medium">Platform Breakdown</h4>
                                        <div className="h-[140px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={product.platformBreakdown}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={30}
                                                        outerRadius={50}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        animationDuration={1200}
                                                    >
                                                        {product.platformBreakdown.map((entry, index) => (
                                                            <Cell key={index} fill={entry.color} stroke="transparent" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {product.platformBreakdown.map((p, i) => (
                                                <span key={i} className="flex items-center gap-1 text-[9px] text-[#8b8b9e]">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                                                    {p.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Profit Breakdown */}
                                    <div className="glass-card-static p-4">
                                        <h4 className="text-xs text-[#5a5a6e] mb-3 font-medium">Profit Breakdown</h4>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Selling Price', value: `₹${product.sellingPrice}`, bar: 100, color: '#7c3aed' },
                                                { label: 'Cost Price', value: `₹${product.costPrice}`, bar: (product.costPrice / product.sellingPrice * 100), color: '#ef4444' },
                                                { label: 'Margin', value: `${product.margin}%`, bar: parseFloat(product.margin), color: '#10b981' },
                                                { label: 'Return Rate', value: `${product.returnRate}%`, bar: parseFloat(product.returnRate) * 5, color: '#f59e0b' },
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] text-[#5a5a6e]">{item.label}</span>
                                                        <span className="text-xs font-medium text-white">{item.value}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{ background: item.color }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, item.bar)}%` }}
                                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Day-wise Sales */}
                                    <div className="glass-card-static p-4">
                                        <h4 className="text-xs text-[#5a5a6e] mb-3 font-medium">Day-wise Sales (Last 14d)</h4>
                                        <div className="h-[140px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={product.dailySales.slice(-14)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                                    <XAxis dataKey="day" stroke="#5a5a6e" fontSize={9} />
                                                    <YAxis stroke="#5a5a6e" fontSize={9} />
                                                    <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px' }} />
                                                    <Bar dataKey="sales" fill="#2563eb" fillOpacity={0.6} radius={[3, 3, 0, 0]} animationDuration={1200} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

export default function Products() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        loadProductPerformance().then(setProducts);
    }, []);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            <motion.div variants={item} className="flex items-center justify-between">
                <p className="text-xs text-[#5a5a6e]">Click any product to expand and see drill-down analytics</p>
                <span className="text-xs text-[#5a5a6e] bg-[rgba(255,255,255,0.04)] px-2 py-1 rounded-lg">
                    {products.length} products
                </span>
            </motion.div>

            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </motion.div>
    );
}
