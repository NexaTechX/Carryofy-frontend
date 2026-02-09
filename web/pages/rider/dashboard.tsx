import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../lib/auth'; // Adjust import based on your auth hook location
import { Loader2, Navigation, Power, Shield, MapPin } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast'; // Adjust import

export default function RiderDashboard() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [isOnline, setIsOnline] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
        if (!isLoading && user && user.role !== 'RIDER' && user.role !== 'ADMIN') {
            router.push('/');
        }
    }, [user, isAuthenticated, isLoading, router]);

    // Socket connection
    useEffect(() => {
        if (isAuthenticated && user) {
            // Connect to the 'location' namespace
            const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/location', {
                extraHeaders: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // Adjust token retrieval
                },
                autoConnect: false,
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [isAuthenticated, user]);

    const toggleOnline = () => {
        if (isOnline) {
            // Go Offline
            setIsOnline(false);
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            socket?.disconnect();
            showSuccessToast('You are now offline');
        } else {
            // Go Online
            if (!navigator.geolocation) {
                showErrorToast('Geolocation is not supported by your browser');
                return;
            }

            socket?.connect();
            setIsOnline(true);
            showSuccessToast('You are now online');

            // Start watching position
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });

                    // Emit location to server
                    if (socket?.connected) {
                        socket.emit('updateRiderLocation', { lat: latitude, lng: longitude });
                    }
                },
                (error) => {
                    console.error('Location error:', error);
                    showErrorToast('Failed to access location');
                    setIsOnline(false); // Force offline on error
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#ff6600]" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black text-white">
            <Head>
                <title>Rider Dashboard | Carryofy</title>
            </Head>

            <nav className="border-b border-[#ff6600]/20 bg-[#1a1a1a] p-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-[#ff6600]">Carryofy Rider</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[#ffcc99]">{user.name}</span>
                        {isOnline ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                Online
                            </span>
                        ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/30">
                                Offline
                            </span>
                        )}
                    </div>
                </div>
            </nav>

            <main className="max-w-md mx-auto p-6 mt-8">
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className={`p-6 rounded-full ${isOnline ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-400'}`}>
                            <Navigation className="w-12 h-12" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            {isOnline ? 'You are Online' : 'You are Offline'}
                        </h2>
                        <p className="text-[#ffcc99]/70 text-sm">
                            {isOnline
                                ? 'Your location is being broadcasted to buyers. Stay safe!'
                                : 'Go online to start receiving delivery requests and broadcasting your location.'}
                        </p>
                    </div>

                    <button
                        onClick={toggleOnline}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${isOnline
                                ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30'
                                : 'bg-[#ff6600] text-black hover:bg-[#cc5200]'
                            }`}
                    >
                        <Power className="w-6 h-6" />
                        {isOnline ? 'Go Offline' : 'Go Online'}
                    </button>

                    {isOnline && location && (
                        <div className="mt-4 p-4 bg-black/40 rounded-xl border border-[#ff6600]/20 text-left">
                            <div className="flex items-center gap-2 text-[#ffcc99] mb-2">
                                <MapPin className="w-4 h-4 text-[#ff6600]" />
                                <span className="text-xs font-mono uppercase tracking-wider">Current Location</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                                <div>
                                    <span className="block text-[#ffcc99]/50 text-xs">Lat</span>
                                    {location.lat.toFixed(6)}
                                </div>
                                <div>
                                    <span className="block text-[#ffcc99]/50 text-xs">Lng</span>
                                    {location.lng.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4 flex items-start gap-4">
                    <Shield className="w-6 h-6 text-[#ff6600] shrink-0" />
                    <div>
                        <h3 className="font-bold text-white mb-1">Safety First</h3>
                        <p className="text-xs text-[#ffcc99]/70">
                            Only use the app when it is safe to do so. Do not interact with the screen while riding.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
