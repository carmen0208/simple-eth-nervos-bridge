import Web3 from "web3";
import * as YourContract from "../contracts/YourContract.json";

const DEFAULT_SEND_OPTIONS = {
  gas: 6000000,
};

export class YourContractWrapper {
  web3;

  contract;

  address;

  constructor(web3) {
    this.web3 = web3;
    this.contract = new web3.eth.Contract(YourContract.abi);
  }

  get isDeployed() {
    return Boolean(this.address);
  }

  async getPurpose(fromAddress) {
    const data = await this.contract.methods.getPurpose().call({ from: fromAddress });
    console.log("CARMEN AT WRAPPER", data);
    return data;
  }

  async setPurpose(value, fromAddress) {
    const tx = await this.contract.methods.setPurpose(value).send({
      ...DEFAULT_SEND_OPTIONS,
      from: fromAddress,
      value,
    });

    console.log("CARMEN AT WRAPPER tx ", tx);

    return tx;
  }

  async deploy(fromAddress) {
    const deployTx = await this.contract
      .deploy({
        data: YourContract.bytecode,
        arguments: [],
      })
      .send({
        ...DEFAULT_SEND_OPTIONS,
        from: fromAddress,
        to: "0x0000000000000000000000000000000000000000",
      });

    this.useDeployed(deployTx.contractAddress);

    return deployTx.transactionHash;
  }

  useDeployed(contractAddress) {
    this.address = contractAddress;
    this.contract.options.address = contractAddress;
  }
}
