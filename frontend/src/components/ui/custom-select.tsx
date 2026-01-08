'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: ReactNode;
    accentColor?: 'blue' | 'purple' | 'pink';
}

const accentColors = {
    blue: {
        ring: 'focus-within:ring-neon-blue/30 focus-within:border-neon-blue/50',
        glow: 'focus-within:shadow-[0_0_20px_rgba(0,243,255,0.2)]',
        icon: 'text-neon-blue',
        check: 'text-neon-blue',
        hover: 'hover:bg-neon-blue/10',
        selected: 'bg-neon-blue/20',
    },
    purple: {
        ring: 'focus-within:ring-neon-purple/30 focus-within:border-neon-purple/50',
        glow: 'focus-within:shadow-[0_0_20px_rgba(188,19,254,0.2)]',
        icon: 'text-neon-purple',
        check: 'text-neon-purple',
        hover: 'hover:bg-neon-purple/10',
        selected: 'bg-neon-purple/20',
    },
    pink: {
        ring: 'focus-within:ring-[#ff0080]/30 focus-within:border-[#ff0080]/50',
        glow: 'focus-within:shadow-[0_0_20px_rgba(255,0,128,0.2)]',
        icon: 'text-[#ff0080]',
        check: 'text-[#ff0080]',
        hover: 'hover:bg-[#ff0080]/10',
        selected: 'bg-[#ff0080]/20',
    },
};

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    icon,
    accentColor = 'blue',
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const colors = accentColors[accentColor];

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full h-12 flex items-center justify-between gap-3
                    bg-gradient-to-r from-white/[0.08] to-white/[0.03]
                    backdrop-blur-sm border border-white/10 rounded-xl
                    px-4 text-sm text-white
                    transition-all duration-300
                    hover:bg-white/10 hover:border-white/20
                    focus:outline-none focus-within:ring-2
                    ${colors.ring} ${colors.glow}
                    ${isOpen ? 'ring-2 ' + colors.ring : ''}
                `}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {icon && <span className={`flex-shrink-0 ${colors.icon}`}>{icon}</span>}
                    <span className={`truncate ${selectedOption ? 'text-white' : 'text-gray-500'}`}>
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${colors.icon} ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={`
                            absolute z-50 w-full mt-2
                            bg-[#0c0c1d]/95 backdrop-blur-xl
                            border border-white/10 rounded-xl
                            shadow-2xl shadow-black/50
                            overflow-hidden
                        `}
                    >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                                            transition-all duration-150
                                            ${isSelected ? colors.selected + ' text-white' : 'text-gray-300 ' + colors.hover}
                                        `}
                                    >
                                        <span className="flex-1 truncate">{option.label}</span>
                                        {isSelected && <Check className={`w-4 h-4 flex-shrink-0 ${colors.check}`} />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
