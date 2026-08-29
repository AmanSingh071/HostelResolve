import crypto from "crypto";

type Worker={id:string;name:string};
const secret=()=>process.env.WORKER_SESSION_SECRET||process.env.WORKER_CREDENTIALS||"";

export function signWorker(worker:Worker){
 const payload=Buffer.from(JSON.stringify({...worker,exp:Date.now()+1000*60*60*12})).toString("base64url");
 const sig=crypto.createHmac("sha256",secret()).update(payload).digest("base64url");
 return payload+"."+sig;
}
export function verifyWorker(token:string|undefined):Worker|null{
 if(!token||!secret())return null;
 const [payload,sig]=token.split(".");
 if(!payload||!sig)return null;
 const expected=crypto.createHmac("sha256",secret()).update(payload).digest("base64url");
 if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
 try{const data=JSON.parse(Buffer.from(payload,"base64url").toString());return data.exp>Date.now()&&typeof data.id==="string"&&typeof data.name==="string"?{id:data.id,name:data.name}:null}catch{return null}
}
