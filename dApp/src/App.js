import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  createWalletClient,
  custom,
  getContract,
  createPublicClient,
  http,
} from "viem";
import { sepolia } from "viem/chains";

function App() {
  const [mood, setMood] = useState("");
  const [showMood, setShowMood] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [walletClient, setWalletClient] = useState(null);

  const switchToSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia chainId in hex
      });
      return true;
    } catch (switchError) {
      // Mã lỗi 4902 nghĩa là chain chưa được thêm vào MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Test Network",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Sepolia network:", addError);
          return false;
        }
      }
      console.error("Error switching to Sepolia:", switchError);
      return false;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      // Yêu cầu chuyển sang Sepolia
      const switched = await switchToSepolia();
      if (!switched) {
        alert("Please switch to Sepolia network manually");
        return;
      }

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
      });

      const [address] = await walletClient.requestAddresses();

      setIsConnected(true);
      setAddress(address);
      setWalletClient(walletClient);
      console.log("Connected to wallet:", address);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet");
    }
  }, [switchToSepolia]);

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const walletClient = createWalletClient({
          chain: sepolia,
          transport: custom(window.ethereum),
        });
        const addresses = await walletClient.getAddresses();

        if (addresses.length > 0) {
          setAddress(addresses[0]);
          setIsConnected(true);
          setWalletClient(walletClient);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsConnected(false);
        setWalletClient(null);
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload trang khi đổi chain để cập nhật state
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const getContractInstance = useCallback((useWallet = false) => {
    const client = useWallet && walletClient
      ? walletClient
      : createPublicClient({
          chain: sepolia,
          transport: http(),
        });

    return getContract({
      address: MoodContractAddress,
      abi: MoodContractABI,
      client: client,
    });
  }, [walletClient]);

  const handleGetMood = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    try {
      const contractInstance = getContractInstance(false);
      const mood = await contractInstance.read.getMood();
      console.log("Getting mood from contract...");
      setShowMood(mood || "No mood set yet");
    } catch (error) {
      console.error("Error getting mood:", error);
      alert("Failed to get mood: " + error.message);
    }
  };

  const handleSetMood = async () => {
    if (!walletClient || !address) {
      alert("Please connect your wallet");
      return;
    }

    try {
      // Kiểm tra xem có đang ở đúng chain không
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0xaa36a7") {
        const switched = await switchToSepolia();
        if (!switched) {
          alert("Please switch to Sepolia network to continue");
          return;
        }
        // Reload lại walletClient sau khi đổi chain
        window.location.reload();
        return;
      }

      const contractInstance = getContractInstance(true);
      const hash = await contractInstance.write.setMood([mood], {
        account: address,
      });
      console.log("Setting mood:", mood);
      console.log("Transaction hash:", hash);
      alert("Mood set successfully! Transaction hash: " + hash);
    } catch (error) {
      console.error("Error setting mood:", error);
      alert("Failed to set mood: " + error.message);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>This is my dApp!</h1>

        {/* Connection Status */}
        <div style={{ marginBottom: "20px" }}>
          {isConnected ? (
            <div>
              <p>✅ Connected to Sepolia</p>
              <p>Account: {address}</p>
            </div>
          ) : (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>

        <p>Here we can set or get the mood:</p>
        <label htmlFor="mood">Input Mood:</label>
        <br />
        <input
          type="text"
          id="mood"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        />

        <button onClick={handleGetMood}>Get Mood</button>
        <button onClick={handleSetMood}>Set Mood</button>
        <p id="showMood">{showMood}</p>
      </div>
    </div>
  );
}

export default App;

const MoodContractAddress = "0xDDD7c9fE9d3c480524C52CB2AfE0150d06E7f2B7";
const MoodContractABI = [
  {
    inputs: [],
    name: "getMood",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_mood",
        type: "string",
      },
    ],
    name: "setMood",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
