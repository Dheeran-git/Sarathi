import React from 'react';
import { Link } from 'react-router-dom';

function AdminSignupPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0F2240', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Admin Registration</h1>
            <p style={{ marginBottom: '30px', color: '#8A8578' }}>
                Join the official Sarathi administrative team.
            </p>
            <div style={{ background: '#1A3A5C', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '400px', width: '100%' }}>
                <input
                    type="email"
                    placeholder="Official Email"
                    style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#0F2240', border: '1px solid rgba(255,255,255,0.2)', color: 'white', marginBottom: '15px' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#0F2240', border: '1px solid rgba(255,255,255,0.2)', color: 'white', marginBottom: '20px' }}
                />
                <button style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#E8740C', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                    Register Admin
                </button>
            </div>
            <p style={{ marginTop: '20px' }}>
                Already have an account? <Link to="/admin/login" style={{ color: '#E8740C', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
            </p>
        </div>
    );
}

export default AdminSignupPage;
