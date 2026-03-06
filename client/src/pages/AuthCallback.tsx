import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
    const navigate = useNavigate();
    const { completeOAuth } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (accessToken && refreshToken) {
            completeOAuth(accessToken, refreshToken)
                .then(() => {
                    navigate('/', { replace: true });
                })
                .catch((err) => {
                    console.error("AuthCallback Error:", err);
                    navigate('/login', { replace: true });
                });
        } else {
            navigate('/login', { replace: true });
        }
    }, [navigate, completeOAuth]);

    return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-lg font-medium">Connecting to GitHub...</p>
            </div>
        </div>
    );
}
