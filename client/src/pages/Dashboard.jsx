import React from 'react';

const Dashboard = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Library Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: '#3498db', color: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Total Books</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
        </div>
        <div style={{ background: '#2ecc71', color: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Total Members</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
        </div>
        <div style={{ background: '#f1c40f', color: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Issued Books</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
        </div>
        <div style={{ background: '#e74c3c', color: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Returned Books</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
        </div>
      </div>
    </div>
  );
};