import React from 'react';
import Header from '../components/Header';
import VideoPanel from '../components/VideoPanel';
import Controls from '../components/Controls';

const Home: React.FC = () => {
  return (
  <div className="min-h-screen w-full bg-gray-900 text-white font-sans flex flex-col p-4 sm:p-8">
      <Header />

      <main className="flex flex-1 flex-col lg:flex-row gap-6">
        <VideoPanel title="Local Feed (Your Output)" isRemote={false} />
        <VideoPanel title="Remote Peer (Received)" isRemote={true} />
      </main>

      <Controls />

      {/* <div className="mt-6 text-center text-gray-500 text-sm p-3 bg-gray-800 rounded-lg" /> */}
    </div>
  );
};

export default Home;
