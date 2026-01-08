'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Languages, Mic, Subtitles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface Caption {
    id: string;
    text: string;
    speaker: string;
    speakerId: string;
    timestamp: number;
    isFinal: boolean;
    language?: string;
}

interface CaptionsOverlayProps {
    captions: Caption[];
    isEnabled: boolean;
    currentUserId?: string;
    maxCaptions?: number;
    showSpeaker?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
    position?: 'bottom' | 'top';
    language?: string;
    onLanguageChange?: (language: string) => void;
}

const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
};

export const CaptionsOverlay: React.FC<CaptionsOverlayProps> = ({
    captions,
    isEnabled,
    currentUserId,
    maxCaptions = 3,
    showSpeaker = true,
    fontSize = 'medium',
    position = 'bottom',
    language = 'vi-VN',
    onLanguageChange,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);

    // Filter to show only recent captions
    const recentCaptions = captions
        .filter((c) => Date.now() - c.timestamp < 10000) // Last 10 seconds
        .slice(-maxCaptions);

    // Auto-scroll to latest caption
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [recentCaptions]);

    const supportedLanguages = [
        { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'en-US', name: 'English', flag: '🇺🇸' },
        { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
        { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
        { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
    ];

    const currentLanguage = supportedLanguages.find((l) => l.code === language);

    if (!isEnabled) return null;

    return (
        <div
            className={`absolute left-0 right-0 z-40 px-4 ${position === 'bottom' ? 'bottom-24' : 'top-4'
                }`}
        >
            {/* Language selector (if enabled) */}
            {onLanguageChange && (
                <div className="flex justify-center mb-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-800/80 text-white text-sm rounded-full hover:bg-gray-700/80 transition-colors"
                        >
                            <Languages size={14} />
                            <span>{currentLanguage?.flag}</span>
                            <span>{currentLanguage?.name}</span>
                        </button>

                        <AnimatePresence>
                            {showLanguageMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                                >
                                    {supportedLanguages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                onLanguageChange(lang.code);
                                                setShowLanguageMenu(false);
                                            }}
                                            className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${language === lang.code ? 'bg-blue-600' : ''
                                                }`}
                                        >
                                            <span>{lang.flag}</span>
                                            <span className="text-white">{lang.name}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Captions container */}
            <div
                ref={containerRef}
                className="flex flex-col items-center gap-1 max-h-32 overflow-y-auto scrollbar-hide"
            >
                <AnimatePresence mode="popLayout">
                    {recentCaptions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            className="flex items-center gap-2 text-gray-400 text-sm"
                        >
                            <Subtitles size={16} />
                            <span>Captions enabled - waiting for speech...</span>
                        </motion.div>
                    ) : (
                        recentCaptions.map((caption) => (
                            <motion.div
                                key={caption.id}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className={`max-w-3xl ${fontSizeClasses[fontSize]}`}
                            >
                                <div
                                    className={`inline-flex items-start gap-2 px-4 py-2 rounded-lg backdrop-blur-sm ${caption.isFinal
                                            ? 'bg-black/70 text-white'
                                            : 'bg-black/50 text-gray-200 italic'
                                        }`}
                                >
                                    {/* Speaking indicator */}
                                    {!caption.isFinal && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                        >
                                            <Mic size={14} className="text-green-400 mt-1" />
                                        </motion.div>
                                    )}

                                    <div className="flex flex-col">
                                        {/* Speaker name */}
                                        {showSpeaker && (
                                            <span
                                                className={`text-xs font-semibold ${caption.speakerId === currentUserId
                                                        ? 'text-blue-400'
                                                        : 'text-yellow-400'
                                                    }`}
                                            >
                                                {caption.speakerId === currentUserId
                                                    ? 'You'
                                                    : caption.speaker}
                                            </span>
                                        )}

                                        {/* Caption text */}
                                        <span className="leading-relaxed">{caption.text}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Caption status indicator */}
            <div className="flex justify-center mt-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded-full text-xs text-gray-300">
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                    />
                    <span>Live Captions</span>
                </div>
            </div>
        </div>
    );
};

// Caption toggle button component
interface CaptionToggleButtonProps {
    isEnabled: boolean;
    onToggle: () => void;
    isListening?: boolean;
}

export const CaptionToggleButton: React.FC<CaptionToggleButtonProps> = ({
    isEnabled,
    onToggle,
    isListening = false,
}) => {
    return (
        <button
            onClick={onToggle}
            className={`relative p-3 rounded-full transition-all ${isEnabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            title={isEnabled ? 'Disable captions' : 'Enable captions'}
        >
            <Subtitles size={20} />

            {/* Listening indicator */}
            {isEnabled && isListening && (
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                />
            )}
        </button>
    );
};

export default CaptionsOverlay;
