import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePairData } from './hooks/usePairData';
import { useBalances } from './hooks/useBalances';
import { addLiquidity, swapAForB, swapBForA, getQuote, removeLiquidityPercent, mintTestToken, mintTestToken2, seedLiquidity, hasLiquidity } from './transactions';
import { useTheme } from './contexts/ThemeContext';
import { Logo } from './components/Logo';
import * as fcl from '@onflow/fcl';
import { useAppStore } from './store';

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
  const [isConnecting, setIsConnecting] = useState(false);
  const setUserAddress = useAppStore((s) => s.setUserAddress);

  useEffect(() => {
    fcl.currentUser.subscribe((user: any) => {
      setUser({
        loggedIn: user.loggedIn || false,
        addr: user.addr || null
      });
      // Keep global store in sync for balances and other hooks
      setUserAddress(user.addr || null);
    });
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (user.loggedIn) {
        fcl.unauthenticate();
        setUserAddress(null);
      } else {
        // Add timeout to prevent hanging
        const authPromise = fcl.authenticate();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        );
        await Promise.race([authPromise, timeoutPromise]);
        // After successful auth, fetch current user and update store
        const current = await fcl.currentUser.snapshot();
        setUserAddress(current?.addr || null);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      // Show user-friendly error message
      if (error instanceof Error && error.message === 'Connection timeout') {
        alert('Wallet connection timed out. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
          <motion.button 
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: isConnecting ? 1 : 1.05, y: isConnecting ? 0 : -2 }}
      whileTap={{ scale: isConnecting ? 1 : 0.95 }}
    >
      {isConnecting ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </div>
      ) : user.loggedIn ? (
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
const PoolInfo: React.FC<{ pairData: any; onSeed?: () => void; hasLiquidity?: boolean }> = ({ pairData, onSeed, hasLiquidity }) => (
  <Card className="mb-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Pool Information</h3>
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        hasLiquidity 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {hasLiquidity ? '🟢 Active' : '🔴 No Liquidity'}
          </div>
          </div>
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
      {onSeed && (
        <div className="mt-4">
          <button
            onClick={onSeed}
            className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            Seed demo liquidity (1000 FLOW / 1000 USDC)
          </button>
        </div>
      )}
      </div>
    </Card>
);

// Swap Interface Component
const SwapInterface: React.FC<{ onSwap: (amountIn: number, minAmountOut: number, direction: 'AtoB' | 'BtoA') => void; flowBalance?: number; usdcBalance?: number }> = ({ onSwap, flowBalance = 0, usdcBalance = 0 }) => {
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [quote, setQuote] = useState<number>(0);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [direction, setDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const run = async () => {
      const amt = parseFloat(amountIn);
      if (!amt || amt <= 0) { setQuote(0); return; }
      setLoadingQuote(true);
      try {
        const q = await getQuote(amt, direction);
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
  }, [amountIn, direction, slippage]);

  const minReceived = quote * (1 - slippage / 100);

  const handleSwap = () => {
    const amtIn = parseFloat(amountIn) || 0;
    if (amtIn <= 0) return;
    
    // Check if there's liquidity in the pool
    if (quote === 0) {
      alert('No liquidity in the pool! Please add liquidity first or use the "Seed demo liquidity" button.');
      return;
    }
    
    const minOut = minReceived > 0 ? minReceived : 0;
    onSwap(amtIn, minOut, direction);
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
          token={direction === 'AtoB' ? 'FLOW' : 'USDC'}
        />
        <div className="flex justify-between items-center -mt-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Balance: {(direction === 'AtoB' ? flowBalance : usdcBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {direction === 'AtoB' ? 'FLOW' : 'USDC'}</span>
          <button
              type="button"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setAmountIn(String((direction === 'AtoB' ? flowBalance : usdcBalance) || 0))}
          >
            Max
          </button>
        </div>
        <div className="flex justify-center">
          <motion.div 
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              setDirection(direction === 'AtoB' ? 'BtoA' : 'AtoB');
              // reset quote when toggling direction
              setQuote(0);
            }}
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
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{direction === 'AtoB' ? 'USDC' : 'FLOW'}</span>
        </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Min received ({slippage.toFixed(1)}%): <span className="font-semibold">{minReceived > 0 ? minReceived.toFixed(6) : '0.000000'} {direction === 'AtoB' ? 'USDC' : 'FLOW'}</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Price impact: <span className={`font-semibold ${priceImpact > 5 ? 'text-red-500' : ''}`}>{priceImpact.toFixed(2)}%</span>
        </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Route: {direction === 'AtoB' ? 'FLOW → USDC' : 'USDC → FLOW'}
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
          <div className="flex gap-2 mt-1">
            {[0.1, 0.5, 1, 2].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSlippage(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  slippage === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
        <Button 
          onClick={() => setShowConfirm(true)} 
          className="w-full"
          disabled={quote === 0}
        >
          {quote === 0 ? 'No Liquidity' : 'Swap Tokens'}
        </Button>
        </div>
        <AnimatePresence>
          {showConfirm && (
        <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
                <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Confirm Swap</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Direction</span><span className="font-semibold text-gray-800 dark:text-gray-200">{direction === 'AtoB' ? 'FLOW → USDC' : 'USDC → FLOW'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Amount in</span><span className="font-semibold text-gray-800 dark:text-gray-200">{(parseFloat(amountIn) || 0).toFixed(6)} {direction === 'AtoB' ? 'FLOW' : 'USDC'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Quote</span><span className="font-semibold text-gray-800 dark:text-gray-200">{quote.toFixed(6)} {direction === 'AtoB' ? 'USDC' : 'FLOW'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Min received</span><span className="font-semibold text-gray-800 dark:text-gray-200">{minReceived > 0 ? minReceived.toFixed(6) : '0.000000'} {direction === 'AtoB' ? 'USDC' : 'FLOW'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Slippage</span><span className="font-semibold text-gray-800 dark:text-gray-200">{slippage.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Price impact</span><span className={`font-semibold ${priceImpact > 5 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{priceImpact.toFixed(2)}%</span></div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button 
                    disabled={isSubmitting}
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await (async () => { handleSwap(); })();
                        setShowConfirm(false);
    } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting…' : 'Confirm Swap'}
                  </button>
                </div>
          </motion.div>
          </motion.div>
            )}
        </AnimatePresence>
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
  const { pairData, refetch: refetchPairData } = usePairData();
  const { balances, refetch: refetchBalances } = useBalances();
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'remove'>('swap');
  const [dexHasLiquidity, setDexHasLiquidity] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; txId?: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Check DEX liquidity status
  useEffect(() => {
    const checkLiquidity = async () => {
      try {
        const hasLiq = await hasLiquidity();
        setDexHasLiquidity(hasLiq);
      } catch (error) {
        console.error('Error checking liquidity:', error);
        setDexHasLiquidity(false);
      }
    };
    
    checkLiquidity();
    // Check every 10 seconds
    const interval = setInterval(checkLiquidity, 10000);
    return () => clearInterval(interval);
  }, []);

  // Periodic auto-refresh for balances and pair data
  useEffect(() => {
    const refresh = () => {
      try { refetchBalances(); } catch {}
      try { refetchPairData(); } catch {}
    };
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, [refetchBalances, refetchPairData]);
  type RecentActivity = {
    id: string;
    time: number;
    direction: 'AtoB' | 'BtoA';
    amountIn: number;
    minAmountOut: number;
    status: 'submitted' | 'error' | 'completed';
    txId?: string;
  };
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);

  // Load recent from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flowswap_recent');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecent(parsed as RecentActivity[]);
      }
    } catch {}
  }, []);

  // Persist recent to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flowswap_recent', JSON.stringify(recent));
    } catch {}
  }, [recent]);

  const handleSwap = async (amountA: number, amountB: number, direction: 'AtoB' | 'BtoA') => {
    try {
      // Check if DEX has liquidity before attempting swap
      if (!dexHasLiquidity) {
        setToast({ type: 'error', message: 'DEX has no liquidity. Please seed the pool first.' });
        return;
      }

      console.log(`Swapping ${direction}:`, { amountIn: amountA, minAmountOut: amountB });
      const txId = direction === 'AtoB' 
        ? await swapAForB(amountA, amountB)
        : await swapBForA(amountA, amountB);
      setToast({ type: 'success', message: `Swap completed!`, txId: String(txId) });
      
      // Refresh balances and pair data after swap
      refetchBalances();
      refetchPairData();
      
      setRecent((prev: RecentActivity[]): RecentActivity[] => [
        ({ id: String(txId), time: Date.now(), direction, amountIn: amountA, minAmountOut: amountB, status: 'completed', txId: String(txId) } as RecentActivity),
        ...prev
      ].slice(0, 8));
    } catch (error) {
      console.error('Swap failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setToast({ type: 'error', message: `Swap failed: ${errorMsg}` });
      setRecent((prev: RecentActivity[]): RecentActivity[] => [
        ({ id: Math.random().toString(36).slice(2), time: Date.now(), direction, amountIn: amountA, minAmountOut: amountB, status: 'error' } as RecentActivity),
        ...prev
      ].slice(0, 8));
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
  const handleSeed = async () => {
    try {
      setToast({ type: 'success', message: 'Seeding liquidity...' });
      const txId = await seedLiquidity();
      setToast({ type: 'success', message: 'Seeded 1000/1000 liquidity!', txId: String(txId) });
      // Refresh balances and pair data after seeding
      refetchBalances();
      refetchPairData();
      // Update liquidity status
      setDexHasLiquidity(true);
    } catch (e) {
      console.error('Seeding failed:', e);
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      setToast({ type: 'error', message: `Seeding failed: ${errorMsg}` });
    }
  };

  const handleMint = async (token: 'FLOW' | 'USDC') => {
    try {
      console.log('Starting mint process for token:', token);
      setToast({ type: 'success', message: `Setting up vaults for ${token}...` });
      
      // Mint tokens on-chain
      const txId = await (token === 'FLOW' 
        ? mintTestToken(1000)
        : mintTestToken2(1000));
      
      console.log('Mint transaction completed, waiting for chain propagation...');
      setToast({ type: 'success', message: `Minted 1000 ${token}! Refreshing balances...` });
      
      // Wait longer for chain propagation and refresh balances multiple times
      await new Promise((r) => setTimeout(r, 2000));
      console.log('First balance refresh...');
      refetchBalances();
      
      // Try refreshing again after another delay
      await new Promise((r) => setTimeout(r, 2000));
      console.log('Second balance refresh...');
      refetchBalances();
      
      console.log('Mint process completed');
      setToast({ 
        type: 'success', 
        message: `Minted 1000 ${token}! Check your balances.`, 
        txId: String(txId) 
      });
    } catch (error) {
      console.error('Mint failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setToast({ type: 'error', message: `Mint ${token} failed: ${errorMsg}` });
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Logo size={32} />
              </div>
                     <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">FlowSwap</h1>
          </motion.div>
            
            <div className="flex items-center space-x-4">
            <ThemeToggle />
              <button
                onClick={() => setShowTxModal(true)}
                className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Transactions
              </button>
            <Connect />
          </div>
          </div>
          </div>
        </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toast && (
          <div className={`fixed right-4 bottom-4 z-50 px-4 py-3 rounded-xl shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
               onAnimationEnd={() => setTimeout(() => setToast(null), 4000)}>
            <div className="flex items-center gap-3">
              <span>{toast.message}</span>
              {toast.type === 'success' && toast.txId && (
                <a
                  className="underline font-semibold"
                  href={`https://testnet.flowscan.org/transaction/${toast.txId}`}
                  target="_blank" rel="noreferrer"
                >
                  View tx
                </a>
              )}
          </div>
          </div>
        )}
        {/* Transactions Modal */}
        <AnimatePresence>
          {showTxModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg p-6"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Transactions</h4>
                  <button onClick={() => setShowTxModal(false)} className="text-sm px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Close</button>
              </div>
                {recent.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No recent transactions.</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-auto pr-1">
                    {recent.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="text-sm text-gray-700 dark:text-gray-200">
                          <div className="font-semibold">{r.direction === 'AtoB' ? 'FLOW → USDC' : 'USDC → FLOW'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.time).toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{r.amountIn.toFixed(4)} in • min {r.minAmountOut.toFixed(4)} out</div>
            </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${r.status === 'completed' ? 'text-green-500' : r.status === 'submitted' ? 'text-yellow-600' : 'text-red-500'}`}>{r.status}</span>
                          {r.txId && (
                            <a
                              href={`https://testnet.flowscan.org/transaction/${r.txId}`}
                              target="_blank" rel="noreferrer"
                              className="text-xs underline text-blue-600 dark:text-blue-400"
                            >
                              View
                            </a>
                          )}
          </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
        >
                 <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                   FlowSwap DEX
                 </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Trade tokens, provide liquidity, and earn rewards on the Flow blockchain
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Pool Info */}
                <div className="lg:col-span-1">
                  <PoolInfo pairData={pairData} onSeed={handleSeed} hasLiquidity={dexHasLiquidity} />
                  <Faucet onMint={handleMint} />
                  <UserBalances balances={balances} />
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Recent Activity</h3>
                    {recent.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No recent swaps yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {recent.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className="text-sm text-gray-700 dark:text-gray-200">
                              <div className="font-semibold">{r.direction === 'AtoB' ? 'FLOW → USDC' : 'USDC → FLOW'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{r.amountIn.toFixed(4)} in • min {r.minAmountOut.toFixed(4)} out</div>
          </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium ${r.status === 'submitted' ? 'text-green-500' : 'text-red-500'}`}>{r.status}</span>
                              {r.txId && (
                                <a
                                  href={`https://testnet.flowscan.org/transaction/${r.txId}`}
                                  target="_blank" rel="noreferrer"
                                  className="text-xs underline text-blue-600 dark:text-blue-400"
                                >
                                  View
                                </a>
                              )}
          </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
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
                      <SwapInterface 
                        onSwap={handleSwap} 
                        flowBalance={Number((balances?.flow || '0').toString().replace(/,/g, ''))}
                        usdcBalance={Number((balances?.usdc || '0').toString().replace(/,/g, ''))}
                      />
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