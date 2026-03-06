import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function AdminVerifyPage() {
    const location = useLocation();
    const email = location.state?.email || 'your email';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0F2240', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Verify your account</h1>
            <p style={{ marginBottom: '30px', color: '#8A8578' }}>
                We've sent a code to: <strong style={{ color: '#E8740C' }}>{email}</strong>
            </p>
            <div style={{ background: '#1A3A5C', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '400px', width: '100%' }}>
                <input
                    type="text"
                    placeholder="000000"
                    style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#0F2240', border: '1px solid #E8740C', color: 'white', fontSize: '1.5rem', textAlign: 'center', marginBottom: '20px' }}
                />
                <button style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#E8740C', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                    Confirm OTP
                </button>
            </div>
            <Link to="/admin/login" style={{ marginTop: '20px', color: '#E8740C', textDecoration: 'none' }}>Back to Login</Link>
        </div>
    );
}

export default AdminVerifyPage;
