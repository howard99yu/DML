import express from 'express';
import Blockchain from '../src/blockchain.js'
import bodyParser from 'body-parser';
import P2pserver from './p2p-server.js';
import Wallet from '../src/wallet/wallet.js';
import TransactionPool from '../src/wallet/transaction-pool.js';
import dotenv from 'dotenv';
import val from '../config.js'

dotenv.config({path: `./.env.${process.env.NODE_ENV}`});
console.log(process.env.NODE_ENV)

const wallet = new Wallet(Date.now().toString());
const transactionPool = new TransactionPool();

//get the port from the user or set the default port
const HTTP_PORT = process.env.HTTP_PORT || 3001;

//create a new app
const app  = express();

//using the blody parser middleware
app.use(bodyParser.json());

// create a new blockchain instance
const blockchain = new Blockchain();
const p2pserver = new P2pserver(blockchain,transactionPool,wallet);

//EXPOSED APIs

//api to get the blocks
app.get('/blocks',(req,res)=>{

    res.json(blockchain.chain);

});

//api to add blocks
app.post('/mine',(req,res)=>{
    const block = blockchain.addBlock(req.body.data);
    console.log(`New block added: ${block.toString()}`);

    res.redirect('/blocks');
    p2pserver.syncChain();
});

// api to view transaction in the transaction pool
app.get('/transactions',(req,res)=>{
    res.json(transactionPool.transactions);
});
app.post("/transact", (req, res) => {
    const { to, amount, type } = req.body;
    const transaction = wallet.createTransaction(
       to, amount, type, blockchain, transactionPool
    );
  p2pserver.broadcastTransaction(transaction);
  if (transactionPool.transactions.length >= val.TRANSACTION_THRESHOLD) {
    let block = blockchain.createBlock(transactionPool.transactions, wallet);
    p2pserver.broadcastBlock(block);
  }
  res.redirect("/transactions");
});
app.get("/public-key", (req, res) => {
    res.json({ publicKey: wallet.publicKey });
});
  
app.get("/balance", (req, res) => {
    res.json({ balance: blockchain.getBalance(wallet.publicKey) });
});

// app server configurations
app.listen(HTTP_PORT,()=>{
    console.log(`listening on port ${HTTP_PORT}`);
})
p2pserver.listen();