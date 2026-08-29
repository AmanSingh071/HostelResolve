import { NextRequest,NextResponse } from "next/server";
import { verifyWorker } from "../../../../lib/worker-session";
export async function GET(req:NextRequest){const worker=verifyWorker(req.cookies.get("hostelresolve_worker")?.value);return worker?NextResponse.json({worker}):NextResponse.json({worker:null},{status:401})}