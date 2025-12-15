'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Globe, Loader2, LogIn, Shield, Sparkles, Video, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async () => {
    try {
      setLoading(true);
      setError('');

      const startTime = performance.now();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Room ${new Date().toLocaleTimeString()}`,
        }),
      });

      const apiTime = performance.now() - startTime;
      console.log(`⏱️ API call took: ${apiTime.toFixed(0)}ms`);

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      console.log(' Room created:', data.roomId);

      router.push(`/room/${data.roomId}?username=${encodeURIComponent(username)}`);
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (roomId.trim() && username.trim()) {
      router.push(`/room/${roomId.trim()}?username=${encodeURIComponent(username.trim())}`);
    } else {
      setError('Please enter both Room ID and your name');
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-cosmic-900 text-white selection:bg-neon-blue/30">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-neon-blue/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-neon-purple/10 blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute bottom-0 left-[20%] w-[50%] h-[50%] rounded-full bg-cosmic-700/20 blur-[100px] animate-pulse-slow delay-2000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 min-h-screen flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
              </span>
              <span className="text-sm font-medium text-gray-300">Next-Gen Video Calling</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              Connect Beyond <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple text-glow">
                Boundaries
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-lg leading-relaxed">
              Experience crystal clear video, immersive AI filters, and secure peer-to-peer connection. The future of communication is here.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <Shield className="w-5 h-5 text-neon-blue" />
                <span className="text-sm font-medium">E2E Encrypted</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <Zap className="w-5 h-5 text-neon-purple" />
                <span className="text-sm font-medium">Low Latency</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <Globe className="w-5 h-5 text-neon-pink" />
                <span className="text-sm font-medium">Global Edge</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex justify-center lg:justify-end"
          >
            <Card className="w-full max-w-md relative overflow-hidden border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              {/* Card Glow Effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-blue/20 blur-[50px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neon-purple/20 blur-[50px] rounded-full pointer-events-none" />

              <CardHeader className="text-center space-y-2 relative z-10">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple p-[1px] mb-4 shadow-lg shadow-neon-blue/20">
                  <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold">Get Started</CardTitle>
                <CardDescription className="text-gray-400">
                  Create a new room or join an existing one
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 relative z-10">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Display Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
                    />
                  </div>

                  <Button
                    onClick={createRoom}
                    disabled={loading || !username.trim()}
                    size="lg"
                    variant="cosmic"
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-neon-purple/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Space...
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 mr-2" />
                        Create New Space
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0a0a1f] px-2 text-gray-500">Or join existing</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Room ID</label>
                    <input
                      type="text"
                      placeholder="Enter Room ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
                    />
                  </div>
                  <Button
                    onClick={joinRoom}
                    size="lg"
                    variant="glass"
                    className="w-full h-12 text-base font-semibold border border-white/10 hover:border-white/20 hover:bg-white/10"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Join Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
