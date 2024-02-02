import Link from "next/link";
import { useListen } from "../hooks/useListen";
import { useMetamask } from "../hooks/useMetamask";
import { Loading } from "./Loading";
import Web3 from "web3";
const { utils, BigNumber } = require("ethers");

import Arbitrage_ABI from "../abi/Arbitrage.abi.json";
import ERC20_ABI from "../abi/ERC20.abi.json";
import UNISWAPV2ROUTER_ABI from "../abi/UniswapV2Router.abi.json";
import SUSHISWAPROUTER_ABI from "../abi/SushiSwapRouter.abi.json";
const ARITRAGE_CONTRACT_ADDRESS = "0xB87DeCb6ca635b5d002653682C822F20A73CE6FA";
const WETH_ADDRESS = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";
const USDC_ADDRESS = "0x07865c6e87b9f70255377e024ace6630c1eaa37f";
// const UNISWAPV2_ROUTER02_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
// import UNISWAPV2_ROUTER02_ABI from "../abi/UniswapV2Router02.abi.json"
const rpcUrl = `https://goerli.infura.io/v3/${process.env.PROJECT_ID}`;

const TOKENS = [
  {
    address: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    symbol: "WETH",
    decimals: 18,
  },
  {
    address: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
    symbol: "USDC",
    decimals: 6,
  },
];

import { ethers } from "ethers";
import {
  JSXElementConstructor,
  ReactElement,
  ReactFragment,
  useEffect,
  useState,
} from "react";

export default function Wallet() {
  const {
    dispatch,
    state: { status, isMetamaskInstalled, wallet, balance, tokenBalances },
  } = useMetamask();

  // const [tokenBalances, setTokenBalances] = useState<string[]>([]);

  const listen = useListen();

  const showInstallMetamask =
    status !== "pageNotLoaded" && !isMetamaskInstalled;
  const showConnectButton =
    status !== "pageNotLoaded" && isMetamaskInstalled && !wallet;

  const isConnected = status !== "pageNotLoaded" && typeof wallet === "string";

  const handleConnect = async () => {
    dispatch({ type: "loading" });
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length > 0) {
      const balance = await window.ethereum!.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });
      dispatch({ type: "connect", wallet: accounts[0], balance });

      // we can register an event listener for changes to the users wallet
      listen();
    }
  };

  const handleDisconnect = () => {
    dispatch({ type: "disconnect" });
  };

  const handleAddToken = async () => {
    dispatch({ type: "loading" });

    TOKENS.forEach(async (token) => {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: token,
        },
      });
    });

    dispatch({ type: "idle" });
  };

  useEffect(() => {
    try {
      // Use map to create an array of promises
      TOKENS.map((token, index) => {
        const token_contract = getContract(token.address, ERC20_ABI);
        if (token_contract == null) {
          return;
        }
        if (wallet == null) {
          return;
        }
        token_contract.balanceOf(wallet).then((amount: BigInteger) => {
          let new_tokenBalances = tokenBalances;
          new_tokenBalances[index] = amount.toString();
          dispatch({
            type: "token_balance",
            tokenBalances: new_tokenBalances,
          });
        });
      });
      // Use Promise.all to wait for all promises to resolve
    } catch (err) {
      console.log(err);
    }
  }, [wallet]);

  // useEffect(() => {
  //   getTokenAmount();
  // }, [wallet]);
  // useEffect(() => {
  //   let newWalletStatus: ReactElement<any, any>[] = [];
  //   tokenBalances.forEach((tokenBalance, index) => {
  //     newWalletStatus.push(
  //       <span>
  //         {parseInt(tokenBalance) / (10 * TOKENS[index].decimals)}{" "}
  //         {TOKENS[index].symbol}
  //       </span>
  //     );
  //   });
  //   setWalletStatus(newWalletStatus);
  // }, [tokenBalances]);

  const getContract = (address: string, abi: ethers.ContractInterface) => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      return new ethers.Contract(address, abi, signer);
    }
    return null;
  };

  const getUniswapOutAmount = async (amount: ethers.BigNumber) => {
    const { ethereum } = window;
    if (ethereum) {
      // const uniswapV2Contract = getContract(
      //   SUSHISWAPROUTER_ADDRESS,
      //   UNISWAPV2ROUTER_ABI
      // );
      // if (uniswapV2Contract == null) {
      //   return;
      // }
      // console.log("Initialize approvement");
      // const path = [WETH_ADDRESS, USDC_ADDRESS];
      // let expectAmountTxn = await uniswapV2Contract.getAmountsOut(amount, path);
      // console.log(expectAmountTxn);
      // let amountEthFromDai = await uniswapV2Contract.getAmountsOut(
      //   amount,
      //   [WETH_ADDRESS, USDC_ADDRESS]
      // );
      // console.log(await expectAmountTxn.wait());
      // console.log(
      //   `Arbitrage Success, transaction hash: ${expectAmountTxn.hash}`
      // );
    }
  };

  const handleRunBot = async () => {
    dispatch({ type: "loading" });

    try {
      const balance = "0.001";
      // const amount = utils.formatEther(balance);
      const amount = ethers.utils.parseUnits(balance, "ether");
      // await getUniswapOutAmount(amount);

      // return;

      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wethContract = new ethers.Contract(
          WETH_ADDRESS,
          ERC20_ABI,
          signer
        );

        console.log("Initialize approvement");
        let aproveTxn = await wethContract.approve(
          ARITRAGE_CONTRACT_ADDRESS,
          amount
        );
        await aproveTxn.wait();
        console.log("Approving... please wait");
        let arbitrageContract = new ethers.Contract(
          ARITRAGE_CONTRACT_ADDRESS,
          Arbitrage_ABI,
          signer
        );

        console.log("Initialize abitrage transaction");
        let arbitrageTxn = await arbitrageContract.swap(
          WETH_ADDRESS,
          USDC_ADDRESS,
          amount,
          { gasLimit: 600000 }
        );
        await arbitrageTxn.wait();
        console.log(
          `Arbitrage Success, transaction hash: ${arbitrageTxn.hash}`
        );
      }
    } catch (err) {
      console.log(err);
    }

    // const web3 = new Web3(rpcUrl);
    // console.log(Arbitrage_ABI);
    // let arbitrage_contract = new web3.eth.Contract(Arbitrage_ABI, arbitrage_address);
    // let amount = 100;
    // let address1 = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";  //WETH
    // let address2 = "0x07865c6e87b9f70255377e024ace6630c1eaa37f";  //USDC
    // const weth_contract = new web3.eth.Contract(ERC20_ABI, address1);
    // weth_contract.methods.approve(arbitrage_address, amount).send({
    //   from: wallet
    // });
    // arbitrage_contract.methods.swap(amount, address1, address2);

    // web3.eth.getBalance(arbitrage_address).then(console.log)

    // dispatch({ type: "idle" });

    dispatch({ type: "idle" });
  };

  // const [balances, setBalances] = useState<any[]>([]);

  // The problem is
  // when hot reload, the tokenBalances are already set and when the function with in useEffect is called, the tokenBalances are set
  // but when refresh, tokenBalances are empty
  // but tokenBalances is state, so when tokenBalances is changed, the function must be called, but it isn't
  // I wonder why it isn't called when tokenBalances is changed.

  // useEffect(() => {
  //   console.log(tokenBalances);
  //   const new_balances = tokenBalances.map((balance, index) => {
  //     return (
  //       <li key={TOKENS[index].symbol}>
  //         {parseInt(balance) / Math.pow(10, TOKENS[index].decimals)}{" "}
  //         {TOKENS[index].symbol}
  //       </li>
  //     );
  //   });
  //   console.log(new_balances);
  //   setBalances(new_balances);
  // }, [tokenBalances, setBalances]);

  return (
    <div className="bg-truffle">
      <div className="mx-auto max-w-2xl py-16 px-4 text-center sm:py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          <span className="block">Arbitrage Bot</span>
        </h2>
        <p className="mt-4 text-lg leading-6 text-white">
          Connect your metamask and enjoy my arbitrage bot.
        </p>

        {wallet && balance && (
          <div className=" px-4 py-5 sm:px-6">
            <div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
              <div className="ml-4 mt-4">
                <div className="flex items-center">
                  <div className="ml-4">
                    <h3 className="text-lg font-medium leading-6 text-white">
                      Address: <span>{wallet}</span>
                    </h3>
                    <div className="text-sm text-white">
                      <ul>
                        <li key="eth">
                          {(parseInt(balance) / 1000000000000000000).toFixed(4)}{" "}
                          ETH
                        </li>
                        {tokenBalances.map((balance, index) => {
                          return (
                            <li key={TOKENS[index].symbol}>
                              {parseInt(balance) /
                                Math.pow(10, TOKENS[index].decimals)}{" "}
                              {TOKENS[index].symbol}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConnectButton && (
          <button
            onClick={handleConnect}
            className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-ganache text-white px-5 py-3 text-base font-medium  sm:w-auto"
          >
            {status === "loading" ? <Loading /> : "Connect Wallet"}
          </button>
        )}

        {showInstallMetamask && (
          <Link
            href="https://metamask.io/"
            target="_blank"
            className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-ganache text-white px-5 py-3 text-base font-medium  sm:w-auto"
          >
            Install Metamask
          </Link>
        )}

        {isConnected && (
          <div className="flex  w-full justify-center space-x-2">
            <button
              onClick={handleAddToken}
              className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-ganache text-white px-5 py-3 text-base font-medium  sm:w-auto"
            >
              {status === "loading" ? (
                <Loading />
              ) : (
                "Add Token To Your Metamask"
              )}
            </button>
            <button
              onClick={handleDisconnect}
              className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-ganache text-white px-5 py-3 text-base font-medium  sm:w-auto"
            >
              Disconnect
            </button>
          </div>
        )}

        {isConnected && (
          <div className="flex  w-full justify-center space-x-2">
            <select className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-ganache text-white px-5 py-3 text-base font-medium  sm:w-auto">
              <option value="1">WETH - USDC</option>
              <option value="2">USDC - WETH</option>
            </select>
            <input
              placeholder="Input Loan"
              className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-ganache text-white px-5 py-3 text-base font-medium  sm:w-auto"
            />
            <button
              onClick={handleRunBot}
              className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-ganache text-white px-5 py-3 text-base font-medium  sm:w-auto"
            >
              {status === "loading" ? <Loading /> : "Run Bot"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
