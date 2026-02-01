export default function Footer() {
    return (
        <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', marginTop: 'auto', background: 'var(--surface)' }}>
            <div className="container text-center">
                <p>© 2026 PsychoHealth. All rights reserved.</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Hệ thống hỗ trợ chăm sóc sức khỏe tâm lý toàn diện.
                </p>
            </div>
        </footer>
    );
}
