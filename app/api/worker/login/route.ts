import { NextResponse } from "next/server";
import { signWorker } from "../../../../lib/worker-session";

type WorkerCredential={id:string;pin:string;name?:string};
function getWorkers():WorkerCredential[]{try{const parsed=JSON.parse(process.env.WORKER_CREDENTIALS||"[]");return Array.isArray(parsed)?parsed.filter((w):w is WorkerCredential=>w&&typeof w.id==="string"&&typeof w.pin==="string").map(w=>({id:w.id.trim(),pin:w.pin,name:typeof w.name==="string"?w.name.trim():undefined})):[]}catch{return []}}

export async function POST(request:Request){
 const body=await request.json().catch(()=>null);
 const workerId=typeof body?.workerId==="string"?body.workerId.trim():"";
 const workerPin=typeof body?.workerPin==="string"?body.workerPin:"";
 const worker=getWorkers().find(w=>w.id.toLowerCase()===workerId.toLowerCase()&&w.pin===workerPin);
 if(!worker)return NextResponse.json({error:"Invalid Worker ID or PIN."},{status:401});
 const response=NextResponse.json({ok:true,worker:{id:worker.id,name:worker.name||worker.id}});
 response.cookies.set("hostelresolve_worker",signWorker({id:worker.id,name:worker.name||worker.id}),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*12});
 return response;
}