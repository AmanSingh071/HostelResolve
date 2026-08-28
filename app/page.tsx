"use client";

import { useMemo, useState } from "react";

type View = "home" | "student" | "worker" | "admin";
type Status = "Pending" | "In Progress" | "Completed" | "Needs Work Again";
type Grievance = {
  id: string;
  room: string;
  block: string;
  category: string;
  subject: string;
  description: string;
  status: Status;
  createdAt: Date;
  worker?: string;
};

const categories = [
  "Electrical issue","Light not working","Fan not working","Switch or socket problem",
  "Water leakage","Plumbing issue","Bathroom issue","Toilet issue","Drainage problem",
  "Wi-Fi / Internet","Furniture damaged","Bed issue","Door issue","Window issue",
  "Cleaning issue","Garbage issue","Pest / insects","Security issue","Room maintenance","Other"
];

const initial: Grievance[] = [
  { id:"GRV-104-001", block:"A", room:"104", category:"Electrical issue", subject:"Fan not working", description:"The ceiling fan is not turning on even after changing the regulator.", status:"Pending", createdAt:new Date(Date.now()-5*86400000) },
  { id:"GRV-203-002", block:"B", room:"203", category:"Water leakage", subject:"Water leaking ceiling", description:"Water is dripping near the study table.", status:"In Progress", createdAt:new Date(Date.now()-3*86400000), worker:"Maintenance Team" },
  { id:"GRV-108-003", block:"C", room:"108", category:"Wi-Fi / Internet", subject:"Wi-Fi unavailable", description:"No internet connection in the room since yesterday.", status:"Pending", createdAt:new Date(Date.now()-86400000) },
];

function priority(g: Grievance) {
  const days = Math.floor((Date.now()-g.createdAt.getTime())/86400000);
  if (["Security issue","Electrical issue"].includes(g.category) || days >= 7) return "Critical";
  if (days >= 4) return "High";
  if (days >= 2) return "Medium";
  return "Low";
}

export default function Home() {
  const [view,setView] = useState<View>("home");
  const [grievances,setGrievances] = useState<Grievance[]>(initial);
  const [block,setBlock] = useState("A");
  const [floor,setFloor] = useState("Ground");
  const [room,setRoom] = useState("1");
  const [category,setCategory] = useState(categories[0]);
  const [search,setSearch] = useState("");
  const [subject,setSubject] = useState("");
  const [description,setDescription] = useState("");
  const [notice,setNotice] = useState("");
  const [filter,setFilter] = useState("");

  const rooms = useMemo(() => {
    const prefix = floor === "Ground" ? "" : floor === "First" ? "1" : floor === "Second" ? "2" : "3";
    return Array.from({length:10},(_,i)=>prefix ? prefix + String(i+1).padStart(2,"0") : String(i+1));
  },[floor]);

  const shownCategories = categories.filter(x => x.toLowerCase().includes(search.toLowerCase()));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    const id = "GRV-" + block + "-" + room + "-" + String(grievances.length+1).padStart(3,"0");
    setGrievances([{id,block,room,category,subject,description,status:"Pending",createdAt:new Date()},...grievances]);
    setSubject(""); setDescription(""); setNotice("Grievance submitted successfully. Your report ID is " + id);
  }

  function complete(id:string) {
    const worker = window.prompt("Enter your name before closing this grievance:");
    if (!worker?.trim()) return;
    setGrievances(gs => gs.map(g => g.id===id ? {...g,status:"Completed",worker} : g));
    setNotice("Marked completed and the student has been notified.");
  }

  function reopen(id:string) {
    setGrievances(gs => gs.map(g => g.id===id ? {...g,status:"Needs Work Again"} : g));
    setNotice("Grievance reopened and returned to the worker queue.");
  }

  const active = grievances.filter(g => g.status !== "Completed");

  return (
    <main>
      <nav className="nav">
        <button className="brand" onClick={()=>setView("home")}><span>✓</span> HostelResolve</button>
        <div className="navlinks">
          <button onClick={()=>setView("student")}>Student</button>
          <button onClick={()=>setView("worker")}>Worker</button>
          <button onClick={()=>setView("admin")}>Admin</button>
        </div>
      </nav>

      {notice && <div className="notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}

      {view === "home" && <section className="hero">
        <div className="eyebrow">HOSTEL GRIEVANCE MANAGEMENT</div>
        <h1>Problems reported.<br/><em>Problems resolved.</em></h1>
        <p>A simple system for students to report hostel issues and for workers to resolve them transparently.</p>
        <div className="portal-grid">
          <button className="portal student" onClick={()=>setView("student")}><b>🎓</b><span><strong>Student Portal</strong><small>Report and track your grievance</small></span><i>→</i></button>
          <button className="portal worker" onClick={()=>setView("worker")}><b>🛠️</b><span><strong>Worker Portal</strong><small>View and resolve pending work</small></span><i>→</i></button>
        </div>
        <div className="hero-stats"><span><b>{active.length}</b> Active reports</span><span><b>24h</b> Response target</span><span><b>7 days</b> Auto archive after completion</span></div>
      </section>}

      {view === "student" && <section className="page">
        <div className="page-head"><div><div className="eyebrow">STUDENT PORTAL</div><h2>Submit a grievance</h2><p>Choose your room and tell us what needs attention.</p></div><button className="google">G Continue with Google</button></div>
        <form className="form-card" onSubmit={submit}>
          <div className="step"><span>1</span><div><h3>Where is the problem?</h3><div className="form-grid">
            <label>Block<select value={block} onChange={e=>setBlock(e.target.value)}><option>A</option><option>B</option><option>C</option></select></label>
            <label>Floor<select value={floor} onChange={e=>{setFloor(e.target.value);setRoom("1")}}><option>Ground</option><option>First</option><option>Second</option><option>Third</option></select></label>
            <label>Room<select value={room} onChange={e=>setRoom(e.target.value)}>{rooms.map(r=><option key={r}>{r}</option>)}</select></label>
          </div></div></div>
          <div className="step"><span>2</span><div className="wide"><h3>What is the issue?</h3><input placeholder="Search common issues..." value={search} onChange={e=>setSearch(e.target.value)} />
            <div className="chips">{shownCategories.slice(0,8).map(c=><button type="button" key={c} className={category===c?"selected":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
            <label>Selected category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
            <label>Short subject (4–5 words)<input required maxLength={70} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Water leaking from ceiling"/></label>
          </div></div>
          <div className="step"><span>3</span><div className="wide"><h3>Explain the problem</h3><textarea required minLength={10} maxLength={1200} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Explain what happened, where the issue is, and anything workers should know..." /><div className="helper">{description.trim().split(/\s+/).filter(Boolean).length} words · Recommended up to 200 words</div></div></div>
          <button className="primary" type="submit">Submit grievance →</button>
        </form>

        <h3 className="section-title">Demo: your reports</h3>
        <div className="report-list">{grievances.slice(0,4).map(g=><Report key={g.id} g={g} onReopen={reopen}/>)}</div>
      </section>}

      {view === "worker" && <section className="page">
        <div className="page-head"><div><div className="eyebrow">WORKER PORTAL</div><h2>Pending work queue</h2><p>Older unresolved grievances automatically move higher in priority.</p></div><button className="worker-login">Worker access</button></div>
        <div className="toolbar"><input placeholder="Search room, issue or report ID..." value={filter} onChange={e=>setFilter(e.target.value)} /><span>{active.length} active</span></div>
        <div className="queue">{[...active].filter(g=>(g.room+g.subject+g.id+g.category).toLowerCase().includes(filter.toLowerCase())).sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime()).map(g=><article className="job" key={g.id}><div className={"priority "+priority(g).toLowerCase()}>{priority(g)}</div><div className="job-main"><div className="job-top"><b>{g.subject}</b><span>{g.id}</span></div><p>{g.description}</p><div className="meta"><span>🏢 Block {g.block}</span><span>🚪 Room {g.room}</span><span>🕒 {Math.max(0,Math.floor((Date.now()-g.createdAt.getTime())/86400000))} day(s) pending</span><span>{g.status}</span></div></div><div className="job-actions"><button onClick={()=>setGrievances(gs=>gs.map(x=>x.id===g.id?{...x,status:"In Progress"}:x))}>Start work</button><button className="complete" onClick={()=>complete(g.id)}>Complete</button></div></article>)}</div>
      </section>}

      {view === "admin" && <section className="page">
        <div className="page-head"><div><div className="eyebrow">ADMIN OVERVIEW</div><h2>Hostel operations at a glance</h2><p>Demo analytics for the grievance system.</p></div></div>
        <div className="metrics"><Metric label="Total reports" value={grievances.length}/><Metric label="Pending" value={grievances.filter(g=>g.status==="Pending").length}/><Metric label="Needs work again" value={grievances.filter(g=>g.status==="Needs Work Again").length}/><Metric label="Completed" value={grievances.filter(g=>g.status==="Completed").length}/></div>
        <div className="admin-grid"><div className="panel"><h3>Reports by block</h3>{["A","B","C"].map(b=><div className="barrow" key={b}><span>Block {b}</span><div><i style={{width:(grievances.filter(g=>g.block===b).length/Math.max(grievances.length,1))*100+"%"}}/></div><b>{grievances.filter(g=>g.block===b).length}</b></div>)}</div><div className="panel"><h3>System rules</h3><ul><li>Priority rises automatically as days pass.</li><li>Workers must provide their name when completing work.</li><li>Students can reopen unsatisfactory work.</li><li>Completed reports can be archived after 7 days.</li></ul></div></div>
      </section>}
    </main>
  );
}

function Report({g,onReopen}:{g:Grievance;onReopen:(id:string)=>void}) {
  return <article className="report"><div><span className={"status "+g.status.toLowerCase().replaceAll(" ","-")}>{g.status}</span><h4>{g.subject}</h4><p>{g.block} Block · Room {g.room} · {g.category}</p>{g.worker && <small>Completed by: {g.worker}</small>}</div>{g.status==="Completed" && <div className="report-actions"><button onClick={()=>onReopen(g.id)}>Not satisfied</button><button className="close">Satisfied ✓</button></div>}</article>
}

function Metric({label,value}:{label:string;value:number}) { return <div className="metric"><span>{label}</span><b>{value}</b></div>; }
