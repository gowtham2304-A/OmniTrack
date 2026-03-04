import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, Check, CheckCheck, Trash2, X, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

const typeConfig = {
    info: { icon: Info, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    success: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    error: { icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

function timeAgo(isoString) {
    const d = new Date(isoString);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    const load = async () => {
        try {
            const res = await fetch(`${API}/api/notifications?limit=15`);
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch { /* backend might be unreachable */ }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const markRead = async (id) => {
        await fetch(`${API}/api/notifications/${id}/read`, { method: 'POST' });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllRead = async () => {
        await fetch(`${API}/api/notifications/read-all`, { method: 'POST' });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const remove = async (id, e) => {
        e.stopPropagation();
        await fetch(`${API}/api/notifications/${id}`, { method: 'DELETE' });
        setNotifications(prev => prev.filter(n => n.id !== id));
        const wasUnread = notifications.find(n => n.id === id)?.is_read === false;
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleClick = (n) => {
        if (!n.is_read) markRead(n.id);
        if (n.link) { setOpen(false); navigate(n.link); }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setOpen(o => !o); if (!open) load(); }}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: open ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                {unreadCount > 0
                    ? <BellRing size={16} className="text-purple-400" />
                    : <Bell size={16} className="text-gray-400" />
                }
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span key="badge"
                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #ef4444)' }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Dropdown panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-11 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl"
                        style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-2">
                                <Bell size={14} className="text-purple-400" />
                                <span className="text-sm font-semibold text-white">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-purple-300"
                                        style={{ background: 'rgba(124,58,237,0.2)' }}>{unreadCount}</span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead}
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                                    <CheckCheck size={12} /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <Bell size={24} className="mx-auto mb-2 text-gray-700" />
                                    <p className="text-xs text-gray-500">No notifications yet</p>
                                    <p className="text-xs text-gray-600 mt-1">Auto-sync results and alerts will appear here</p>
                                </div>
                            ) : (
                                notifications.map(n => {
                                    const cfg = typeConfig[n.type] || typeConfig.info;
                                    const Icon = cfg.icon;
                                    return (
                                        <motion.div key={n.id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            onClick={() => handleClick(n)}
                                            className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group"
                                            style={{
                                                background: n.is_read ? 'transparent' : 'rgba(124,58,237,0.05)',
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                            onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(124,58,237,0.05)'}
                                        >
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: cfg.bg }}>
                                                <Icon size={13} style={{ color: cfg.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-xs font-medium text-white leading-tight">{n.title}</p>
                                                    {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-1" />}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                                            </div>
                                            <button onClick={e => remove(n.id, e)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0">
                                                <X size={12} />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-2.5 text-center"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="text-xs text-gray-600">
                                    Auto-refreshes every 30s
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
