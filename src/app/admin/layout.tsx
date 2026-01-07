export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '200px',
        background: '#1a1a24',
        padding: '20px 0',
        borderRight: '1px solid #2a2a3a',
      }}>
        <h2 style={{ 
          padding: '0 20px 20px', 
          color: '#ffc864',
          fontSize: '18px',
          fontWeight: '300',
          margin: 0,
        }}>
          管理端
        </h2>
        <nav>
          <a href="/admin/content" style={{
            display: 'block',
            padding: '12px 20px',
            color: '#999',
            textDecoration: 'none',
          }}>
            内容模板
          </a>
          <a href="/admin/tags" style={{
            display: 'block',
            padding: '12px 20px',
            color: '#999',
            textDecoration: 'none',
          }}>
            标签管理
          </a>
          <a href="/admin/statistics" style={{
            display: 'block',
            padding: '12px 20px',
            color: '#999',
            textDecoration: 'none',
          }}>
            使用统计
          </a>
        </nav>
        <div style={{ marginTop: '40px', padding: '0 20px' }}>
          <a href="/" style={{
            color: '#666',
            textDecoration: 'none',
            fontSize: '14px',
          }}>
            ← 返回首页
          </a>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '30px', background: '#0a0a12' }}>
        {children}
      </main>
    </div>
  );
}
