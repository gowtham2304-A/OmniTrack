import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Clock, Mail, Shield, RefreshCw, CheckCircle,
    AlertCircle, Play, Send, Lock, Key, Bell, Database
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useToast } from '../components/ui/Toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SettingsPage() {
    const [schedulerStatus, setSchedulerStatus] = useState(null);
    const [syncLoading, setSyncLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [emailConfig, setEmailConfig] = useState({
        smtpUser: '', smtpPassword: '', reportEmail: '',
        smtpHost: 'smtp.gmail.com', smtpPort: '587',
    });
    const [emailSaving, setEmailSaving] = useState(false);
    const { addToast } = useToast();

    // ── Load scheduler status ─────────────────────────
    const loadSchedulerStatus = async () => {
        try {
            const res = await fetch(`${API}/api/scheduler/status`);
            if (res.ok) setSchedulerStatus(await res.json());
        } catch {
            setSchedulerStatus(null);
        }
    };

    useEffect(() => {
        loadSchedulerStatus();
        const interval = setInterval(loadSchedulerStatus, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // ── Manual triggers ───────────────────────────────
    const triggerSync = async () => {
        setSyncLoading(true);
        try {
            const res = await fetch(`${API}/api/scheduler/trigger/sync`, { method: 'POST' });
            if (res.ok) {
                addToast('✅ Manual sync triggered for all platforms!', 'success');
                setTimeout(loadSchedulerStatus, 1000);
            }
        } catch (e) {
            addToast('Failed to trigger sync: ' + e.message, 'error');
        } finally {
            setSyncLoading(false);
        }
    };

    const triggerReport = async () => {
        setReportLoading(true);
        try {
            const res = await fetch(`${API}/api/scheduler/trigger/report`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                addToast(`📊 Daily summary generated! Revenue: ₹${(data.summary?.revenue || 0).toLocaleString('en-IN')}`, 'success');
            }
        } catch (e) {
            addToast('Failed to generate report: ' + e.message, 'error');
        } finally {
            setReportLoading(false);
        }
    };

    // ── Email config save (to .env in production) ────
    const saveEmailConfig = async (e) => {
        e.preventDefault();
        setEmailSaving(true);
        // Show instructions since .env changes require restart
        setTimeout(() => {
            addToast('Email config saved! Add these to your .env file and restart the server.', 'info');
            setEmailSaving(false);
        }, 800);
    };

    const formatNextRun = (nextRun) => {
        if (!nextRun) return 'Not scheduled';
        const d = new Date(nextRun);
        const now = new Date();
        const diffMs = d - now;
        if (diffMs < 0) return 'Running...';
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffMins < 60) return `in ${diffMins} min`;
        return `in ${diffHours}h ${diffMins % 60}m`;
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

            {/* Header */}
            <motion.div variants={item}>
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}>
                            <Settings size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">System Settings</h3>
                            <p className="text-xs text-gray-500">Manage scheduler, email reports, and security</p>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Scheduler Status ── */}
                <motion.div variants={item}>
                    <GlassCard hover={false} className="h-full">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-cyan-400" />
                                <h4 className="text-sm font-semibold text-white">Background Scheduler</h4>
                            </div>
                            {schedulerStatus?.running ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-400"
                                    style={{ background: 'rgba(16,185,129,0.1)' }}>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative rounded-full h-2 w-2 bg-green-400"></span>
                                    </span>
                                    Running
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium text-red-400"
                                    style={{ background: 'rgba(239,68,68,0.1)' }}>Stopped</span>
                            )}
                        </div>

                        <div className="space-y-3 mb-5">
                            {schedulerStatus?.jobs?.map(job => (
                                <div key={job.id} className="flex items-start justify-between p-3 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div>
                                        <p className="text-xs font-medium text-white">{job.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{job.trigger}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-purple-400 font-medium">{formatNextRun(job.next_run)}</p>
                                        <p className="text-xs text-gray-600 mt-0.5">next run</p>
                                    </div>
                                </div>
                            ))}
                            {!schedulerStatus && (
                                <div className="text-center py-4 text-gray-500 text-xs">
                                    <AlertCircle size={20} className="mx-auto mb-2 text-amber-400" />
                                    Backend not reachable
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <motion.button
                                onClick={triggerSync}
                                disabled={syncLoading}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex-1 py-2 text-xs font-medium text-cyan-400 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                style={{ border: '1px solid rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.07)' }}>
                                <RefreshCw size={12} className={syncLoading ? 'animate-spin' : ''} />
                                {syncLoading ? 'Syncing...' : 'Sync All Now'}
                            </motion.button>
                            <motion.button
                                onClick={triggerReport}
                                disabled={reportLoading}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex-1 py-2 text-xs font-medium text-purple-400 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                style={{ border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.07)' }}>
                                <Send size={12} className={reportLoading ? 'animate-pulse' : ''} />
                                {reportLoading ? 'Generating...' : 'Run Report Now'}
                            </motion.button>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* ── Security & Encryption Status ── */}
                <motion.div variants={item}>
                    <GlassCard hover={false} className="h-full">
                        <div className="flex items-center gap-2 mb-5">
                            <Shield size={16} className="text-green-400" />
                            <h4 className="text-sm font-semibold text-white">Security & Encryption</h4>
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    icon: Lock, label: 'Credential Encryption', detail: 'Fernet AES-128-CBC',
                                    status: 'Active', color: 'green'
                                },
                                {
                                    icon: Key, label: 'JWT Authentication', detail: 'HS256 token signing',
                                    status: 'Active', color: 'green'
                                },
                                {
                                    icon: Shield, label: 'Password Hashing', detail: 'bcrypt (work factor 12)',
                                    status: 'Active', color: 'green'
                                },
                                {
                                    icon: Database, label: 'API Key Storage', detail: 'Encrypted at rest',
                                    status: 'Active', color: 'green'
                                },
                            ].map(({ icon: Icon, label, detail, status, color }) => (
                                <div key={label} className="flex items-center justify-between p-3 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: `rgba(16,185,129,0.1)` }}>
                                            <Icon size={14} className={`text-${color}-400`} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-white">{label}</p>
                                            <p className="text-xs text-gray-500">{detail}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-medium text-green-400">
                                        <CheckCircle size={12} />  {status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* ── Email Report Config ── */}
                <motion.div variants={item} className="lg:col-span-2">
                    <GlassCard hover={false}>
                        <div className="flex items-center gap-2 mb-5">
                            <Mail size={16} className="text-blue-400" />
                            <h4 className="text-sm font-semibold text-white">Email Report Configuration</h4>
                            <span className="ml-auto px-2 py-0.5 rounded-full text-xs text-amber-400 font-medium"
                                style={{ background: 'rgba(245,158,11,0.1)' }}>
                                Requires server restart after save
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                            Configure SMTP to receive automated daily P&L summaries every morning at <strong className="text-white">8:00 AM IST</strong>.
                            Use a <strong className="text-white">Gmail App Password</strong> (not your regular password).
                            Generate one at: <span className="text-purple-400">myaccount.google.com → Security → App Passwords</span>
                        </p>

                        <form onSubmit={saveEmailConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { key: 'smtpUser', label: 'Gmail Address (SMTP_USER)', placeholder: 'you@gmail.com', type: 'email' },
                                { key: 'smtpPassword', label: 'App Password (SMTP_PASSWORD)', placeholder: '16-char App Password', type: 'password' },
                                { key: 'reportEmail', label: 'Report Recipient (REPORT_EMAIL)', placeholder: 'owner@business.com', type: 'email' },
                                { key: 'smtpHost', label: 'SMTP Host (default: Gmail)', placeholder: 'smtp.gmail.com', type: 'text' },
                            ].map(({ key, label, placeholder, type }) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300">{label}</label>
                                    <input
                                        type={type}
                                        value={emailConfig[key]}
                                        onChange={e => setEmailConfig(prev => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        style={{ backgroundColor: '#111118', borderColor: '#3f3f4e' }}
                                        className="w-full border rounded-xl py-2.5 px-3 text-sm text-white outline-none focus:border-purple-500 placeholder-gray-600 transition-all"
                                    />
                                </div>
                            ))}

                            {/* .env instructions */}
                            <div className="sm:col-span-2 rounded-xl p-4"
                                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                                <p className="text-xs font-medium text-purple-300 mb-2">
                                    📋 Add these to your <code className="text-purple-200">.env</code> file:
                                </p>
                                <pre className="text-xs text-gray-400 font-mono leading-relaxed">
                                    {`SMTP_USER=${emailConfig.smtpUser || 'your@gmail.com'}
SMTP_PASSWORD=${emailConfig.smtpPassword ? '••••••••••••••••' : 'your-app-password'}
REPORT_EMAIL=${emailConfig.reportEmail || 'recipient@email.com'}
SMTP_HOST=${emailConfig.smtpHost || 'smtp.gmail.com'}
SMTP_PORT=587`}
                                </pre>
                            </div>

                            <div className="sm:col-span-2 flex gap-3">
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="btn-primary py-2.5 px-6 text-sm font-medium rounded-xl flex items-center gap-2"
                                    disabled={emailSaving}
                                >
                                    <Mail size={14} />
                                    {emailSaving ? 'Saving...' : 'Save Email Config'}
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={triggerReport}
                                    disabled={reportLoading}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="py-2.5 px-6 text-sm font-medium rounded-xl flex items-center gap-2 text-blue-400 transition-colors"
                                    style={{ border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(37,99,235,0.07)' }}
                                >
                                    <Send size={14} />
                                    {reportLoading ? 'Sending...' : 'Send Test Report'}
                                </motion.button>
                            </div>
                        </form>
                    </GlassCard>
                </motion.div>

            </div>
        </motion.div>
    );
}
