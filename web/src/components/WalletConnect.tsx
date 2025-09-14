import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';

export const WalletConnect: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  const handleLogIn = () => {
    fcl.authenticate();
  };

  const handleLogOut = () => {
    fcl.unauthenticate();
  };

  if (user?.loggedIn) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user.addr}
        </span>
        <button
          onClick={handleLogOut}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogIn}
      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      Connect Wallet
    </button>
  );
};
