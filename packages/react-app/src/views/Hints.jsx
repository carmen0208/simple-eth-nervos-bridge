import { utils } from "ethers";
import { Select } from "antd";
import React, { useState, useEffect } from "react";
import { Address, AddressInput } from "../components";
import { useTokenList } from "../hooks";
import { AddressTranslator } from 'nervos-godwoken-integration';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { CONFIG } from '../config';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import { YourContractWrapper } from "../lib/YourContractWrapper";
const { Option } = Select;
import 'react-toastify/dist/ReactToastify.css';

async function createWeb3() {
  // Modern dapp browsers...
  if (window.ethereum) {
      const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
      const providerConfig = {
          rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
          ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
          web3Url: godwokenRpcUrl
      };

      const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
      const web3 = new Web3(provider || Web3.givenProvider);

      try {
          // Request account access if needed
          await window.ethereum.enable();
      } catch (error) {
          // User denied account access...
      }

      return web3;
  }

  console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  return null;
}

export default function Hints({ yourLocalBalance, mainnetProvider, price, address }) {

  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState();
  const [accounts, setAccounts] = useState();
  const [l2Balance, setL2Balance] = useState();
  const [existingContractIdInputValue, setExistingContractIdInputValue] = useState();
  const [storedValue, setStoredValue] = useState();
  const [deployTxHash, setDeployTxHash] = useState();
  const [polyjuiceAddress, setPolyjuiceAddress] = useState();
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const toastId = React.useRef(null);
  const [purposeInputValue, setPurposeInputValue] = useState();

  useEffect(() => {
      if (accounts?.[0]) {
          const addressTranslator = new AddressTranslator();
          setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
      } else {
          setPolyjuiceAddress(undefined);
      }
  }, [accounts?.[0]]);

  useEffect(() => {
      if (transactionInProgress && !toastId.current) {
          toastId.current = toast.info(
              'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
              {
                  position: 'top-right',
                  autoClose: false,
                  hideProgressBar: false,
                  closeOnClick: false,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  closeButton: false
              }
          );
      } else if (!transactionInProgress && toastId.current) {
          toast.dismiss(toastId.current);
          toastId.current = null;
      }
  }, [transactionInProgress, toastId.current]);

  const account = accounts?.[0];

  async function deployContract() {
      const _contract = new YourContractWrapper(web3);

      try {
          setDeployTxHash(undefined);
          setTransactionInProgress(true);

          const transactionHash = await _contract.deploy(account);

          console.log("CARMENHERE", {transactionHash, address: _contract.address })
          setDeployTxHash(transactionHash);
          setExistingContractAddress(_contract.address);
          toast(
              'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
              { type: 'success' }
          );
      } catch (error) {
          console.error(error);
          toast.error(
              'There was an error sending your transaction. Please check developer console.'
          );
      } finally {
          setTransactionInProgress(false);
      }
  }

  async function getPurpose() {
      const value = await contract.getPurpose(account);
      toast('Successfully read latest stored value.', { type: 'success' });
console.log("CARMEN111111", {value})
      setStoredValue(value);
  }

  async function setExistingContractAddress(contractAddress) {
      const _contract = new YourContractWrapper(web3);
      _contract.useDeployed(contractAddress.trim());

      setContract(_contract);
      setStoredValue(undefined);
  }

  async function setPurpose() {
      try {
          setTransactionInProgress(true);
          console.log("CARMENTEST", {purposeInputValue, account })
          await contract.setPurpose(purposeInputValue, account);
          toast(
              'Successfully set latest stored value. You can refresh the read value now manually.',
              { type: 'success' }
          );
      } catch (error) {
          console.error(error);
          toast.error(
              'There was an error sending your transaction. Please check developer console.'
          );
      } finally {
          setTransactionInProgress(false);
      }
  }

  useEffect(() => {
      if (web3) {
          return;
      }

      (async () => {
          const _web3 = await createWeb3();
          setWeb3(_web3);

          const _accounts = [window.ethereum.selectedAddress];
          setAccounts(_accounts);
          console.log({ _accounts });

          if (_accounts && _accounts[0]) {
              const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
              setL2Balance(_l2Balance);
          }
      })();
  });

  const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

  // Get a list of tokens from a tokenlist -> see tokenlists.org!
  const [selectedToken, setSelectedToken] = useState("Pick a token!");
  const listOfTokens = useTokenList(
    "https://raw.githubusercontent.com/SetProtocol/uniswap-tokenlist/main/set.tokenlist.json",
  );

  return (
    <div>
      <div>
        Your ETH address: <b>{address}</b>
        <br />
        <br />
        Your Polyjuice address: <b>{polyjuiceAddress || " - "}</b>
        <br />
        <br />
        Nervos Layer 2 balance: <b>{l2Balance && (l2Balance / 10n ** 8n).toString() } CKB</b>
        <br />
        <br />
        Deployed contract address: <b>{contract?.address|| "-"}</b> <br />
        Deploy transaction hash: <b>{deployTxHash || "-"}</b>
        <br />
        <button onClick={deployContract} disabled={!l2Balance}>
          Deploy contract
        </button>
        &nbsp;or&nbsp;
        <input placeholder="Existing contract id" onChange={e => setExistingContractIdInputValue(e.target.value)} />
        <button
          disabled={!existingContractIdInputValue || !l2Balance}
          onClick={() => setExistingContractAddress(existingContractIdInputValue)}
        >
          Use existing contract
        </button>
        <br />
        <br />
        <button onClick={getPurpose} disabled={!contract}>
          Your Purpose
        </button>
        {storedValue ? <>&nbsp;&nbsp;Stored value: {storedValue.toString()}</> : null}
        <br />
        <br />
        <input type="text" onChange={e => setPurposeInputValue((e.target.value))} />
        <button onClick={setPurpose} disabled={!contract}>
          Set new Purpose
        </button>
      </div>
      <ToastContainer />
      <div> -------------------------------------------------------------------------</div>
      <div>
        <div style={{ margin: 32 }}>
          <span style={{ marginRight: 8 }}>👷</span>
          Edit your <b>contract</b> in
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            packages/hardhat/contracts
          </span>
        </div>

        <div style={{ margin: 32 }}>
          <span style={{ marginRight: 8 }}>🛰</span>
          <b>compile/deploy</b> with
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f1f1f1", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn run deploy
          </span>
        </div>

        <div style={{ margin: 32 }}>
          <span style={{ marginRight: 8 }}>🚀</span>
          Your <b>contract artifacts</b> are automatically injected into your frontend at
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            packages/react-app/src/contracts/
          </span>
        </div>

        <div style={{ margin: 32 }}>
          <span style={{ marginRight: 8 }}>🎛</span>
          Edit your <b>frontend</b> in
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            packages/reactapp/src/App.js
          </span>
        </div>

        <div style={{ marginTop: 32 }}>
          <span style={{ marginRight: 8 }}>🔭</span>
          explore the
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              marginRight: 4,
              /* backgroundColor: "#f9f9f9", */
              padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            🖇 hooks
          </span>
          and
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            📦 components
          </span>
        </div>

        <div style={{ marginTop: 32 }}>
          for example, the
          <span
            className="highlight"
            style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
          >
            useBalance()
          </span>{" "}
          hook keeps track of your balance: <b>{utils.formatEther(yourLocalBalance || 0)}</b>
        </div>

        <div style={{ margin: 8 }}>
          <div>
            <b>useTokenList()</b> can get you an array of tokens from{" "}
            <a href="https://tokenlists.org" target="_blank" rel="noopener noreferrer">
              tokenlists.org!
            </a>
          </div>
          <Select
            showSearch
            value={selectedToken}
            onChange={value => {
              console.log(`selected ${value}`);
              setSelectedToken(value);
            }}
            filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            optionFilterProp="children"
          >
            {listOfTokens.map(token => (
              <Option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ marginTop: 32 }}>
          as you build your app you&apos;ll need web3 specific components like an
          <span
            className="highlight"
            style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
          >
            {"<AddressInput/>"}
          </span>
          component:
          <div style={{ width: 350, padding: 16, margin: "auto" }}>
            <AddressInput ensProvider={mainnetProvider} />
          </div>
          <div>(try putting in your address, an ens address, or scanning a QR code)</div>
        </div>

        <div style={{ marginTop: 32 }}>
          this balance could be multiplied by
          <span
            className="highlight"
            style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
          >
            price
          </span>{" "}
          that is loaded with the
          <span
            className="highlight"
            style={{ margin: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
          >
            usePrice
          </span>{" "}
          hook with the current value: <b>${price}</b>
        </div>

        <div style={{ marginTop: 32 }}>
          <span style={{ marginRight: 8 }}>💧</span>
          use the <b>faucet</b> to send funds to
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            <Address address={address} minimized /> {address}
          </span>
        </div>

        <div style={{ marginTop: 32 }}>
          <span style={{ marginRight: 8 }}>📡</span>
          deploy to a testnet or mainnet by editing
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            packages/hardhat/hardhat.config.js
          </span>
          and running
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f1f1f1", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn run deploy
          </span>
        </div>

        <div style={{ marginTop: 32 }}>
          <span style={{ marginRight: 8 }}>🔑</span>
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f1f1f1", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn run generate
          </span>
          will create a deployer account in
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            packages/hardhat
          </span>
          <div style={{ marginTop: 8 }}>
            (use{" "}
            <span
              className="highlight"
              style={{
                marginLeft: 4,
                /* backgroundColor: "#f1f1f1", */ padding: 4,
                borderRadius: 4,
                fontWeight: "bolder",
              }}
            >
              yarn run account
            </span>{" "}
            to display deployer address and balance)
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <span style={{ marginRight: 8 }}>⚙️</span>
          build your app with
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f1f1f1", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn run build
          </span>
        </div>

        <div style={{ marginTop: 32 }}>
          <span style={{ marginRight: 8 }}>🚢</span>
          ship it!
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f1f1f1", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn run surge
          </span>
          or
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f1f1f1", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn run s3
          </span>
          or
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f1f1f1", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            yarn run ipfs
          </span>
        </div>

        <div style={{ marginTop: 32 }}>
          <span style={{ marginRight: 8 }}>💬</span>
          for support, join this
          <span
            className="highlight"
            style={{
              marginLeft: 4,
              /* backgroundColor: "#f9f9f9", */ padding: 4,
              borderRadius: 4,
              fontWeight: "bolder",
            }}
          >
            <a target="_blank" rel="noopener noreferrer" href="https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA">
              Telegram Chat
            </a>
          </span>
        </div>
        <div style={{ padding: 128 }}>
          🛠 Check out your browser&apos;s developer console for more... (inspect console) 🚀
        </div>
      </div>
    </div>
  );
}
