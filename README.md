# 0x API mainnet forking Hardhat example

This project demonstrates how you can use [Hardhat](https://hardhat.org) to fork the Ethereum mainnet and run tests on your private fork using quotes from using production Ethereum 0x API.

## Getting started

1. Clone the repo, and then run `npm install`.
1. Copy `.env.example` to `.env` and add your own `RPC_URL`
1. The example test is located in `test/index.ts` and can be executed with `npx hardhat test`

After running `npx hardhat test` you should see an output similar to this, confirming that your mainnet quote was successfully executed on your private fork

```shell
  0x API integration
--------BALANCES (before -> after)---------------------------
ETH: 53975713661856780269 -> 52969700071856780269
DAI: 2112188250000000000 -> 3105205012411249518052
-------------------------------------------------------------
    ✓ it should be able to use a 0x API mainnet quote (9812ms)


  1 passing (10s)
```
