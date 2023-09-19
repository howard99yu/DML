import express from "express";
import Blockchain from "../src/blockchain.js";
import bodyParser from "body-parser";
import P2pserver from "../app/p2p-server.js";
import Wallet from "../src/wallet/wallet.js";
import TransactionPool from "../src/wallet/transaction-pool.js";
import val from "../config.js";

const HTTP_PORT = 3000;

const app = express();

app.use(bodyParser.json());

const blockchain = new Blockchain();
const wallet = new Wallet("i am the first leader");

const transactionPool = new TransactionPool();
const p2pserver = new P2pserver(blockchain, transactionPool, wallet);

app.get("/ico/transactions", (req, res) => {
  res.json(transactionPool.transactions);
});

app.get("/ico/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.post("/ico/transact", (req, res) => {
  const { to, amount, type } = req.body;
  const transaction = wallet.createTransaction(
    to,
    amount,
    type,
    blockchain,
    transactionPool
  );
  p2pserver.broadcastTransaction(transaction);
  if (transactionPool.transactions.length >= val.TRANSACTION_THRESHOLD) {
    let block = blockchain.createBlock(transactionPool.transactions, wallet);
    p2pserver.broadcastBlock(block);
  }
  res.redirect("/ico/transactions");
});

app.get("/ico/public-key", (req, res) => {
  res.json({ publicKey: wallet.publicKey });
});

app.get("/ico/balance", (req, res) => {
  res.json({ balance: blockchain.getBalance(wallet.publicKey) });
});

app.post("/ico/balance-of", (req, res) => {
  res.json({ balance: blockchain.getBalance(req.body.publicKey) });
});

app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});

p2pserver.listen();