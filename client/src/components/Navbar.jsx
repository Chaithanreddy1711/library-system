import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ background: '#2c3e50', padding: '1rem', color: '#fff' }}>
      <h2>📚 Library Management System</h2>
      <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/books" style={{ color: '#fff', textDecoration: 'none' }}>Books</Link>
        <Link to="/members" style={{ color: '#fff', textDecoration: 'none' }}>Members</Link>
        <Link to="/transactions" style={{ color: '#fff', textDecoration: 'none' }}>Issue / Return</Link>
      </div>
    </nav>
  );
};