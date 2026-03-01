'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../../lib/api/client';
import { tokenManager } from '../../lib/auth/token';

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        // If user is logged in, sync with backend
        if (tokenManager.getAccessToken()) {
            try {
                await apiClient.put('/users/me', { themePreference: newTheme });
            } catch (error) {
                console.error('Failed to sync theme preference with backend:', error);
            }
        }
    };

    if (!mounted) {
        return (
            <div className="p-2 h-10 w-10 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-primary/20" />
            </div>
        );
    }

    const isDark = theme === 'dark';

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-card border border-border-custom text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 flex items-center justify-center group"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
            ) : (
                <Moon className="w-5 h-5 text-primary group-hover:-rotate-12 transition-transform" />
            )}
        </motion.button>
    );
}
