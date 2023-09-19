import Transaction from "../transaction.js";
import val from "../../config.js";

class TransactionPool {
  constructor() {
    this.transactions = [];
  }
  thresholdReached() {
    if (this.transactions.length >= val.TRANSACTION_THRESHOLD) {
      return true;
    } else {
      return false;
    }
  }
  addTransaction(transaction) {
    this.transactions.push(transaction);
    if (this.transactions.length >= val.TRANSACTION_THRESHOLD) {
      return true;
    } else {
      return false;
    }
  }

  validTransactions() {
    return this.transactions.filter(transaction => {
      if (!Transaction.verifyTransaction(transaction)) {
        console.log(`Invalid signature from ${transaction.data.from}`);
        return;
      }

      return transaction;
    });
  }
  transactionExists(transaction) {
    let exists = this.transactions.find(t => t.id === transaction.id);
    return exists;
  }
  clear() {
    this.transactions = [];
  }
}

export default TransactionPool;