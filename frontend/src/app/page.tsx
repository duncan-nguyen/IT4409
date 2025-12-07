'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, LogIn, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
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
      console.log('✅ Room created:', data.roomId);
      
      router.push(`/room/${data.roomId}`);
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    } else {
      setError('Please enter a valid room ID');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-primary/20 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full ring-4 ring-primary/20">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CNWeb
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Video Streaming with AI Filters
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={createRoom}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Room...
              </>
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                Create New Room
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              onClick={joinRoom}
              size="lg"
              variant="secondary"
              className="w-full"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Join Room
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-2">Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✨ Real-time AI filters</li>
              <li>🎭 Face detection & effects</li>
              <li>🎥 HD video streaming</li>
              <li>🔒 Secure peer-to-peer connection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
