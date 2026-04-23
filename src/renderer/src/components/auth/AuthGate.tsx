import React, { useState } from 'react';
import { AuthManager, useSupabaseAuth } from '@dopomogai/supabase-client/react';
import { transferVisitorOwnership } from '../../api/api';
import { useCanvasStore } from '../../store/useCanvasStore';

// We map events locally via event listeners
export const AuthTriggerButton: React.FC = () => {
    const { user } = useSupabaseAuth();
    
    if (user) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface_container_highest border border-outline_variant/30 text-xs font-medium text-primary">
                {user.email?.split('@')[0]}
            </div>
        );
    }
    
    return (
        <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
            className="text-on_surface_variant hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-surface_container_highest text-sm font-medium border border-outline_variant/30"
            title="Log in for sync"
        >
            Log In
        </button>
    );
};

export const AuthModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useSupabaseAuth();
    const visitorId = useCanvasStore(state => state.visitorId);

    // Subscribe to open event
    React.useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-login-modal', handleOpen);
        return () => window.removeEventListener('open-login-modal', handleOpen);
    }, []);

    // Effect to run on auth change
    React.useEffect(() => {
        if (user && isOpen) {
            console.log('User logged in, transferring visitor data...');
            // Ownership transfer mock trigger
            if (visitorId) {
                transferVisitorOwnership(visitorId, user.id).then(() => {
                    console.log('Visitor -> User ownership transfer complete');
                    setIsOpen(false);
                });
            } else {
                setIsOpen(false);
            }
        }
    }, [user, isOpen, visitorId]);

    if (!isOpen || user) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className="bg-surface_container_highest border border-white/10 rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Log In</h3>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="text-on_surface_variant hover:text-white"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <AuthManager />
                </div>
            </div>
        </div>
    );
};
