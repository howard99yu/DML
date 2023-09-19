import elliptic from 'elliptic';
import CryptoJS from "crypto-js";

import {v1 as uuid} from "uuid";

const eddsa = elliptic.eddsa('ed25519');

class ChainUtil {
    static genKeyPair(secret) {
      return eddsa.keyFromSecret(secret);
    }
    static id(){
        return uuid();
    }
    static hash(data){
        return CryptoJS.SHA256(JSON.stringify(data)).toString();
    }
    static verifySignature(publicKey, signature, dataHash) {
        console.log(publicKey);
        console.log(signature);
        console.log(dataHash);
        return eddsa.keyFromPublic(publicKey).verify(dataHash, signature);
    }
  }
export default ChainUtil;