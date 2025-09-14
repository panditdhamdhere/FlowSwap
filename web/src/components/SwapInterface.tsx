import React, { useState } from 'react';

interface SwapInterfaceProps {
  onSwap: (amountIn: number, minAmountOut: number, tokenIn: string) => void;
  reserves: { reserveA: number; reserveB: number };
}

export const SwapInterface: React.FC<SwapInterfaceProps> = ({ onSwap, reserves }) => {
  const [amountIn, setAmountIn] = useState<string>('');
  const [tokenIn, setTokenIn] = useState<string>('FLOW');
  const [slippage, setSlippage] = useState<number>(0.5);

  const calculateAmountOut = (amount: number): number => {
    if (!amount || reserves.reserveA === 0 || reserves.reserveB === 0) return 0;
    
    // Simple AMM calculation (constant product formula)
    const k = reserves.reserveA * reserves.reserveB;
    const newReserveA = reserves.reserveA + amount;
    const newReserveB = k / newReserveA;
    return reserves.reserveB - newReserveB;
  };

  const handleSwap = () => {
    const amount = parseFloat(amountIn);
    if (!amount) return;
    
    const amountOut = calculateAmountOut(amount);
    const minAmountOut = amountOut * (1 - slippage / 100);
    
    onSwap(amount, minAmountOut, tokenIn);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Swap Tokens</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FLOW">FLOW</option>
              <option value="TEST">TEST</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={calculateAmountOut(parseFloat(amountIn) || 0).toFixed(6)}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <select
              value={tokenIn === 'FLOW' ? 'TEST' : 'FLOW'}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            >
              <option value="FLOW">FLOW</option>
              <option value="TEST">TEST</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slippage Tolerance (%)
          </label>
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            min="0.1"
            max="50"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleSwap}
          disabled={!amountIn || parseFloat(amountIn) <= 0}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Swap
        </button>
      </div>
    </div>
  );
};
