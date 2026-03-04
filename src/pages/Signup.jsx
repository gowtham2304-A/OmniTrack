import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const API = 'http://localhost:8000';

const plans = [
    { id: 'free', label: 'Free', desc: 'Up to 3 platforms · 1K orders/mo', color: '#5a5a6e' },
    { id: 'pro', label: 'Pro', desc: 'All platforms · Unlimited · Email reports', color: '#7c3aed' },
    { id: 'enterprise', label: 'Enterprise', desc: 'Custom limits · Dedicated support', color: '#06b6d4' },
];

export default function Signup() {
    const [form, setForm] = useState({ name: '', email: '', password: '', plan: 'free' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1=details, 2=plan
    const navigate = useNavigate();
    const { addToast } = useToast();

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleNext = (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) {
            addToast('Please fill all fields', 'error'); return;
        }
        if (form.password.length < 8) {
            addToast('Password must be at least 8 characters', 'error'); return;
        }
        setStep(2);
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Registration failed');

            // Store token same as login
            localStorage.setItem('sellerverse_auth', JSON.stringify({
                token: data.access_token,
                user: data.user,
                loginTime: Date.now(),
            }));

            addToast(`Welcome to SellerVerse, ${data.user.name}! 🎉`, 'success');
            navigate('/');
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, #0a0a0f 60%)' }}>

            {/* Glow orbs */}
            <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.6) 0%, transparent 70%)' }} />
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)' }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))', border: '1px solid rgba(124,58,237,0.4)' }}>
                        <Zap size={26} className="text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create your account</h1>
                    <p className="text-sm text-gray-500 mt-1">Join SellerVerse — the universal D2C dashboard</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {[1, 2].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'text-white' : 'text-gray-600'}`}
                                style={{ background: step >= s ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : 'rgba(255,255,255,0.06)' }}>
                                {step > s ? <CheckCircle size={14} /> : s}
                            </div>
                            <span className={`text-xs ${step >= s ? 'text-white' : 'text-gray-600'}`}>
                                {s === 1 ? 'Your Details' : 'Choose Plan'}
                            </span>
                            {s < 2 && <div className="w-8 h-px bg-gray-700" />}
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl p-8"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

                    <AnimatePresence mode="wait">
                        {/* Step 1 — Details */}
                        {step === 1 && (
                            <motion.form key="step1"
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleNext} className="space-y-4">

                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300">Full Name</label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input type="text" placeholder="Alex Johnson" value={form.name}
                                            onChange={e => set('name', e.target.value)} required
                                            style={{ backgroundColor: '#0d0d14', borderColor: form.name ? '#7c3aed66' : '#3f3f4e' }}
                                            className="w-full border rounded-xl py-3 pl-9 pr-4 text-sm text-white outline-none focus:border-purple-500 placeholder-gray-600 transition-all" />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300">Email Address</label>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input type="email" placeholder="you@business.com" value={form.email}
                                            onChange={e => set('email', e.target.value)} required
                                            style={{ backgroundColor: '#0d0d14', borderColor: form.email ? '#7c3aed66' : '#3f3f4e' }}
                                            className="w-full border rounded-xl py-3 pl-9 pr-4 text-sm text-white outline-none focus:border-purple-500 placeholder-gray-600 transition-all" />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300">Password</label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                                            value={form.password} onChange={e => set('password', e.target.value)} required
                                            style={{ backgroundColor: '#0d0d14', borderColor: form.password ? '#7c3aed66' : '#3f3f4e' }}
                                            className="w-full border rounded-xl py-3 pl-9 pr-10 text-sm text-white outline-none focus:border-purple-500 placeholder-gray-600 transition-all" />
                                        <button type="button" onClick={() => setShowPass(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    {/* Password strength bar */}
                                    {form.password && (
                                        <div className="flex gap-1 mt-1.5">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="flex-1 h-1 rounded-full transition-all"
                                                    style={{ background: form.password.length >= i * 3 ? (form.password.length >= 12 ? '#10b981' : '#f59e0b') : '#3f3f4e' }} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-2"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                                    Continue <ArrowRight size={14} />
                                </motion.button>
                            </motion.form>
                        )}

                        {/* Step 2 — Plan */}
                        {step === 2 && (
                            <motion.div key="step2"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="space-y-4">
                                <h3 className="text-sm font-semibold text-white">Choose your plan</h3>
                                <div className="space-y-3">
                                    {plans.map(plan => (
                                        <motion.label key={plan.id} whileHover={{ scale: 1.01 }}
                                            className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                                            style={{
                                                background: form.plan === plan.id ? `${plan.color}15` : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${form.plan === plan.id ? plan.color + '50' : 'rgba(255,255,255,0.06)'}`,
                                            }}>
                                            <input type="radio" name="plan" value={plan.id} checked={form.plan === plan.id}
                                                onChange={() => set('plan', plan.id)} className="sr-only" />
                                            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                                style={{ borderColor: form.plan === plan.id ? plan.color : '#5a5a6e' }}>
                                                {form.plan === plan.id && <div className="w-2 h-2 rounded-full" style={{ background: plan.color }} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{plan.label}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{plan.desc}</p>
                                            </div>
                                        </motion.label>
                                    ))}
                                </div>

                                <div className="flex gap-3 mt-2">
                                    <motion.button onClick={() => setStep(1)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 transition-colors"
                                        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                                        Back
                                    </motion.button>
                                    <motion.button onClick={handleRegister} disabled={loading}
                                        whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                                        style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', opacity: loading ? 0.7 : 1 }}>
                                        {loading ? (
                                            <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Creating...</>
                                        ) : (
                                            <><Zap size={14} /> Create Account</>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center text-xs text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
