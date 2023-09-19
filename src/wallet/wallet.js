
import val from '../../config.js'
import ChainUtil from '../chain-util.js';
import Transaction from '../transaction.js';


class Wallet {
    constructor(secret) {
      this.keyPair = ChainUtil.genKeyPair(secret);
      this.publicKey = this.keyPair.getPublic("hex");
      this.balance = val.INITAL_BALANCE
    }
  
    toString() {
      return `Wallet - 
          publicKey: ${this.publicKey.toString()}
          balance  : ${this.balance}`;
    }
    createTransaction(to, amount, type, blockchain, transactionPool) {
      this.balance = this.getBalance(blockchain);
      if (amount > this.balance) {
        console.log(
          `Amount: ${amount} exceeds the current balance: ${this.balance}`
        );
        return;
      }
      let transaction = Transaction.newTransaction(this, to, amount, type);
      transactionPool.addTransaction(transaction);
      return transaction;
    }
    getBalance(blockchain) {
      return blockchain.getBalance(this.publicKey);
    }
    getPublicKey() {
      return this.publicKey;
    }
    sign(dataHash) {
      return this.keyPair.sign(dataHash).toHex();
    }
}

export default Wallet;