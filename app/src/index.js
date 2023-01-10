import Web3 from "web3";
import amongAllArtifact from "../../build/contracts/AmongAll.json";

function getErrorMessage(message){
  var errorMessageInJson = JSON.parse(
    message.slice(58, message.length - 2)
  );
  
  var errorMessageToShow = errorMessageInJson.data.data[Object.keys(errorMessageInJson.data.data)[0]].reason;
  return errorMessageToShow;
}

const App = {
  web3: null,
  account: null,
  meta: null,
  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = amongAllArtifact.networks[networkId];

      this.meta = new web3.eth.Contract(
        amongAllArtifact.abi,
        deployedNetwork.address,
      );
      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      this.refreshTotals();
    } catch (error) {
      console.error("Could not connect to contract or chain.");
      console.error(error)
      
    }
  },
  refreshTotals: async function() {
    const { getTotalUsers, getTotalBalance, getTotalClaims } = this.meta.methods;
    const balance = await getTotalBalance().call();
    const users = await getTotalUsers().call();
    const claims = await getTotalClaims().call();
    const totalBalance = document.getElementsByClassName("total-balance")[0];
    const totalUsers = document.getElementsByClassName("total-users")[0];
    const totalClaims = document.getElementsByClassName("total-claims")[0];
    totalBalance.innerHTML = balance;
    totalUsers.innerHTML = users;
    totalClaims.innerHTML = claims;
  },

  register: async function() {
    const price = Web3.utils.toWei((document.getElementById("price").value), 'ether');
    const value = Web3.utils.toHex(price / 10);
    this.setStatus("Initiating transaction... (please wait)");
    const { register } = this.meta.methods;
    try {
      await register(price).send({ from: this.account, value: value, gas: 3000000, gasPrice: 0 });
    } catch(error) {
      console.log(error);
      this.setStatus("");
      this.setError(error.code, error.message, error.stack)
      return; 
    }
    this.setStatus("Mobile registered");
    this.refreshTotals();
  },

  createClaim: async function() {
    const claim = document.getElementById("claim-type").value;
    const claimStatus = claim == 0 ? 'None' : claim == 1 ? 'Loss' : 'Damage'
    this.setStatus(`Initiating claim ${claimStatus}`);
    const { createClaim } = this.meta.methods;
    try {
      await createClaim(claim).send({ from: this.account});
    } catch(error) {
      console.log(error);
      this.setStatus("");
      this.setError(error.code, error.message, error.stack)
      return; 
    }
    this.setStatus("Claim registered");
    this.refreshTotals();
  },

  acceptClaim: async function() {
    const address = document.getElementById("address").value;
    this.setStatus(`Accepting claim of ${address}`);
    const { acceptClaim } = this.meta.methods;
    try {
      await acceptClaim(address).send({ from: this.account});
    } catch(error) {
      console.log(error);
      this.setStatus("");
      this.setError(error.code, error.message, error.stack)
      return; 
    }
    this.setStatus("Claim accepted");
    this.refreshTotals();
  },

  executeClaim: async function() {
    this.setStatus(`Executing current claim `);
    const { executeClaim } = this.meta.methods;
    try {
      await executeClaim().send({ from: this.account});
    } catch(error) {
      console.log(error);
      this.setStatus("");
      this.setError(error.code, error.message, error.stack)
      return; 
    }
    this.setStatus("Claim executed");
    this.refreshTotals();
  },

  getStatus: async function() {
    const address = document.getElementById("address").value;
    const { getMobilePrice, getClaimStatus } = this.meta.methods;
    try {
      const addressElement = document.getElementById("claim-address");
      addressElement.innerHTML = address;
      const price = await getMobilePrice(address).call();
      const priceElement = document.getElementById("claim-price");
      priceElement.innerHTML = price;
      const status = await getClaimStatus(address).call();
      const statusElement = document.getElementById("claim-status");
      statusElement.innerHTML = status == 0 ?  'Unaccepted' : 'Accepted';  
      
    } catch(error) {
      console.log(error);
      this.setStatus("");
      this.setError(error.code, error.message, error.stack)
      return; 
    }
  },

  refreshBalance: async function() {
    const { getBalance } = this.meta.methods;
    const balance = await getBalance(this.account).call();
    const balanceElement = document.getElementsByClassName("balance")[0];
    balanceElement.innerHTML = balance;
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  setError: function(code, message, stack) {
    const errorCode = document.getElementById("error-code");
    errorCode.innerHTML = code;
    const errorMessage = document.getElementById("error-message");
    errorMessage.innerHTML = getErrorMessage(message);
    const errorStack = document.getElementById("error-stack");
    errorStack.innerHTML = stack;
  },
};

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );
  }

  App.start();
});
