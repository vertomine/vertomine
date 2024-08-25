import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

function Mining({ account, contract, web3 }) {
  const [vertBalance, setVertBalance] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakes, setStakes] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);

  const MIN_WITHDRAW_AMOUNT_BNB = 0.01;
  const miningWalletAddress = '0x29415552aef03D024caD77A45B76E4bF47c9B185';
  const vertContractAddress = '0x36dBF50Bf00205E04A73D48ed7E37c99612f2D45';

  const vertContractABI = [
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "payable": false,
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
      "name": "transfer",
      "outputs": [{"name": "success", "type": "bool"}],
      "payable": false,
      "type": "function"
    }
  ];

  useEffect(() => {
    if (account && web3) {
      loadVertBalance();
    }
  }, [account, web3]);

  const loadVertBalance = async () => {
    const vertContract = new web3.eth.Contract(vertContractABI, vertContractAddress);
    const balance = await vertContract.methods.balanceOf(account).call();
    setVertBalance(web3.utils.fromWei(balance, 'ether'));
  };

  useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
        const data = await response.json();
        setBnbPrice(parseFloat(data.price));
      } catch (error) {
        console.error("Failed to fetch BNB price:", error);
      }
    };

    fetchBnbPrice();
  }, []);

  const startStaking = async () => {
    if (stakeAmount <= 0 || stakeAmount > vertBalance) {
      alert('Invalid staking amount');
      return;
    }

    const vertContract = new web3.eth.Contract(vertContractABI, vertContractAddress);
    const stakeAmountInWei = web3.utils.toWei(stakeAmount.toString(), 'ether');

    try {
      await vertContract.methods.transfer(miningWalletAddress, stakeAmountInWei).send({ from: account });

      const newStake = {
        amount: stakeAmount,
        startTime: Date.now(),
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天质押期
        earnings: 0
      };

      setStakes([...stakes, newStake]);
      setTotalStaked(totalStaked + parseFloat(stakeAmount));
      alert('Staking successful!');
    } catch (error) {
      console.error('Staking failed:', error);
      alert('Staking failed. Check the console for details.');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedStakes = stakes.map(stake => {
        const timeStaked = Date.now() - stake.startTime;
        if (timeStaked < 30 * 24 * 60 * 60 * 1000) { // 如果质押时间还没到30天
          const dailyEarnings = stake.amount * (0.2 + Math.random() * 0.05) / 30; // 每天20-25%的年收益分成
          return { ...stake, earnings: stake.earnings + dailyEarnings };
        } else {
          completeStaking(stake);
          return stake;
        }
      });

      setStakes(updatedStakes);
      setTotalEarnings(updatedStakes.reduce((total, stake) => total + stake.earnings, 0));
    }, 1000 * 60 * 60 * 24); // 每天更新一次

    return () => clearInterval(interval);
  }, [stakes]);

  const completeStaking = async (stake) => {
    const vertContract = new web3.eth.Contract(vertContractABI, vertContractAddress);
    const stakeAmountInWei = web3.utils.toWei(stake.amount.toString(), 'ether');

    try {
      await vertContract.methods.transfer(account, stakeAmountInWei).send({ from: miningWalletAddress });
      alert('Staking period completed! VERT returned to your wallet.');
    } catch (error) {
      console.error('Failed to return staked VERT:', error);
      alert('Failed to return staked VERT. Check the console for details.');
    }
  };

  const withdrawEarnings = async () => {
    if (totalEarnings <= 0 || bnbPrice <= 0) {
      alert('No earnings to withdraw or BNB price not available');
      return;
    }

    const earningsInBnb = totalEarnings / bnbPrice;
    if (earningsInBnb < MIN_WITHDRAW_AMOUNT_BNB) {
      alert(`Earnings are too small to withdraw. Minimum withdrawal amount is ${MIN_WITHDRAW_AMOUNT_BNB} BNB.`);
      return;
    }

    const earningsInWei = web3.utils.toWei(earningsInBnb.toFixed(18), 'ether');

    try {
      await web3.eth.sendTransaction({
        from: miningWalletAddress,
        to: account,
        value: earningsInWei
      });

      setWithdrawals([...withdrawals, { amount: earningsInBnb, timestamp: Date.now() }]);
      setTotalEarnings(0);
      alert('Earnings withdrawn successfully!');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Check the console for details.');
    }
  };

  const earningsInBnb = totalEarnings / bnbPrice;

  return (
    <div className="mining-page">
      <div className="container">
        <div className="mining-header text-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px', marginBottom: '20px' }}>
          <h2>Total Staked VERT: {totalStaked.toFixed(2)} VERT</h2>
        </div>

        <div className="stake-section p-4 mb-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px' }}>
          <h4>Available VERT Balance: {vertBalance} VERT</h4>
          <input 
            type="number" 
            className="form-control mt-2" 
            placeholder="Enter VERT amount to stake"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value >= 0 ? e.target.value : 0)} // 确保输入的数值非负
          />
          <button className="btn btn-primary mt-3" onClick={startStaking}>Start Staking</button>
        </div>

        <div className="earnings-section p-4 mb-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px' }}>
          <h4>Total Earnings in VERT: {totalEarnings.toFixed(4)} VERT</h4>
          {bnbPrice > 0 ? (
            <>
              <h4>Total Earnings in BNB: {earningsInBnb.toFixed(8)} BNB</h4>
              <p style={{ color: earningsInBnb >= MIN_WITHDRAW_AMOUNT_BNB ? 'green' : 'red' }}>
                Earnings must exceed 0.01 BNB to withdraw.
              </p>
              {earningsInBnb >= MIN_WITHDRAW_AMOUNT_BNB && (
                <button className="btn btn-success mt-2" onClick={withdrawEarnings}>Withdraw Earnings</button>
              )}
            </>
          ) : (
            <h4>Earnings in BNB: Loading BNB Price...</h4>
          )}
        </div>

        <div className="records-section p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px' }}>
          <div className="row">
            <div className="col-md-6">
              <h4>Staking Records</h4>
              <ul>
                {stakes.length > 0 ? (
                  stakes.map((stake, index) => (
                    <li key={index}>
                      <p>Amount: {stake.amount} VERT</p>
                      <p>Earnings: {stake.earnings.toFixed(4)} VERT</p>
                      <p>End Time: {new Date(stake.endTime).toLocaleString()}</p>
                    </li>
                  ))
                ) : (
                  <p>No staking records found.</p>
                )}
              </ul>
            </div>
            <div className="col-md-6">
              <h4>Withdrawals</h4>
              <ul>
                {withdrawals.length > 0 ? (
                  withdrawals.map((withdrawal, index) => (
                    <li key={index}>
                      <p>Amount: {withdrawal.amount.toFixed(8)} BNB</p>
                      <p>Date: {new Date(withdrawal.timestamp).toLocaleString()}</p>
                    </li>
                  ))
                ) : (
                  <p>No withdrawals found.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Mining;
