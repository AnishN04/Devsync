import React from 'react';
import { cn } from '../utils/helpers';

interface AvatarProps {
    name?: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name = 'User', src, size = 'md', className }) => {
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const getColor = (name: string) => {
        const colors = [
            'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            'bg-violet-500/20 text-violet-400 border-violet-500/30',
            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'bg-amber-500/20 text-amber-400 border-amber-500/30',
            'bg-rose-500/20 text-rose-400 border-rose-500/30',
            'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm',
        xl: 'w-12 h-12 text-base',
    };

    if (src && !src.includes('pravatar.cc')) {
        return (
            <img
                src={src}
                alt={name}
                className={cn(
                    'rounded-full object-cover border border-white/20',
                    sizeClasses[size],
                    className
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-bold border shrink-0',
                getColor(name),
                sizeClasses[size],
                className
            )}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;
