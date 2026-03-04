import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
    '/': { title: 'Overview', subtitle: 'Your business at a glance' },
    '/platforms': { title: 'Platforms', subtitle: 'Performance across all channels' },
    '/products': { title: 'Products', subtitle: 'Product-level analytics' },
    '/pnl': { title: 'Profit & Loss', subtitle: 'Financial breakdown' },
    '/stock': { title: 'Stock Management', subtitle: 'Inventory health monitor' },
    '/orders': { title: 'Orders', subtitle: 'All orders across platforms' },
    '/upload': { title: 'CSV Upload', subtitle: 'Import your data' },
};

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { title, subtitle } = pageTitles[location.pathname] || { title: 'Dashboard', subtitle: '' };

    return (
        <div className="flex min-h-screen">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <motion.main
                className="flex-1 min-h-screen"
                animate={{
                    marginLeft: collapsed ? 72 : 260,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <Header title={title} subtitle={subtitle} collapsed={collapsed} setCollapsed={setCollapsed} />

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.main>
        </div>
    );
}
