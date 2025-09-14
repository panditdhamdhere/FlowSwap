import Test
import FlowDEX from "../contracts/FlowDEX.cdc"
import TestToken from "../contracts/TestToken.cdc"
import TestToken2 from "../contracts/TestToken2.cdc"
import FungibleToken from 0x9a0766d93b6608b7

pub fun setup() {
    let account = Test.createAccount()
    let account2 = Test.createAccount()
    
    // Deploy TestToken
    let testTokenCode = Test.readFile("../contracts/TestToken.cdc")
    let testTokenContract = Test.deployContract(
        name: "TestToken",
        path: "../contracts/TestToken.cdc",
        arguments: [1000000.0]
    )
    
    // Deploy TestToken2
    let testToken2Code = Test.readFile("../contracts/TestToken2.cdc")
    let testToken2Contract = Test.deployContract(
        name: "TestToken2",
        path: "../contracts/TestToken2.cdc",
        arguments: [1000000.0]
    )
    
    // Deploy FlowDEX
    let flowDexCode = Test.readFile("../contracts/FlowDEX.cdc")
    let flowDexContract = Test.deployContract(
        name: "FlowDEX",
        path: "../contracts/FlowDEX.cdc",
        arguments: []
    )
    
    return [account, account2, testTokenContract, testToken2Contract, flowDexContract]
}

pub fun testInitialState() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Test initial state
    Test.assertEqual(flowDex.getReserveA(), 0.0)
    Test.assertEqual(flowDex.getReserveB(), 0.0)
    Test.assertEqual(flowDex.getTotalSupply(), 0.0)
    Test.assertEqual(flowDex.getPriceA(), 0.0)
    Test.assertEqual(flowDex.getPriceB(), 0.0)
}

pub fun testAddLiquidity() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Add initial liquidity
    let liquidity = flowDex.addLiquidity(amountA: 1000.0, amountB: 2000.0, minLiquidity: 0.0)
    
    // Test reserves updated
    Test.assertEqual(flowDex.getReserveA(), 1000.0)
    Test.assertEqual(flowDex.getReserveB(), 2000.0)
    Test.assertEqual(flowDex.getTotalSupply(), liquidity + 1000.0) // + minimum liquidity
    
    // Test price calculation
    Test.assertEqual(flowDex.getPriceA(), 2.0) // 2000/1000
    Test.assertEqual(flowDex.getPriceB(), 0.5) // 1000/2000
}

pub fun testSwapAForB() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Add initial liquidity
    flowDex.addLiquidity(amountA: 1000.0, amountB: 2000.0, minLiquidity: 0.0)
    
    // Perform swap
    let amountOut = flowDex.swapAForB(amountIn: 100.0, minAmountOut: 0.0)
    
    // Test reserves updated correctly
    Test.assertEqual(flowDex.getReserveA(), 1100.0) // 1000 + 100
    Test.assert(flowDex.getReserveB() < 2000.0) // Should be less due to swap
    Test.assert(amountOut > 0.0) // Should receive some tokens
}

pub fun testSwapBForA() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Add initial liquidity
    flowDex.addLiquidity(amountA: 1000.0, amountB: 2000.0, minLiquidity: 0.0)
    
    // Perform swap
    let amountOut = flowDex.swapBForA(amountIn: 200.0, minAmountOut: 0.0)
    
    // Test reserves updated correctly
    Test.assertEqual(flowDex.getReserveB(), 2200.0) // 2000 + 200
    Test.assert(flowDex.getReserveA() < 1000.0) // Should be less due to swap
    Test.assert(amountOut > 0.0) // Should receive some tokens
}

pub fun testRemoveLiquidity() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Add initial liquidity
    let liquidity = flowDex.addLiquidity(amountA: 1000.0, amountB: 2000.0, minLiquidity: 0.0)
    
    // Remove half the liquidity
    let (amountA, amountB) = flowDex.removeLiquidity(
        liquidity: liquidity / 2.0, 
        minAmountA: 0.0, 
        minAmountB: 0.0
    )
    
    // Test reserves reduced proportionally
    Test.assert(flowDex.getReserveA() < 1000.0)
    Test.assert(flowDex.getReserveB() < 2000.0)
    Test.assert(amountA > 0.0)
    Test.assert(amountB > 0.0)
}

pub fun testConstantProductFormula() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Add initial liquidity
    flowDex.addLiquidity(amountA: 1000.0, amountB: 2000.0, minLiquidity: 0.0)
    
    let initialK = flowDex.getK()
    
    // Perform swap
    flowDex.swapAForB(amountIn: 100.0, minAmountOut: 0.0)
    
    let finalK = flowDex.getK()
    
    // K should increase due to fees
    Test.assert(finalK > initialK)
}

pub fun testSlippageProtection() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Add initial liquidity
    flowDex.addLiquidity(amountA: 1000.0, amountB: 2000.0, minLiquidity: 0.0)
    
    // Try swap with high minimum amount (should fail)
    Test.expectFailure(
        fun() {
            flowDex.swapAForB(amountIn: 100.0, minAmountOut: 1000.0)
        }
    )
}

pub fun testLiquidityTokenMinting() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Add initial liquidity
    let liquidity1 = flowDex.addLiquidity(amountA: 1000.0, amountB: 2000.0, minLiquidity: 0.0)
    
    // Add more liquidity
    let liquidity2 = flowDex.addLiquidity(amountA: 500.0, amountB: 1000.0, minLiquidity: 0.0)
    
    // Second liquidity should be proportional
    Test.assert(liquidity2 < liquidity1)
    Test.assert(liquidity2 > 0.0)
}

pub fun testFeeCalculation() {
    let setupResult = setup()
    let account = setupResult[0] as! Test.Account
    let flowDexContract = setupResult[4] as! Test.Contract
    
    let flowDex = flowDexContract.getAccount().getContract(name: "FlowDEX") as! &FlowDEX.FlowDEX
    
    // Add initial liquidity
    flowDex.addLiquidity(amountA: 1000.0, amountB: 2000.0, minLiquidity: 0.0)
    
    let initialK = flowDex.getK()
    
    // Perform swap
    flowDex.swapAForB(amountIn: 100.0, minAmountOut: 0.0)
    
    let finalK = flowDex.getK()
    
    // K should increase by approximately 0.3% fee
    let expectedKIncrease = initialK * 0.003
    let actualKIncrease = finalK - initialK
    
    Test.assert(actualKIncrease > 0.0)
    Test.assert(actualKIncrease <= expectedKIncrease * 1.1) // Allow 10% tolerance
}
