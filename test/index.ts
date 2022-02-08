import { expect } from "chai";
import { ethers, network } from "hardhat";
// node-fetch version ^2.6.7 needs to be added to your project
import fetch from "node-fetch";

const ONE_ETHER_BASE_UNITS = "1000000000000000000"; // 1 ETH
const MINIMAL_ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
];

describe("0x API integration", function () {
  it("it should be able to use a 0x API mainnet quote", async function () {
    // Quote parameters
    const sellToken = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH
    const buyToken = "0x6b175474e89094c44da98b954eedeac495271d0f"; // DAI
    const sellAmount = ONE_ETHER_BASE_UNITS;
    const takerAddress = "0xab5801a7d398351b8be11c439e05c5b3259aec9b"; // An account with sufficient balance on mainnet

    const quoteResponse = await fetch(
      `https://api.0x.org/swap/v1/quote?buyToken=${buyToken}&sellAmount=${sellAmount}&sellToken=${sellToken}&takerAddress=${takerAddress}`
    );
    // Check for error from 0x API
    if (quoteResponse.status !== 200) {
      const body = await quoteResponse.text();
      throw new Error(body);
    }

    const quote = await quoteResponse.json();

    // Impersonate the taker account so that we can submit the quote transaction
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [takerAddress],
    });

    // Get a signer for the account we are impersonating
    const signer = await ethers.getSigner(takerAddress);
    const dai = new ethers.Contract(buyToken, MINIMAL_ERC20_ABI, signer);

    // Get pre-swap balances for comparison
    const etherBalanceBefore = await signer.getBalance();
    const daiBalalanceBefore = await dai.balanceOf(takerAddress);

    // Send the transaction
    const txResponse = await signer.sendTransaction({
      from: quote.from,
      to: quote.to,
      data: quote.data,
      value: ethers.BigNumber.from(quote.value || 0),
      gasPrice: ethers.BigNumber.from(quote.gasPrice),
      gasLimit: ethers.BigNumber.from(quote.gas),
    });
    // Wait for transaction to confirm
    const txReceipt = await txResponse.wait();

    // Verify that the transaction was successful
    expect(txReceipt.status).to.equal(1, "successful swap transaction");

    // Get post-swap balances
    const etherBalanceAfter = await signer.getBalance();
    const daiBalanceAfter = await dai.balanceOf(takerAddress);

    // ≈ 1 ETH was spent in the transaction
    expect(
      etherBalanceBefore.sub(etherBalanceAfter).gte(ONE_ETHER_BASE_UNITS)
    ).to.equal(true);

    // Our account has more DAI after the swap than before
    expect(daiBalanceAfter.gt(daiBalalanceBefore)).to.equal(true);

    console.log(
      "--------BALANCES (before -> after)---------------------------"
    );
    console.log(
      `ETH: ${etherBalanceBefore.toString()} -> ${etherBalanceAfter.toString()}`
    );
    console.log(
      `DAI: ${daiBalalanceBefore.toString()} -> ${daiBalanceAfter.toString()}`
    );
    console.log(
      "-------------------------------------------------------------"
    );
  });
});
