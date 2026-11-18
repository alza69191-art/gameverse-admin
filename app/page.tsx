"use client";

import { useCallback, useEffect, useState } from "react";

type User = { id: string; email: string; displayName: string; role: string };
type Application = { id: number; email: string; displayName: string; studioName: string; contactEmail: string; portfolioUrl: string | null; description: string; createdAt: string };
type Upload = { id: string; title: string; slug: string; description: string; filename: string; sizeBytes: number; uploadStatus: string; scanStatus: string; reviewStatus: string; developerEmail: string; developerName: string };
type ModerationItem = { id: number; gameSlug: string; displayName: string; body?: string; reviewText?: string; rating?: number; reason?: string; details?: string };\ntype AuditItem = { id:number; action:string; entityType:string; entityId:string; actorName:string; createdAt:string };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [moderation, setModeration] = useState<{comments:ModerationItem[];reviews:ModerationItem[];reports:ModerationItem[]}>({comments:[],reviews:[],reports:[]});\n  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const me = await fetch("/api/v1/auth/me", { cache: "no-store" }).then(r => r.json());
    if (!me.user || me.user.role !== "admin") { setUser(null); return; }
    setUser(me.user);
    const [a, u, m, log] = await Promise.all([
      fetch("/api/v1/admin/developer-applications", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/v1/admin/game-uploads", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/v1/admin/moderation", { cache: "no-store" }).then(r => r.json())
    ]);
    setApplications(a.applications ?? []);
    setUploads(u.uploads ?? []);
    setModeration({comments:m.comments??[],reviews:m.reviews??[],reports:m.reports??[]});\n    setAudit(log.logs??[]);
  }, []);

  useEffect(() => { load().catch(() => setMessage("تعذر الاتصال بالخادم")); }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "فشل تسجيل الدخول");
      if (data.user?.role !== "admin") { await fetch("/api/v1/auth/logout", { method: "POST" }); throw new Error("هذا الحساب ليس حساب مدير"); }
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setBusy(false); }
  }

  async function postDecision(url: string, body: unknown) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "فشل حفظ القرار");
    await load();
  }

  async function decideApplication(id: number, decision: "approve" | "reject") {
    const notes = window.prompt("ملاحظات القرار (اختياري)");
    if (notes === null) return;
    setBusy(true);
    try { await postDecision(`/api/v1/admin/developer-applications/${id}/decision`, { decision, notes }); }
    catch (e) { setMessage(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setBusy(false); }
  }

  async function decideUpload(id: string, decision: "approve" | "reject") {
    const notes = window.prompt("ملاحظات القرار (اختياري)");
    if (notes === null) return;
    setBusy(true);
    try { await postDecision(`/api/v1/admin/game-uploads/${id}/decision`, { decision, notes }); }
    catch (e) { setMessage(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setBusy(false); }
  }

  async function decideModeration(type: "comment" | "review" | "report", id: number, decision: "approve" | "reject" | "resolve" | "dismiss") {
    const notes = window.prompt("ملاحظات القرار (اختياري)");
    if (notes === null) return;
    setBusy(true);
    try { await postDecision("/api/v1/admin/moderation/decision", { type, id, decision, notes }); }
    catch (e) { setMessage(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (!user) return <main className="login-shell"><section className="login-card"><div className="eyebrow">GAMEVERSE · CONTROL ROOM</div><h1>دخول الإدارة</h1><p>هذه البوابة مخصصة لحسابات الإدارة المعتمدة فقط.</p><form onSubmit={login}><label>البريد الإلكتروني<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label><label>كلمة المرور<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label><button disabled={busy}>{busy ? "جارٍ التحقق..." : "تسجيل الدخول"}</button></form>{message && <div className="notice">{message}</div>}</section></main>;

  return <main className="shell">
    <header className="top"><a className="brand" href="/">GameVerse Admin</a><div><span>{user.displayName}</span><button className="ghost" onClick={logout}>خروج</button></div></header>
    <section className="intro"><div className="eyebrow">ADMINISTRATION</div><h1>مركز إدارة المنصة</h1><p>إدارة المطورين والملفات المحجوزة والمراجعة المجتمعية.</p></section>
    {message && <div className="notice">{message}</div>}

    <section className="section"><div className="section-head"><h2>طلبات اعتماد المطورين</h2><span>{applications.length} طلب</span></div>
      {applications.length === 0 ? <p className="empty">لا توجد طلبات معلّقة.</p> : applications.map(a=><article className="card" key={a.id}><div className="card-top"><div><h3>{a.studioName}</h3><p>{a.displayName} · {a.email}</p></div></div><p>{a.description}</p><p className="muted">{a.contactEmail} {a.portfolioUrl ? " · " + a.portfolioUrl : ""}</p><div className="actions"><button onClick={()=>decideApplication(a.id,"approve")} disabled={busy}>اعتماد المطوّر</button><button className="danger" onClick={()=>decideApplication(a.id,"reject")} disabled={busy}>رفض</button></div></article>)}
    </section>

    <section className="section"><div className="section-head"><h2>ملفات الألعاب</h2><span>{uploads.length} ملف</span></div>
      {uploads.length === 0 ? <p className="empty">لا توجد ملفات مرفوعة.</p> : uploads.map(u=><article className="card" key={u.id}><div className="card-top"><div><h3>{u.title}</h3><p>{u.developerName} · {u.developerEmail}</p></div><small>{(u.sizeBytes/1024/1024).toFixed(1)} MB</small></div><p>{u.description}</p><div className="tags"><span>الرفع: {u.uploadStatus}</span><span>الفحص: {u.scanStatus}</span><span>المراجعة: {u.reviewStatus}</span></div>{u.scanStatus === "clean" && u.uploadStatus === "uploaded" && u.reviewStatus === "pending" ? <div className="actions"><button onClick={()=>decideUpload(u.id,"approve")} disabled={busy}>اعتماد ونشر</button><button className="danger" onClick={()=>decideUpload(u.id,"reject")} disabled={busy}>رفض</button></div> : <p className="muted">لا يمكن النشر قبل اكتمال الرفع وصدور نتيجة فحص نظيفة.</p>}</article>)}
    </section>

    <section className="section"><div className="section-head"><h2>الإشراف المجتمعي والبلاغات</h2><span>{moderation.comments.length+moderation.reviews.length+moderation.reports.length} عناصر</span></div>
      <h3>التعليقات</h3>{moderation.comments.map(item=><article className="card" key={"c"+item.id}><b>{item.displayName} · {item.gameSlug}</b><p>{item.body}</p><div className="actions"><button onClick={()=>decideModeration("comment",item.id,"approve")} disabled={busy}>موافقة</button><button className="danger" onClick={()=>decideModeration("comment",item.id,"reject")} disabled={busy}>رفض</button></div></article>)}
      <h3>التقييمات</h3>{moderation.reviews.map(item=><article className="card" key={"r"+item.id}><b>{item.displayName} · {item.gameSlug} · {item.rating}/5</b><p>{item.reviewText||"بدون نص"}</p><div className="actions"><button onClick={()=>decideModeration("review",item.id,"approve")} disabled={busy}>موافقة</button><button className="danger" onClick={()=>decideModeration("review",item.id,"reject")} disabled={busy}>رفض</button></div></article>)}
      <h3>البلاغات</h3>{moderation.reports.map(item=><article className="card" key={"p"+item.id}><b>{item.displayName} · {item.gameSlug} · {item.reason}</b><p>{item.details}</p><div className="actions"><button onClick={()=>decideModeration("report",item.id,"resolve")} disabled={busy}>تمت المعالجة</button><button className="danger" onClick={()=>decideModeration("report",item.id,"dismiss")} disabled={busy}>إغلاق دون إجراء</button></div></article>)}
      {!moderation.comments.length&&!moderation.reviews.length&&!moderation.reports.length&&<p className="empty">لا توجد عناصر إشراف معلّقة.</p>}
    </section>
    <section className="section"><div className="section-head"><h2>سجل العمليات الإدارية</h2><span>{audit.length} عملية</span></div>
      {audit.length===0?<p className="empty">لا توجد عمليات مسجلة بعد.</p>:audit.map(item=><article className="card audit-row" key={item.id}><b>{item.actorName} · {item.action}</b><span>{item.entityType} #{item.entityId}</span><small>{new Date(item.createdAt).toLocaleString("ar")}</small></article>)}
    </section>
    <footer>GameVerse Admin · كل قرارات الاعتماد تنفذ على الخادم مع التحقق من الصلاحيات وتسجيلها.</footer>
  </main>;
}
