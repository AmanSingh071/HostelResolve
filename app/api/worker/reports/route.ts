import { NextRequest,NextResponse } from "next/server";
import { verifyWorker } from "../../../../lib/worker-session";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
const allowed=["In Progress","Awaiting Confirmation"] as const;

function worker(req:NextRequest){return verifyWorker(req.cookies.get("hostelresolve_worker")?.value)}

export async function GET(req:NextRequest){
 if(!worker(req))return NextResponse.json({error:"Worker authentication required."},{status:401});
 try{const {data,error}=await supabaseAdmin().from("grievances").select("*").neq("status","Completed").order("created_at",{ascending:true});if(error)throw error;const reports=await Promise.all((data||[]).map(async report=>{const paths=Array.isArray(report.attachments)?report.attachments:[];if(!paths.length)return report;const {data:signed,error:signedError}=await supabaseAdmin().storage.from("grievance-photos").createSignedUrls(paths,60*30);return {...report,attachments:signedError?[]:signed.map(x=>x.signedUrl).filter(Boolean)}}));return NextResponse.json({reports})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Database unavailable."},{status:500})}
}

export async function PATCH(req:NextRequest){
 const w=worker(req);if(!w)return NextResponse.json({error:"Worker authentication required."},{status:401});
 const body=await req.json().catch(()=>null);const id=typeof body?.id==="string"?body.id:"";const status=body?.status;
 if(!id||!allowed.includes(status))return NextResponse.json({error:"Invalid update."},{status:400});
 try{
  const {data:current,error:findError}=await supabaseAdmin().from("grievances").select("id,status").eq("id",id).single();
  if(findError||!current)return NextResponse.json({error:"Report not found."},{status:404});
  if(status==="In Progress"&&!["Pending","Needs Work Again"].includes(current.status))return NextResponse.json({error:"This job cannot be started in its current state."},{status:409});
  if(status==="Awaiting Confirmation"&&current.status!=="In Progress")return NextResponse.json({error:"Start the job before requesting closure."},{status:409});
  const {data,error}=await supabaseAdmin().from("grievances").update({status,worker:w.name,updated_at:new Date().toISOString()}).eq("id",id).select("*").single();
  if(error)throw error;return NextResponse.json({report:data});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not update report."},{status:500})}
}