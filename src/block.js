import CryptoJS from "crypto-js";
import ChainUtil from "./chain-util.js";

class Block {
    constructor(timestamp, lastHash, hash, data, validator, signature) {
      this.timestamp = timestamp;
      this.lastHash = lastHash;
      this.hash = hash;
      this.data = data;
      this.validator = validator;
      this.signature = signature;
    }
  
    toString() {
      return `Block - 
          Timestamp : ${this.timestamp}
          Last Hash : ${this.lastHash}
          Hash      : ${this.hash}
          Data      : ${this.data}
          Validator : ${this.validator}
          Signature : ${this.signature}`;
    }
    static genesis() {
        return new this(`genesis time`, "----", "genesis-hash", []);
    }
    static hash(timestamp,lastHash,data){
        return ChainUtil.hash(`${timestamp}${lastHash}${data}`);
    }
    static createBlock(lastBlock, data, wallet) {
        let hash;
        let timestamp = Date.now();
        const lastHash = lastBlock.hash;
        hash = Block.hash(timestamp, lastHash, data);
        
        // get the validators public key
        let validator = wallet.getPublicKey();
        
        // Sign the block
        let signature = Block.signBlockHash(hash, wallet);
        return new this(timestamp, lastHash, hash, data, validator, signature);
    }
    static blockHash(block){
        //destructuring
        const { timestamp, lastHash, data } = block;
        return Block.hash(timestamp,lastHash,data);
    }
    static signBlockHash(hash, wallet) {
        return wallet.sign(hash);
    }
    static verifyBlock(block) {
        return ChainUtil.verifySignature(
          block.validator,
          block.signature,
          Block.hash(block.timestamp, block.lastHash, block.data)
        );
    }
    
    static verifyLeader(block, leader) {
    return block.validator == leader ? true : false;
    }
}

export default Block;