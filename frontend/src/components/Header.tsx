import React from 'react';
import { Zap, User } from 'lucide-react';
import { useCallContext } from '../context/CallContext';

const Header: React.FC = () => {
  const { userId } = useCallContext();

  return (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-emerald-400 flex items-center">
        <Zap className="w-8 h-8 mr-2 fill-emerald-400" />
        SnapCam Bridge
      </h1>
      <div className="text-sm bg-gray-700 py-1 px-3 rounded-full flex items-center opacity-70">
        <User className="w-4 h-4 mr-1" /> {userId}
      </div>
    </header>
  );
};

export default Header;
