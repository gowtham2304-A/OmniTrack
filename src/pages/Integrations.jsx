import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, AlertCircle, CheckCircle, Plus, Key, Link as LinkIcon, RefreshCw, Upload, X } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useToast } from '../components/ui/Toast';

const API = 'http://localhost:8000';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// All 19 platforms
const ALL_PLATFORMS = [
    // Indian
    { id: 'amazon', name: 'Amazon India', icon: '📦', color: '#FF9900', category: 'india', authType: 'api', fields: ['Seller ID', 'MWS Auth Token'] },
    { id: 'flipkart', name: 'Flipkart', icon: '🏪', color: '#2874F0', category: 'india', authType: 'api', fields: ['Seller ID', 'API Key'] },
    { id: 'meesho', name: 'Meesho', icon: '🛍️', color: '#E91E63', category: 'india', authType: 'csv', fields: [] },
    { id: 'myntra', name: 'Myntra', icon: '👗', color: '#FF3366', category: 'india', authType: 'csv', fields: [] },
    { id: 'nykaa', name: 'Nykaa', icon: '💄', color: '#FC2779', category: 'india', authType: 'csv', fields: [] },
    { id: 'snapdeal', name: 'Snapdeal', icon: '🎯', color: '#E40046', category: 'india', authType: 'api', fields: ['Seller ID', 'API Token'] },
    { id: 'jiomart', name: 'JioMart', icon: '🛒', color: '#0078AD', category: 'india', authType: 'csv', fields: [] },
    { id: 'glowroad', name: 'Glowroad', icon: '✨', color: '#7B2D8E', category: 'india', authType: 'csv', fields: [] },
    // Global
    { id: 'shopify', name: 'Shopify', icon: '🏬', color: '#96BF48', category: 'global', authType: 'oauth', fields: ['Shop Name'] },
    { id: 'woocommerce', name: 'WooCommerce', icon: '🌐', color: '#96588A', category: 'global', authType: 'api', fields: ['Store URL', 'Consumer Key', 'Consumer Secret'] },
    { id: 'etsy', name: 'Etsy', icon: '🎨', color: '#F1641E', category: 'global', authType: 'oauth', fields: ['Shop ID'] },
    { id: 'ebay', name: 'eBay', icon: '🏷️', color: '#E53238', category: 'global', authType: 'api', fields: ['App ID', 'Auth Token'] },
    { id: 'tiktokshop', name: 'TikTok Shop', icon: '🎵', color: '#00F2EA', category: 'global', authType: 'api', fields: ['App Key', 'App Secret'] },
    { id: 'noon', name: 'Noon', icon: '☀️', color: '#FEEE00', category: 'global', authType: 'api', fields: ['Seller ID', 'API Key'] },
    { id: 'lazada', name: 'Lazada', icon: '🌏', color: '#0F146D', category: 'global', authType: 'api', fields: ['App Key', 'App Secret'] },
    { id: 'shopee', name: 'Shopee', icon: '🧡', color: '#EE4D2D', category: 'global', authType: 'api', fields: ['Partner ID', 'Partner Key'] },
    // Social Commerce
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366', category: 'social', authType: 'csv', fields: [] },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F', category: 'social', authType: 'api', fields: ['Business Account ID', 'Access Token'] },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2', category: 'social', authType: 'api', fields: ['Commerce Account ID', 'Access Token'] },
];

export default function Integrations() {
    const [connections, setConnections] = useState({});
    const [connectingId, setConnectingId] = useState(null);
    const [syncingId, setSyncingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activeIntegration, setActiveIntegration] = useState(null);
    const [formFields, setFormFields] = useState({});
    const [filterCategory, setFilterCategory] = useState('all');
    const { addToast } = useToast();

    // Fetch connections from backend on mount
    const fetchConnections = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/connections`);
            if (res.ok) {
                const data = await res.json();
                const map = {};
                data.forEach(c => {
                    map[c.platform_name] = c;
                });
                setConnections(map);
            }
        } catch {
            // Backend may be down, that's ok
        }
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const openConnectModal = (integration) => {
        setActiveIntegration(integration);
        const initial = {};
        integration.fields.forEach(f => { initial[f] = ''; });
        setFormFields(initial);
        setShowModal(true);
    };

    // Real backend connect
    const handleConnect = async (e) => {
        e.preventDefault();
        setShowModal(false);
        setConnectingId(activeIntegration.id);

        try {
            const fieldValues = Object.values(formFields);
            const payload = {
                seller_id: fieldValues[0] || '',
                api_key: fieldValues[1] || '',
            };

            const res = await fetch(`${API}/api/connect/${activeIntegration.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                addToast(`Successfully connected to ${activeIntegration.name}! Initial sync started.`, 'success');
                await fetchConnections();
            } else {
                throw new Error('Failed to connect');
            }
        } catch (err) {
            addToast(`Failed to connect to ${activeIntegration.name}: ${err.message}`, 'error');
        } finally {
            setConnectingId(null);
        }
    };

    // CSV-only connect (just mark as connected)
    const handleCsvConnect = async (integration) => {
        setConnectingId(integration.id);
        try {
            const res = await fetch(`${API}/api/connect/${integration.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seller_id: 'csv-only', api_key: '' }),
            });
            if (res.ok) {
                addToast(`${integration.name} connected! Upload CSV files from the CSV Upload page.`, 'success');
                await fetchConnections();
            }
        } catch {
            addToast(`Failed to connect ${integration.name}`, 'error');
        } finally {
            setConnectingId(null);
        }
    };

    // Real backend disconnect
    const handleDisconnect = async (id) => {
        try {
            const res = await fetch(`${API}/api/connections/${id}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Platform disconnected', 'info');
                await fetchConnections();
            }
        } catch {
            addToast('Failed to disconnect', 'error');
        }
    };

    // Real backend sync
    const handleSync = async (id, name) => {
        setSyncingId(id);
        try {
            const res = await fetch(`${API}/api/sync/${id}`, { method: 'POST' });
            if (res.ok) {
                addToast(`Sync started for ${name}`, 'success');
                // Refresh connections after a brief delay to see updated last_synced_at
                setTimeout(() => fetchConnections(), 2000);
            }
        } catch {
            addToast(`Sync failed for: ${name}`, 'error');
        } finally {
            setTimeout(() => setSyncingId(null), 2000);
        }
    };

    const isConnected = (id) => connections[id]?.status === 'connected';
    const connectedCount = Object.values(connections).filter(c => c.status === 'connected').length;

    const filteredPlatforms = filterCategory === 'all'
        ? ALL_PLATFORMS
        : ALL_PLATFORMS.filter(p => p.category === filterCategory);

    const categoryLabels = { all: 'All', india: '🇮🇳 India', global: '🌍 Global', social: '💬 Social' };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

            {/* Header / Summary */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <GlassCard hover={false}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/15 to-cyan-500/10 flex items-center justify-center">
                                <LinkIcon size={20} className="text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-white">Platform Integrations</h3>
                                <p className="text-xs text-gray-500">Manage your connected marketplaces</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed mt-4">
                            Connect your ecommerce accounts using secure API keys or Seller IDs to automatically sync orders, products, stock, and P&L metrics into your SellerVerse dashboard.
                            Platforms marked <span className="text-amber-400 font-medium">CSV Only</span> require manual file uploads.
                        </p>
                    </GlassCard>
                </div>
                <div>
                    <GlassCard delay={0.1} className="h-full flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-800 flex items-center justify-center relative mb-3">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                <motion.circle
                                    cx="32" cy="32" r="26" fill="none"
                                    stroke="url(#grad)" strokeWidth="4" strokeLinecap="round"
                                    strokeDasharray="163"
                                    initial={{ strokeDashoffset: 163 }}
                                    animate={{ strokeDashoffset: 163 - (connectedCount / ALL_PLATFORMS.length) * 163 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#7c3aed" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="text-xl font-bold text-white">{connectedCount}</span>
                        </div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                            {connectedCount} of {ALL_PLATFORMS.length} Connected
                        </p>
                    </GlassCard>
                </div>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div variants={item} className="flex gap-2 flex-wrap">
                {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFilterCategory(key)}
                        className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${filterCategory === key
                                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                                : 'bg-gray-800/30 text-gray-400 border border-gray-700/30 hover:text-white hover:bg-gray-700/30'
                            }`}
                    >
                        {label}
                        <span className="ml-2 text-gray-500">
                            {key === 'all' ? ALL_PLATFORMS.length : ALL_PLATFORMS.filter(p => p.category === key).length}
                        </span>
                    </button>
                ))}
            </motion.div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlatforms.map((integration, i) => {
                    const connected = isConnected(integration.id);
                    const connData = connections[integration.id];
                    const isCsvOnly = integration.authType === 'csv';

                    return (
                        <motion.div key={integration.id} variants={item}>
                            <GlassCard delay={0.1 + (i * 0.03)} className="h-full flex flex-col relative overflow-hidden">
                                {/* Status Indicator */}
                                <div className="absolute top-4 right-4 flex items-center gap-1">
                                    {connected ? (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-green-400 text-xs font-medium" style={{ background: 'rgba(16,185,129,0.1)' }}>
                                            <CheckCircle size={10} /> Connected
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-gray-500 text-xs font-medium" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <AlertCircle size={10} /> Not Connected
                                        </div>
                                    )}
                                </div>

                                {/* Platform Info */}
                                <div className="flex items-center gap-4 mb-4 mt-1">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                                        style={{ background: `${integration.color}15` }}
                                    >
                                        {integration.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white leading-tight">{integration.name}</h3>
                                        <span className="text-xs text-gray-500 capitalize">{integration.category}</span>
                                    </div>
                                </div>

                                {/* Auth Type Badge */}
                                <div className="mb-4">
                                    {isCsvOnly ? (
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-400" style={{ background: 'rgba(245,158,11,0.1)' }}>
                                            <Upload size={10} /> CSV Upload Only
                                        </div>
                                    ) : integration.authType === 'oauth' ? (
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-400" style={{ background: 'rgba(37,99,235,0.1)' }}>
                                            <Key size={10} /> OAuth
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-purple-400" style={{ background: 'rgba(124,58,237,0.1)' }}>
                                            <Key size={10} /> API Key
                                        </div>
                                    )}
                                </div>

                                {/* Connection Info */}
                                <div className="flex-1">
                                    {connected && connData && (
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500">Last Sync</span>
                                                <span className="text-white font-medium">
                                                    {connData.last_synced_at
                                                        ? new Date(connData.last_synced_at).toLocaleString()
                                                        : 'Never'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                <span className="text-xs text-gray-400">Active</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                    {connected ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSync(integration.id, integration.name)}
                                                disabled={syncingId === integration.id}
                                                className="flex-1 py-2 text-xs font-medium text-gray-400 rounded-lg transition-all flex items-center justify-center gap-1 hover:text-white"
                                                style={{ background: 'rgba(255,255,255,0.03)' }}
                                            >
                                                <RefreshCw size={12} className={syncingId === integration.id ? 'animate-spin' : ''} />
                                                {syncingId === integration.id ? 'Syncing...' : 'Sync Now'}
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(integration.id)}
                                                className="px-3 py-2 text-xs font-medium text-red-400 rounded-lg transition-colors hover:text-red-300"
                                                style={{ background: 'rgba(239,68,68,0.05)' }}
                                            >
                                                Disconnect
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => isCsvOnly ? handleCsvConnect(integration) : openConnectModal(integration)}
                                            disabled={connectingId === integration.id}
                                            className="w-full py-2 text-xs font-medium text-white btn-primary rounded-lg flex items-center justify-center gap-2"
                                        >
                                            {connectingId === integration.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>{isCsvOnly ? <Upload size={14} /> : <Plug size={14} />} Connect {integration.name}</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            {/* Connection Modal for API-based platforms */}
            <AnimatePresence>
                {showModal && activeIntegration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md glass-card p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${activeIntegration.color}15` }}>
                                        {activeIntegration.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Connect {activeIntegration.name}</h3>
                                        <p className="text-xs text-gray-500">Enter your API credentials to sync data</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleConnect} className="space-y-4">
                                {activeIntegration.fields.map((fieldName, idx) => (
                                    <div key={fieldName} className="space-y-2">
                                        <label className="text-xs font-medium text-gray-300">{fieldName}</label>
                                        <input
                                            required
                                            type={fieldName.toLowerCase().includes('secret') || fieldName.toLowerCase().includes('token') || fieldName.toLowerCase().includes('key') ? 'password' : 'text'}
                                            value={formFields[fieldName] || ''}
                                            onChange={e => setFormFields({ ...formFields, [fieldName]: e.target.value })}
                                            style={{ backgroundColor: '#111118', borderColor: '#3f3f4e' }}
                                            className="w-full border rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder-gray-500"
                                            placeholder={`Enter your ${fieldName}`}
                                        />
                                    </div>
                                ))}

                                <div className="rounded-lg p-3 mt-4 flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                    <AlertCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-green-400/80 leading-relaxed font-medium">
                                        Your credentials are encrypted end-to-end and stored securely. SellerVerse uses read-only access to import your metrics.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4 mt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-2 text-sm font-medium text-gray-400 rounded-xl hover:text-white transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.03)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 text-sm font-medium text-white btn-primary rounded-xl"
                                    >
                                        Verify & Connect
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
