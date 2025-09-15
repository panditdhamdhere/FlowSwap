import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePairData } from './hooks/usePairData';
import { useBalances } from './hooks/useBalances';
import { addLiquidity, swapAForB, getQuote, removeLiquidityPercent, mintTestToken, mintTestToken2 } from './transactions';
import { useTheme } from './contexts/ThemeContext';
import * as fcl from '@onflow/fcl';

// Theme Toggle Component
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button 
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isDark ? (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
      <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </motion.button>
  );
};

// Connect Wallet Component
const Connect: React.FC = () => {
  const [user, setUser] = useState<{ loggedIn: boolean; addr: string | null }>({ loggedIn: false, addr: null });

  useEffect(() => {
    fcl.currentUser.subscribe((user: any) => {
      setUser({
        loggedIn: user.loggedIn || false,
        addr: user.addr || null
      });
    });
  }, []);

  const handleConnect = async () => {
    if (user.loggedIn) {
      fcl.unauthenticate();
    } else {
      fcl.authenticate();
    }
  };

  return (
          <motion.button 
      onClick={handleConnect}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
      whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
    >
      {user.loggedIn ? (
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          {user.addr ? `${user.addr.slice(0, 6)}...${user.addr.slice(-4)}` : 'Connected'}
        </span>
      ) : (
        'Connect Wallet'
      )}
    </motion.button>
  );
};

// Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
      <motion.div 
    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
    {children}
          </motion.div>
);

// Input Component
const Input: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  token?: string;
  className?: string;
}> = ({ value, onChange, placeholder, label, token, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
    )}
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-16 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
      />
      {token && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {token}
          </span>
        </div>
      )}
    </div>
  </div>
);

// Button Component
const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}> = ({ onClick, children, variant = 'primary', disabled = false, loading = false, className = '' }) => {
  const baseClasses = "px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = variant === 'primary' 
    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl" 
    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";

  return (
    <motion.button 
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses} ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

// Pool Info Component
const PoolInfo: React.FC<{ pairData: any }> = ({ pairData }) => (
  <Card className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Pool Information</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {pairData?.reserveA?.toLocaleString() || '0.00'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">FLOW</div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          ${pairData?.priceA?.toFixed(4) || '0.0000'}
        </div>
      </div>
      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {pairData?.reserveB?.toLocaleString() || '0.00'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">USDC</div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          ${pairData?.priceB?.toFixed(4) || '0.0000'}
        </div>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Total Liquidity:</span>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            ${pairData?.liquidity?.toLocaleString() || '0.00'}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">24h Volume:</span>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            ${pairData?.volume24h?.toLocaleString() || '0.00'}
          </div>
        </div>
      </div>
      </div>
    </Card>
);

// Swap Interface Component
const SwapInterface: React.FC<{ onSwap: (amountIn: number, minAmountOut: number) => void; flowBalance?: number }> = ({ onSwap, flowBalance = 0 }) => {
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [quote, setQuote] = useState<number>(0);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [priceImpact, setPriceImpact] = useState<number>(0);

  useEffect(() => {
    const run = async () => {
      const amt = parseFloat(amountIn);
      if (!amt || amt <= 0) { setQuote(0); return; }
      setLoadingQuote(true);
      try {
        const q = await getQuote(amt, 'AtoB');
        const qNum = Number(q) || 0;
        setQuote(qNum);
        const minRecv = qNum * (1 - slippage/100);
        const impact = qNum > 0 ? (1 - (minRecv / qNum)) * 100 : 0;
        setPriceImpact(Math.max(0, impact));
      } catch {
        setQuote(0);
        setPriceImpact(0);
      } finally {
        setLoadingQuote(false);
      }
    };
    run();
  }, [amountIn]);

  const minReceived = quote * (1 - slippage / 100);

  const handleSwap = () => {
    const amtIn = parseFloat(amountIn) || 0;
    const minOut = minReceived > 0 ? minReceived : 0;
    onSwap(amtIn, minOut);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Swap Tokens</h3>
        <div className="space-y-4">
          <Input
          value={amountIn}
          onChange={setAmountIn}
          placeholder="0.0"
            label="From"
          token="FLOW"
        />
        <div className="flex justify-between items-center -mt-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Balance: {flowBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} FLOW</span>
          <button
            type="button"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setAmountIn(String(flowBalance || 0))}
          >
            Max
          </button>
        </div>
        <div className="flex justify-center">
          <motion.div 
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </motion.div>
        </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
            <div className="relative">
              <input
            type="number"
                value={(loadingQuote ? 0 : quote).toFixed(6)}
                readOnly
            placeholder="0.0"
                className="w-full px-4 py-3 pr-16 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">USDC</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Min received ({slippage.toFixed(1)}%): <span className="font-semibold">{minReceived > 0 ? minReceived.toFixed(6) : '0.000000'} USDC</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Price impact: <span className={`font-semibold ${priceImpact > 5 ? 'text-red-500' : ''}`}>{priceImpact.toFixed(2)}%</span>
        </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Route: FLOW → USDC
            </div>
          </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slippage (%)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          </div>
        <Button onClick={handleSwap} className="w-full">
          Swap Tokens
        </Button>
        </div>
    </Card>
  );
};

// Liquidity Interface Component
const LiquidityInterface: React.FC<{ onLiquidity: (amountA: number, amountB: number) => void }> = ({ onLiquidity }) => {
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  const handleLiquidity = () => {
    const numAmountA = parseFloat(amountA) || 0;
    const numAmountB = parseFloat(amountB) || 0;
    onLiquidity(numAmountA, numAmountB);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Add Liquidity</h3>
              <div className="space-y-4">
                <Input
          value={amountA}
          onChange={setAmountA}
                  placeholder="0.0"
          label="FLOW Amount"
          token="FLOW"
                />
                <Input
          value={amountB}
          onChange={setAmountB}
                  placeholder="0.0"
          label="USDC Amount"
          token="USDC"
        />
        <Button onClick={handleLiquidity} className="w-full">
          Add Liquidity
            </Button>
      </div>
    </Card>
  );
};

// Remove Liquidity Component (UI only for now)
const RemoveLiquidityInterface: React.FC<{ onRemove: (percent: number) => void }> = ({ onRemove }) => {
  const [percent, setPercent] = useState<number>(25);

  const handleRemove = () => {
    onRemove(percent);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Remove Liquidity</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Percentage</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={percent}
            onChange={(e) => setPercent(parseInt(e.target.value) || 0)}
            className="w-full"
          />
          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{percent}%</div>
        </div>
        <Button onClick={handleRemove} className="w-full">
          Remove Liquidity
        </Button>
      </div>
    </Card>
  );
};

// Faucet Component
const Faucet: React.FC<{ onMint: (token: 'FLOW' | 'USDC') => void }> = ({ onMint }) => (
  <Card>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Test Token Faucet</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Get test tokens to try the DEX
    </p>
    <div className="space-y-3">
      <Button 
        onClick={() => onMint('FLOW')} 
        className="w-full"
        variant="secondary"
      >
        Mint 1000 FLOW
      </Button>
      <Button 
        onClick={() => onMint('USDC')} 
        className="w-full"
        variant="secondary"
      >
        Mint 1000 USDC
      </Button>
    </div>
  </Card>
);

// User Balances Component
const UserBalances: React.FC<{ balances: any }> = ({ balances }) => (
  <Card>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Your Balances</h3>
    <div className="space-y-3">
      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">F</span>
          </div>
          <span className="text-gray-600 dark:text-gray-400">FLOW</span>
        </div>
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {balances?.flow || '0.00'}
        </span>
      </div>
      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">$</span>
          </div>
          <span className="text-gray-600 dark:text-gray-400">USDC</span>
        </div>
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {balances?.usdc || '0.00'}
        </span>
      </div>
    </div>
  </Card>
);

// Floating Elements Component
const FloatingElements: React.FC = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
        className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
          y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
);

// Main App Component
const App: React.FC = () => {
  const { pairData } = usePairData();
  const { balances } = useBalances();
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'remove'>('swap');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSwap = async (amountA: number, amountB: number) => {
    try {
      console.log('Swapping A→B:', { amountIn: amountA, minAmountOut: amountB });
      const txId = await swapAForB(amountA, amountB);
      setToast({ type: 'success', message: `Swap submitted: ${String(txId).slice(0, 8)}...` });
    } catch (error) {
      console.error('Swap failed:', error);
      setToast({ type: 'error', message: 'Swap failed' });
    }
  };

  const handleLiquidity = async (amountA: number, amountB: number) => {
    try {
      console.log('Adding liquidity:', { amountA, amountB });
      await addLiquidity(amountA, amountB);
      setToast({ type: 'success', message: `Liquidity added!` });
    } catch (error) {
      console.error('Add liquidity failed:', error);
      setToast({ type: 'error', message: 'Add liquidity failed' });
    }
  };

  const handleMint = async (token: 'FLOW' | 'USDC') => {
    try {
      console.log('Minting token:', token);
      await (token === 'FLOW' 
        ? mintTestToken(1000)
        : mintTestToken2(1000));
      setToast({ type: 'success', message: `Minted 1000 ${token}!` });
    } catch (error) {
      console.error('Mint failed:', error);
      setToast({ type: 'error', message: `Mint ${token} failed` });
    }
  };

  const handleRemoveLiquidity = async (percent: number) => {
    try {
      console.log('Remove liquidity:', { percent });
      const txId = await removeLiquidityPercent(percent);
      setToast({ type: 'success', message: `Remove submitted: ${String(txId).slice(0, 8)}...` });
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      setToast({ type: 'error', message: 'Remove liquidity failed' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <FloatingElements />
      
      {/* Header */}
        <motion.header 
        className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <motion.div
              className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">FlowDEX</h1>
          </motion.div>
            
            <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Connect />
          </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toast && (
          <div className={`fixed right-4 top-20 z-50 px-4 py-3 rounded-xl shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
               onAnimationEnd={() => setTimeout(() => setToast(null), 3000)}>
            {toast.message}
          </div>
        )}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Decentralized Exchange
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Trade tokens, provide liquidity, and earn rewards on the Flow blockchain
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Pool Info */}
                <div className="lg:col-span-1">
                  <PoolInfo pairData={pairData} />
                  <Faucet onMint={handleMint} />
                  <UserBalances balances={balances} />
                </div>

          {/* Right Column - Trading Interface */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('swap')}
                  className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                    activeTab === 'swap'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Swap
                </button>
                <button
                  onClick={() => setActiveTab('liquidity')}
                  className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                    activeTab === 'liquidity'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Liquidity
                </button>
                <button
                  onClick={() => setActiveTab('remove')}
                  className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                    activeTab === 'remove'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Remove
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'swap' ? (
                    <motion.div
                      key="swap"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SwapInterface onSwap={handleSwap} flowBalance={Number((balances?.flow || '0').toString().replace(/,/g, ''))} />
                    </motion.div>
                  ) : activeTab === 'liquidity' ? (
                    <motion.div
                      key="liquidity"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <LiquidityInterface onLiquidity={handleLiquidity} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="remove"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <RemoveLiquidityInterface onRemove={handleRemoveLiquidity} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
      </div>
      </main>
    </div>
  );
};

export default App;