import ChainUtil from "./chain-util.js";
import val from "../config.js";

class Transaction {
  constructor() {
    this.id = ChainUtil.id();
    this.type = null;
    this.input = null;
    this.output = null;
  }

  static newTransaction(senderWallet, to, amount, type) {
    if (amount + val.TRANSACTION_FEE > senderWallet.balance) {
      console.log(`Not enough balance`);
      return;
    }

    return Transaction.generateTransaction(senderWallet, to, amount, type);
  }

  static generateTransaction(senderWallet, to, amount, type) {
    const transaction = new this();
    transaction.type = type;
    transaction.output = {
      to: to,
      amount: amount - val.TRANSACTION_FEE,
      fee: val.TRANSACTION_FEE
    };
    Transaction.signTransaction(transaction, senderWallet);
    return transaction;
  }

  static signTransaction(transaction, senderWallet) {
    transaction.input = {
      timestamp: Date.now(),
      from: senderWallet.publicKey,
      signature: senderWallet.sign(ChainUtil.hash(transaction.output))
    };
  }

  static verifyTransaction(transaction) {
    return ChainUtil.verifySignature(
      transaction.input.from,
      transaction.input.signature,
      ChainUtil.hash(transaction.output)
    );
  }
}

export default Transaction;