import { NextResponse } from "next/server";
export async function POST(){const r=NextResponse.json({ok:true});r.cookies.set("hostelresolve_worker","",{path:"/",maxAge:0});return r}