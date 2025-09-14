import React, { useState } from 'react';

interface LiquidityInterfaceProps {
  onAddLiquidity: (amountA: number, amountB: number) => void;
  onRemoveLiquidity: (liquidityTokens: number) => void;
  reserves: { reserveA: number; reserveB: number };
  userLiquidity: number;
}

export const LiquidityInterface: React.FC<LiquidityInterfaceProps> = ({
  onAddLiquidity,
  onRemoveLiquidity,
  reserves,
  userLiquidity
}) => {
  const [amountA, setAmountA] = useState<string>('');
  const [amountB, setAmountB] = useState<string>('');
  const [removeAmount, setRemoveAmount] = useState<string>('');

  const calculateOptimalAmountB = (amountA: number): number => {
    if (!amountA || reserves.reserveA === 0 || reserves.reserveB === 0) return 0;
    return (amountA * reserves.reserveB) / reserves.reserveA;
  };

  const handleAddLiquidity = () => {
    const amountAValue = parseFloat(amountA);
    const amountBValue = parseFloat(amountB);
    
    if (amountAValue > 0 && amountBValue > 0) {
      onAddLiquidity(amountAValue, amountBValue);
    }
  };

  const handleRemoveLiquidity = () => {
    const liquidityValue = parseFloat(removeAmount);
    if (liquidityValue > 0) {
      onRemoveLiquidity(liquidityValue);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Liquidity Pool</h2>
      
      <div className="space-y-6">
        {/* Add Liquidity */}
        <div>
          <h3 className="text-lg font-medium mb-3">Add Liquidity</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FLOW Amount
              </label>
              <input
                type="number"
                value={amountA}
                onChange={(e) => {
                  setAmountA(e.target.value);
                  setAmountB(calculateOptimalAmountB(parseFloat(e.target.value) || 0).toString());
                }}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TEST Amount
              </label>
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleAddLiquidity}
              disabled={!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0}
              className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Liquidity
            </button>
          </div>
        </div>

        {/* Remove Liquidity */}
        <div>
          <h3 className="text-lg font-medium mb-3">Remove Liquidity</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Liquidity Tokens
              </label>
              <input
                type="number"
                value={removeAmount}
                onChange={(e) => setRemoveAmount(e.target.value)}
                placeholder="0.0"
                max={userLiquidity}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {userLiquidity.toFixed(6)} tokens
              </p>
            </div>
            
            <button
              onClick={handleRemoveLiquidity}
              disabled={!removeAmount || parseFloat(removeAmount) <= 0 || parseFloat(removeAmount) > userLiquidity}
              className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Remove Liquidity
            </button>
          </div>
        </div>

        {/* Pool Info */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Pool Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>FLOW Reserve:</span>
              <span>{reserves.reserveA.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>TEST Reserve:</span>
              <span>{reserves.reserveB.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Your Liquidity:</span>
              <span>{userLiquidity.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
