import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import logo from './assets/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faFileAlt, faLink, faWallet, faHammer, faCopy } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import Mining from './Mining';

function App() {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [bnbAmount, setBnbAmount] = useState('');
  const [bnbPrice, setBnbPrice] = useState(null);
  const [loadingError, setLoadingError] = useState('');
  const [vertAmount, setVertAmount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [chainIcon, setChainIcon] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteRecords, setInviteRecords] = useState([]);
  const [isInvitePage, setIsInvitePage] = useState(false);
  const [isMiningPage, setIsMiningPage] = useState(false);

  const contractABI = [
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},
    {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"addLiquidity","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"distributeTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"isOwnershipRenounced","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"newLpAddress","type":"address"}],"name":"setLpAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"referrer","type":"address"}],"name":"setReferrer","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"sender"},{"internalType":"address","name":"recipient"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}
  ];

  const contractAddress = '0x36dBF50Bf00205E04A73D48ed7E37c99612f2D45';
  const recipientAddress = '0x429e119D78aCec792d376e0282CbC5Fc650351D0';
  const tokenHolderAddress = '0x5f7dAbE18A9352F15e79c85f9D59Dc3d2E4B1416';
  const communityRewardAddress = '0xa52831306A8bEf9c46448c3554359ff9bd075e7C';

  const fetchBnbPrice = async () => {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setBnbPrice(parseFloat(data.price));
    } catch (error) {
      console.error("Failed to fetch BNB price:", error);
      setLoadingError('Failed to load BNB price. Please try again later.');
    }
  };

  useEffect(() => {
    fetchBnbPrice();
    const savedAccount = localStorage.getItem('account');
    if (savedAccount) {
      setAccount(savedAccount);
      setIsWalletConnected(true);
      reconnectWallet(savedAccount);
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.enable();
        const accounts = await web3Instance.eth.getAccounts();
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setIsWalletConnected(true);
        localStorage.setItem('account', accounts[0]);
        const balance = await web3Instance.eth.getBalance(accounts[0]);
        setBalance(web3Instance.utils.fromWei(balance, 'ether'));

        const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
        setContract(contractInstance);

        getTransactionHistory(accounts[0]);
        generateInviteLink(accounts[0]);
      } catch (error) {
        console.error("User denied account access", error);
      }
    } else {
      alert('MetaMask is not installed. Please consider installing it: https://metamask.io/download.html');
    }
  };

  const reconnectWallet = async (savedAccount) => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
      setWeb3(web3Instance);
      setContract(contractInstance);
      setIsWalletConnected(true);
      const balance = await web3Instance.eth.getBalance(savedAccount);
      setBalance(web3Instance.utils.fromWei(balance, 'ether'));
      getTransactionHistory(savedAccount);
      generateInviteLink(savedAccount);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setWeb3(null);
    setIsWalletConnected(false);
    setBalance('');
    setTransactions([]);
    setInviteLink('');
    setChainIcon(null);
    localStorage.removeItem('account');
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const getTransactionHistory = async (userAddress) => {
    try {
      const events = await contract.getPastEvents('Transfer', {
        filter: { from: userAddress },
        fromBlock: 0,
        toBlock: 'latest'
      });

      const formattedEvents = events.map(event => {
        return {
          from: event.returnValues.from,
          to: event.returnValues.to,
          value: web3.utils.fromWei(event.returnValues.value, 'ether'),
          transactionHash: event.transactionHash
        };
      });

      setTransactions(formattedEvents);
    } catch (error) {
      console.error("Failed to fetch transaction history:", error);
    }
  };

  const calculateVertAmount = (bnbAmount) => {
    const tokenPriceInUsd = 0.03;
    const vertAmount = (bnbAmount * bnbPrice) / tokenPriceInUsd;
    setVertAmount(Number(vertAmount.toFixed(2)));
  };

  const buyTokens = async () => {
    if (contract && account && bnbAmount > 0 && bnbPrice) {
      const balanceInEth = parseFloat(balance);
      const amountInEth = parseFloat(bnbAmount);

      if (amountInEth > balanceInEth) {
        alert('Insufficient balance.');
        return;
      }

      try {
        const amountInWei = web3.utils.toWei(bnbAmount.toString(), 'ether');
        await web3.eth.sendTransaction({
          from: account,
          to: recipientAddress,
          value: amountInWei
        });

        const vertAmountWei = web3.utils.toWei(vertAmount.toString(), 'ether');
        await contract.methods.transferFrom(tokenHolderAddress, account, vertAmountWei).send({
          from: tokenHolderAddress
        });

        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref');
        if (referrer) {
          recordInvite(referrer, bnbAmount);
        }

        alert('Tokens purchased and transferred successfully!');
        getTransactionHistory(account);
        logTransaction(account, amountInWei, vertAmountWei);
      } catch (error) {
        console.error("Purchase failed:", error);
        alert('Purchase failed. Check the console for details.');
      }
    } else {
      console.error("Contract or account not initialized or BNB price is unavailable");
      alert('Please enter a valid BNB amount and ensure BNB price is available');
    }
  };

  const logTransaction = async (account, bnbAmountWei, vertAmountWei) => {
    const logData = {
      account,
      bnbAmountWei: bnbAmountWei.toString(),
      vertAmountWei: vertAmountWei.toString(),
      timestamp: new Date().toISOString()
    };

    try {
      await fetch('/log-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.error('Failed to log transaction:', error);
    }
  };

  const recordInvite = async (referrer, purchaseAmount) => {
    try {
      const rewardAmount = (purchaseAmount * 0.05).toString();
      const rewardAmountWei = web3.utils.toWei(rewardAmount, 'ether');
      await contract.methods.transferFrom(communityRewardAddress, referrer, rewardAmountWei).send({
        from: communityRewardAddress
      });
      setInviteRecords(prevRecords => [...prevRecords, { referrer, rewardAmount }]);
      alert('Reward sent to referrer!');
    } catch (error) {
      console.error("Failed to send reward:", error);
    }
  };

  const generateInviteLink = (walletAddress) => {
    const baseUrl = window.location.origin;
    setInviteLink(`${baseUrl}?ref=${walletAddress}`);
  };

  useEffect(() => {
    if (bnbAmount && bnbPrice) {
      calculateVertAmount(bnbAmount);
    }
  }, [bnbAmount, bnbPrice]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsWalletConnected(true);
          getTransactionHistory(accounts[0]);
          generateInviteLink(accounts[0]);
        } else {
          disconnectWallet();
        }
      });
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  const handleMiningClick = () => {
    setIsMiningPage(true);
    setIsInvitePage(false);
  };

  const handleInviteClick = () => {
    setIsInvitePage(true);
    setIsMiningPage(false);
  };

  const presaleEndDate = new Date('2024-10-10T00:00:00').getTime();
  const totalSupply = 10500000;
  const [timeRemaining, setTimeRemaining] = useState('');
  const [soldAmount, setSoldAmount] = useState(3500300); // 已售数量
  const [remainingAmount, setRemainingAmount] = useState(totalSupply - soldAmount);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const distance = presaleEndDate - now;

      if (distance < 0) {
        setTimeRemaining('Presale has ended');
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  const calculateProgress = () => {
    return (soldAmount / totalSupply) * 100;
  };

  return (
    <div className="App">
      <header className="header d-flex justify-content-between align-items-center">
        <div className="logo-section d-flex align-items-center">
          <img src={logo} alt="Logo" className="img-fluid" />
        </div>
        <div className="community-icons d-flex">
          <a href="https://x.com/VertoMine" target="_blank" rel="noopener noreferrer" className="community-icon">
            <FontAwesomeIcon icon={faTwitter} size="2x" />
          </a>
          <a href="https://t.me/VertoMine" target="_blank" rel="noopener noreferrer" className="community-icon">
            <FontAwesomeIcon icon={faTelegram} size="2x" />
          </a>
        </div>
      </header>

      <nav className="navbar navbar-light bg-light">
        <div className="container d-flex justify-content-center">
          <div className="navbar-nav d-flex flex-row">
            <a className="nav-link active" aria-current="page" href="#" onClick={() => { setIsInvitePage(false); setIsMiningPage(false); }}>
              <FontAwesomeIcon icon={faHome} /> Home
            </a>
            <a className="nav-link" href="#" onClick={handleMiningClick}>
              <FontAwesomeIcon icon={faHammer} /> Mining
            </a>
            <a className="nav-link" href="https://vertominewhitepaper.vertomine.com/" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faFileAlt} /> Whitepaper
            </a>
            <a className="nav-link" href="#" onClick={handleInviteClick}>
              <FontAwesomeIcon icon={faLink} /> Invite
            </a>
          </div>
        </div>
      </nav>

      <div className="wallet-section d-flex justify-content-center align-items-center">
        {isWalletConnected ? (
          <div className="wallet-info d-flex align-items-center">
            {chainIcon && <img src={chainIcon} alt="Chain Icon" className="chain-icon" />}
            <span className="wallet-address">{truncateAddress(account)}</span>
            <span className="wallet-balance">{balance} BNB</span>
            <button className="btn btn-danger ml-2" onClick={disconnectWallet}>
              <FontAwesomeIcon icon={faWallet} /> Disconnect
            </button>
          </div>
        ) : (
          <div>
            <button className="btn btn-primary" onClick={connectWallet}>
              <FontAwesomeIcon icon={faWallet} /> Connect MetaMask
            </button>
          </div>
        )}
      </div>

      {isMiningPage && (
        <Mining account={account} contract={contract} web3={web3} />
      )}

      {isInvitePage && (
        <div className="invite-page">
          <div className="container d-flex justify-content-center">
            <div className="row">
              <div className="col-md-6">
                <div className="invite-link-section p-4 mb-4" style={{ backgroundColor: '#262626', borderRadius: '10px' }}>
                  <h2 style={{ color: '#00d4ff' }}>Invite friends and get 5% commission immediately</h2>
                  <input 
                    type="text" 
                    className="form-control invite-link" 
                    style={{ color: '#000000' }} // 设置邀请链接为黑色
                    value={inviteLink} 
                    readOnly 
                    onClick={(e) => e.target.select()} 
                  />
                  <button className="btn btn-secondary mt-2" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                    <FontAwesomeIcon icon={faCopy} /> Copy Link
                  </button>
                </div>
              </div>
              <div className="col-md-6">
                <div className="invite-records-section p-4 mb-4" style={{ backgroundColor: '#262626', borderRadius: '10px' }}>
                  <h2 style={{ color: '#00d4ff' }}>Invite Records</h2>
                  {inviteRecords.length > 0 ? (
                    <ul className="list-group">
                      {inviteRecords.map((record, index) => (
                        <li key={index} className="list-group-item">
                          <p>Referrer: {truncateAddress(record.referrer)}</p>
                          <p>Reward: {record.rewardAmount} VERT</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No invite records found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isInvitePage && !isMiningPage && (
        <div className="container mt-5">
          <div className="row">
            <div className="col-md-12">
              <h1 className="mb-4" style={{ fontSize: '1.2em' }}>VertoMine presale offers early supporters a low-cost opportunity to join the project while providing funding for its technical development, marketing, and operations.</h1>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="presale-info p-4 mb-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px' }}>
                <h3 style={{ color: '#ffcc00' }}>Buy and receive your tokens immediately!</h3>
                <h4 style={{ color: '#ffcc00' }}>VERT pre-sale price 0.03USDT</h4>
                <div className="countdown">
                  <h4>Presale Ends In:</h4>
                  <p>{timeRemaining}</p>
                </div>
                <div className="progress mt-3" style={{ height: '20px' }}>
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
                    role="progressbar" 
                    style={{ width: `${calculateProgress()}%` }} 
                    aria-valuenow={calculateProgress()} 
                    aria-valuemin="0" 
                    aria-valuemax="100">
                    {calculateProgress().toFixed(2)}%
                  </div>
                </div>
                <div className="d-flex justify-content-between mt-3">
                  <p>Sold: {soldAmount.toLocaleString()} VERT</p>
                  <p>Remaining: {remainingAmount.toLocaleString()} VERT</p>
                </div>
                <p>LISTING PRICE: $0.10+</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="form-group">
              <label htmlFor="bnbAmount" className="form-label">Enter BNB amount</label>
              <input 
                id="bnbAmount"
                type="number" 
                className="form-control"
                style={{ width: '80%', margin: '0 auto' }} // 控制输入框长度
                placeholder="Enter BNB amount"
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value >= 0 ? e.target.value : 0)} // 确保输入的数值非负
              />
              {bnbAmount && (
                <p className="mt-3">You will receive approximately <strong>{vertAmount}</strong> VERT tokens</p>
              )}
              <button className="btn btn-success mt-3" onClick={buyTokens} disabled={!contract || !bnbAmount || !bnbPrice}>Buy Tokens</button>
              {bnbPrice ? (
                <p className="mt-3">Current BNB Price: <strong>{bnbPrice} USDT</strong></p>
              ) : (
                <p className="mt-3 text-danger">{loadingError || 'Loading BNB Price...'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isInvitePage && !isMiningPage && (
        <div className="container mt-5">
          <h2>Transaction History</h2>
          {transactions.length > 0 ? (
            <ul className="list-group">
              {transactions.map((tx, index) => (
                <li key={index} className="list-group-item">
                  <p>From: {tx.from}</p>
                  <p>To: {tx.to}</p>
                  <p>Amount: {tx.value} VERT</p>
                  <p>Tx Hash: <a href={`https://bscscan.com/tx/${tx.transactionHash}`} target="_blank" rel="noopener noreferrer">{tx.transactionHash}</a></p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No transactions found</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
