import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const InviteLanding: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { isAuthenticated, user, isLoading: authLoading, updateTokens } = useAuth();
    const navigate = useNavigate();
    const [invite, setInvite] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInviteDetails = async () => {
            try {
                const res = await api.get(`/auth/invite-details/${token}`);
                setInvite(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Invalid or expired invitation link');
            } finally {
                setLoading(false);
            }
        };
        fetchInviteDetails();

        // Proactively set redirect path if not authenticated
        if (!isAuthenticated) {
            localStorage.setItem('redirectAfterAuth', `/invitations/accept/${token}`);
        }
    }, [token, isAuthenticated]);

    // Auto-accept if already authenticated and invite details are loaded
    useEffect(() => {
        if (isAuthenticated && invite && !accepting && !error) {
            handleAccept();
        }
    }, [isAuthenticated, invite]);

    const handleAccept = async () => {
        if (!isAuthenticated) {
            // Save current path to return after login via query param
            const redirectUrl = `/login?redirect=${encodeURIComponent(`/invitations/accept/${token}`)}`;
            navigate(redirectUrl);
            return;
        }

        setAccepting(true);
        try {
            const res = await api.post(`/auth/accept-invite`, { token });
            // Sync with new tokens that contain updated role/org_id
            if (res.data.accessToken && res.data.refreshToken) {
                await updateTokens(res.data.accessToken, res.data.refreshToken);
            }
            toast.success(`Welcome to ${invite.org_name}!`);
            navigate(`/`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to accept invitation');
        } finally {
            setAccepting(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
                <div className="max-w-md w-full glass-card p-10 text-center animate-in fade-in zoom-in-95">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <XCircle className="text-rose-400" size={40} />
                    </div>
                    <h1 className="text-2xl font-heading font-black text-white mb-2">Invitation Error</h1>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-white/10"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-card p-10 text-center relative overflow-hidden animate-in fade-in zoom-in-95">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-50" />

                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Mail className="text-indigo-400" size={40} />
                </div>

                <h1 className="text-2xl font-heading font-black text-white mb-2">Organization Invitation</h1>
                <p className="text-slate-400 mb-8">
                    You've been invited to join <span className="text-indigo-400 font-bold">{invite?.org_name}</span> as a <span className="text-white font-bold">{invite?.role}</span>.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full btn-primary py-4 flex items-center justify-center gap-2 group"
                    >
                        {accepting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Accepting Invitation...
                            </>
                        ) : (
                            <>
                                {isAuthenticated ? 'Accept Invitation' : 'Login to Accept'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 text-slate-500 hover:text-white font-bold text-sm transition-colors"
                    >
                        Decline
                    </button>
                </div>

                {isAuthenticated && user?.email !== invite.email && (
                    <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                        <p className="text-[11px] text-amber-500/80 leading-relaxed font-bold uppercase tracking-wider">
                            Notice: This invite was sent to {invite.email}, but you are logged in as {user?.email}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InviteLanding;
