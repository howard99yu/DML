import { WebSocketServer,WebSocket } from "ws"
import dotenv from 'dotenv';
import val from '../config.js'

dotenv.config({path: `./.env.${process.env.NODE_ENV}`});
//declare the peer to peer server port 
const P2P_PORT = process.env.P2P_PORT || 5001;

//list of address to connect to
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const MESSAGE_TYPE = {
    chain: "CHAIN",
    block: "BLOCK",
    transaction: "TRANSACTION",
    clear_transactions: "CLEAR_TRANSACTIONS"
  };

class P2pserver{
    constructor(blockchain,transactionPool,wallet){
        this.blockchain = blockchain;
        this.sockets = [];
        this.transactionPool = transactionPool;
        this.wallet = wallet
    }

    // create a new p2p server and connections

    listen(){
        // create the p2p server with port as argument
        const server = new WebSocketServer({port : P2P_PORT})

        // event listener and a callback function for any new connection
        // on any new connection the current instance will send the current chain
        // to the newly connected peer
        server.on("connection", socket => {
            socket.isAlive = true;
            this.connectSocket(socket);
        });

        // to connect to the peers that we have specified
        this.connectToPeers();

        console.log(`Listening for peer to peer connection on port : ${P2P_PORT}`);
    }

    // after making connection to a socket
    connectSocket(socket){

        // push the socket too the socket array
        this.sockets.push(socket);
        console.log("Socket connected");
        this.messageHandler(socket);
        this.closeConnectionHandler(socket);
        this.sendChain(socket);
    }

    connectToPeers(){

        //connect to each peer
        peers.forEach(peer => {

            // create a socket for each peer
            const socket = new WebSocket(peer);
            
            // open event listner is emitted when a connection is established
            // saving the socket in the array
            socket.on('open',() => this.connectSocket(socket));

        });
    }
    messageHandler(socket){
        //on recieving a message execute a callback function
        socket.on("message", message => {
            const data = JSON.parse(message);
            console.log("Recieved data from peer:", data);
      
            switch (data.type) {
                case MESSAGE_TYPE.chain:
                this.blockchain.replaceChain(data.chain);
                break;
      
                case MESSAGE_TYPE.transaction:
                    let thresholdReached = null;
                    if (!this.transactionPool.transactionExists(data.transaction)) {
                      thresholdReached = this.transactionPool.addTransaction(
                        data.transaction
                      );
                      this.broadcastTransaction(data.transaction);
                      // console.log(thresholdReached);
                    }
                    if (this.transactionPool.thresholdReached()) {
                      if (this.blockchain.getLeader() == this.wallet.getPublicKey()) {
                        console.log("Creating block");
                        let block = this.blockchain.createBlock(
                          this.transactionPool.transactions,
                          this.wallet
                        );
                        this.broadcastBlock(block);
                      }
                    }
                    break;
            
                case MESSAGE_TYPE.block:
                    if (this.blockchain.isValidBlock(data.block)) {
                    this.blockchain.addBlock(data.block);
                    this.blockchain.executeTransactions(data.block);
                    this.transactionPool.clear();
                    console.log(this.transactionPool);
                    }
                    break;
            }
        });
    }
    closeConnectionHandler(socket) {
        socket.on("close", () => (socket.isAlive = false));
    }
    sendChain(socket){
        socket.send(JSON.stringify({
            type: MESSAGE_TYPE.chain,
            chain: this.blockchain.chain 
           }));
    }
    syncChain(){
        this.sockets.forEach(socket =>{
            this.sendChain(socket);
        });
    }
    broadcastTransaction(transaction){
        this.sockets.forEach(socket =>{
            this.sendTransaction(socket,transaction);
        });
    }


    sendTransaction(socket,transaction){
         socket.send(JSON.stringify({
             type: MESSAGE_TYPE.transaction,
             transaction: transaction
           })
       );
     }

    broadcastBlock(block) {
        this.sockets.forEach(socket => {
            this.sendBlock(socket, block);
        });
    }

    sendBlock(socket, block) {
        socket.send(
            JSON.stringify({
            type: MESSAGE_TYPE.block,
            block: block
            })
        );
    }

}

export default P2pserver;