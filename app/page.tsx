const features = ["مراجعة طلبات النشر","إدارة الألعاب والتصنيفات","إدارة الحسابات والصلاحيات","تقارير وسجل العمليات"];

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav"><a className="brand" href="/">GameVerse Admin</a><span className="nav-tag">المشرفون</span></nav>
      <section className="hero">
        <div className="eyebrow">GAMEVERSE · GAMEVERSE ADMIN</div>
        <h1>مركز إدارة المنصة</h1>
        <p className="lead">إدارة الألعاب والمطورين والمستخدمين وطلبات النشر من مساحة تشغيل واحدة.</p>
        <a className="primary" href="#features">لوحة التحكم<span aria-hidden="true"> ←</span></a>
      </section>
      <section id="features" className="features"><h2>منظومة متكاملة</h2><div className="grid">{features.map((feature) => <article className="card" key={feature}><span className="dot" />{feature}</article>)}</div></section>
      <footer>© {new Date().getFullYear()} GameVerse Admin. جميع الحقوق محفوظة.</footer>
    </main>
  );
}
