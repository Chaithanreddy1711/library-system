import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const formatDate = (d) => (d ? String(d).slice(0, 10) : '-');

const getErrorMessage = (err) =>
  err.response?.data?.message ||
  err.response?.data?.error ||
  err.message ||
  'Something went wrong';

const matchesSearch = (fields, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.join(' ').toLowerCase().includes(q);
};

const errorBoxStyle = {
  background: '#fee2e2',
  color: '#b91c1c',
  padding: '10px 15px',
  borderRadius: '6px',
  marginBottom: '15px'
};

const successBoxStyle = {
  background: '#dcfce7',
  color: '#166534',
  padding: '10px 15px',
  borderRadius: '6px',
  marginBottom: '15px'
};

const formStyle = {
  background: '#f8fafc',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const searchStyle = {
  padding: '8px',
  width: '300px',
  maxWidth: '100%'
};

const smallBtn = {
  color: '#fff',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '6px'
};

// NAVBAR
function Navbar() {
  return (
    <nav style={{
      background: '#1e293b',
      padding: '18px 30px',
      color: '#ffffff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px'
    }}>
      <h2 style={{ margin: 0, color: '#ffffff', fontSize: '22px' }}>
        📚 Library Management System
      </h2>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>Dashboard</Link>
        <Link to="/books" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>Books List</Link>
        <Link to="/members" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>Members</Link>
        <Link to="/transactions" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>Issue/Return</Link>
      </div>
    </nav>
  );
}

// DASHBOARD
function Dashboard({
  booksCount,
  membersCount,
  issuedCount,
  returnedCount,
  fetchAll
}) {
  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>Library Dashboard</h1>

      <p style={{ color: '#666' }}>
        Overview of Library Management Statistics (Connected to MongoDB)
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        <div style={{ background: '#3498db', color: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Total Books</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{booksCount}</p>
        </div>

        <div style={{ background: '#2ecc71', color: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Total Members</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{membersCount}</p>
        </div>

        <div style={{ background: '#f1c40f', color: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Issued Books</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{issuedCount}</p>
        </div>

        <div style={{ background: '#e74c3c', color: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Returned Books</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{returnedCount}</p>
        </div>
      </div>
    </div>
  );
}

// BOOK MANAGEMENT
function Books({ books, fetchBooks }) {
  const [form, setForm] = useState({
    title: '',
    author: '',
    category: '',
    quantity: 1
  });

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    category: '',
    quantity: 1
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.author.trim()) {
      setError('Title and author are required');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const res = await axios.post(`${API_BASE}/books`, {
        ...form,
        quantity: Number(form.quantity)
      });

      await fetchBooks();

      setForm({
        title: '',
        author: '',
        category: '',
        quantity: 1
      });

      if (res.status === 200) {
        setSuccess(`This book already exists. Added ${form.quantity} more copies to it.`);
      } else {
        setSuccess('Book added successfully ✅');
      }
    } catch (err) {
      console.error('Add Book Error:', err);
      setError(getErrorMessage(err));
    }
  };

  const startEdit = (b) => {
    setError('');
    setSuccess('');
    setEditingId(b._id);

    setEditForm({
      title: b.title,
      author: b.author,
      category: b.category,
      quantity: b.quantity
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  const handleSave = async (id) => {
    if (!editForm.title.trim() || !editForm.author.trim()) {
      setError('Title and author are required');
      return;
    }

    try {
      setError('');
      setSuccess('');

      await axios.put(`${API_BASE}/books/${id}`, {
        ...editForm,
        quantity: Number(editForm.quantity)
      });

      await fetchBooks();
      setEditingId(null);
      setSuccess('Book updated successfully ✅');
    } catch (err) {
      console.error('Update Book Error:', err);
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      setError('');
      setSuccess('');

      await axios.delete(`${API_BASE}/books/${id}`);
      await fetchBooks();

      setSuccess('Book deleted successfully ✅');
    } catch (err) {
      console.error('Delete Book Error:', err);
      setError(getErrorMessage(err));
    }
  };

  const filteredBooks = books.filter((b) =>
    matchesSearch([b.title, b.author, b.category], search)
  );

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>Book Management</h1>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {success && <div style={successBoxStyle}>{success}</div>}

      <form onSubmit={handleAdd} style={formStyle}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          style={{ padding: '8px' }}
          required
        />

        <input
          placeholder="Author"
          value={form.author}
          onChange={e => setForm({ ...form, author: e.target.value })}
          style={{ padding: '8px' }}
          required
        />

        <input
          placeholder="Category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          style={{ padding: '8px' }}
        />

        <input
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
          style={{ padding: '8px', width: '80px' }}
          min="1"
          required
        />

        <button
          type="submit"
          style={{
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Add Book
        </button>
      </form>

      <div style={{
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="🔍 Search by title, author or category"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchStyle}
        />

        <span style={{ color: '#666' }}>
          Showing {filteredBooks.length} of {books.length} books
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table border="1" cellPadding="10" style={tableStyle}>
          <thead>
            <tr style={{ background: '#ecf0f1' }}>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>Total Quantity</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBooks.map((b) =>
              editingId === b._id ? (
                <tr key={b._id} style={{ background: '#fffbeb' }}>
                  <td>
                    <input
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      style={{ padding: '6px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </td>

                  <td>
                    <input
                      value={editForm.author}
                      onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                      style={{ padding: '6px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </td>

                  <td>
                    <input
                      value={editForm.category}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      style={{ padding: '6px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      min="1"
                      value={editForm.quantity}
                      onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                      style={{ padding: '6px', width: '70px' }}
                    />
                  </td>

                  <td style={{ color: '#666' }}>{b.available}</td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleSave(b._id)}
                      style={{ ...smallBtn, background: '#16a34a' }}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{ ...smallBtn, background: '#6b7280' }}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={b._id}>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td>{b.category}</td>
                  <td>{b.quantity}</td>

                  <td style={{
                    color: b.available > 0 ? '#16a34a' : '#dc2626',
                    fontWeight: 'bold'
                  }}>
                    {b.available}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      style={{ ...smallBtn, background: '#0284c7' }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(b._id)}
                      style={{ ...smallBtn, background: '#ef4444' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}

            {filteredBooks.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#888' }}>
                  No books found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// MEMBER MANAGEMENT WITH EDIT AND DELETE
function Members({ members, fetchMembers }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setError('');
      setSuccess('');

      await axios.post(`${API_BASE}/members`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      });

      await fetchMembers();

      setForm({ name: '', email: '', phone: '' });
      setSuccess('Member added successfully ✅');
    } catch (err) {
      console.error('Add Member Error:', err);
      setError(getErrorMessage(err));
    }
  };

  const startEdit = (member) => {
    setError('');
    setSuccess('');
    setEditingId(member._id);

    setEditForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  const handleSave = async (id) => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setError('');
      setSuccess('');

      await axios.put(`${API_BASE}/members/${id}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim()
      });

      await fetchMembers();

      setEditingId(null);
      setSuccess('Member updated successfully ✅');
    } catch (err) {
      console.error('Update Member Error:', err);
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this member?'
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await axios.delete(`${API_BASE}/members/${id}`);
      await fetchMembers();

      setSuccess('Member deleted successfully ✅');
    } catch (err) {
      console.error('Delete Member Error:', err);
      setError(getErrorMessage(err));
    }
  };

  const filteredMembers = members.filter((m) =>
    matchesSearch([m.name, m.email, m.phone], search)
  );

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>Library Members</h1>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {success && <div style={successBoxStyle}>{success}</div>}

      <form onSubmit={handleAdd} style={formStyle}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{ padding: '8px' }}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          style={{ padding: '8px' }}
          required
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          style={{ padding: '8px' }}
        />

        <button
          type="submit"
          style={{
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Add Member
        </button>
      </form>

      <div style={{
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="🔍 Search by name, email or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchStyle}
        />

        <span style={{ color: '#666' }}>
          Showing {filteredMembers.length} of {members.length} members
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table border="1" cellPadding="10" style={tableStyle}>
          <thead>
            <tr style={{ background: '#ecf0f1' }}>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Membership Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredMembers.map((m) =>
              editingId === m._id ? (
                <tr key={m._id} style={{ background: '#fffbeb' }}>
                  <td>
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm({
                        ...editForm,
                        name: e.target.value
                      })}
                      style={{
                        padding: '6px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                  </td>

                  <td>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({
                        ...editForm,
                        email: e.target.value
                      })}
                      style={{
                        padding: '6px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                  </td>

                  <td>
                    <input
                      value={editForm.phone}
                      onChange={e => setEditForm({
                        ...editForm,
                        phone: e.target.value
                      })}
                      style={{
                        padding: '6px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                  </td>

                  <td>{formatDate(m.membershipDate)}</td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleSave(m._id)}
                      style={{ ...smallBtn, background: '#16a34a' }}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{ ...smallBtn, background: '#6b7280' }}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={m._id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone || '-'}</td>
                  <td>{formatDate(m.membershipDate)}</td>

                  <td>
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      style={{ ...smallBtn, background: '#0284c7' }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(m._id)}
                      style={{ ...smallBtn, background: '#ef4444' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}

            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ISSUE AND RETURN TRANSACTIONS
function Transactions({
  books,
  members,
  transactions,
  fetchBooks,
  fetchMembers,
  fetchTransactions
}) {
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBooks();
    fetchMembers();
    fetchTransactions();
  }, []);

  const handleIssue = async (e) => {
    e.preventDefault();

    if (!selectedBookId || !selectedMemberId) return;

    try {
      setError('');
      setSuccess('');

      await axios.post(`${API_BASE}/transactions/issue`, {
        bookId: selectedBookId,
        memberId: selectedMemberId
      });

      await fetchTransactions();
      await fetchBooks();

      setSelectedBookId('');
      setSelectedMemberId('');
      setSuccess('Book issued successfully ✅');
    } catch (err) {
      console.error('Issue Book Error:', err);
      setError(getErrorMessage(err));
      fetchBooks();
    }
  };

  const handleReturn = async (id) => {
    try {
      setError('');
      setSuccess('');

      await axios.put(`${API_BASE}/transactions/${id}/return`);

      await fetchTransactions();
      await fetchBooks();

      setSuccess('Book returned successfully ✅');
    } catch (err) {
      console.error('Return Book Error:', err);
      setError(getErrorMessage(err));
    }
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      (statusFilter === 'All' || t.status === statusFilter) &&
      matchesSearch([t.book, t.member], search)
  );

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>Book Issue & Return Transactions</h1>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {success && <div style={successBoxStyle}>{success}</div>}

      <form onSubmit={handleIssue} style={formStyle}>
        <select
          value={selectedBookId}
          onChange={e => setSelectedBookId(e.target.value)}
          style={{ padding: '8px' }}
          required
        >
          <option value="">Select Book</option>

          {books.map(b => (
            <option
              key={b._id}
              value={b._id}
              disabled={b.available <= 0}
            >
              {b.title} - {b.author}{' '}
              {b.available <= 0
                ? '(Not available)'
                : `(${b.available} available)`}
            </option>
          ))}
        </select>

        <select
          value={selectedMemberId}
          onChange={e => setSelectedMemberId(e.target.value)}
          style={{ padding: '8px' }}
          required
        >
          <option value="">Select Member</option>

          {members.map(m => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>

        <button
          type="submit"
          style={{
            background: '#ea580c',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Issue Book
        </button>
      </form>

      <div style={{
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="🔍 Search by book or member"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchStyle}
        />

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="All">All statuses</option>
          <option value="Issued">Issued</option>
          <option value="Returned">Returned</option>
        </select>

        <span style={{ color: '#666' }}>
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table border="1" cellPadding="10" style={tableStyle}>
          <thead>
            <tr style={{ background: '#ecf0f1' }}>
              <th>Book Title</th>
              <th>Member Name</th>
              <th>Issue Date</th>
              <th>Return Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t._id}>
                <td>{t.book}</td>
                <td>{t.member}</td>
                <td>{formatDate(t.issueDate)}</td>
                <td>{formatDate(t.returnDate)}</td>

                <td style={{
                  color: t.status === 'Issued' ? '#e67e22' : '#27ae60',
                  fontWeight: 'bold'
                }}>
                  {t.status}
                </td>

                <td>
                  {t.status === 'Issued' ? (
                    <button
                      type="button"
                      onClick={() => handleReturn(t._id)}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Return
                    </button>
                  ) : (
                    <span style={{ color: '#888' }}>Done</span>
                  )}
                </td>
              </tr>
            ))}

            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#888' }}>
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// MAIN APP
export default function App() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/books`);
      setBooks(res.data);
    } catch (err) {
      console.error('Fetch Books Error:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error('Fetch Members Error:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/transactions`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Fetch Transactions Error:', err);
    }
  };

  const fetchAll = () => {
    fetchBooks();
    fetchMembers();
    fetchTransactions();
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <Router>
      <div>
        <Navbar />

        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                booksCount={books.length}
                membersCount={members.length}
                issuedCount={transactions.filter(
                  t => t.status === 'Issued'
                ).length}
                returnedCount={transactions.filter(
                  t => t.status === 'Returned'
                ).length}
                fetchAll={fetchAll}
              />
            }
          />

          <Route
            path="/books"
            element={
              <Books
                books={books}
                fetchBooks={fetchBooks}
              />
            }
          />

          <Route
            path="/members"
            element={
              <Members
                members={members}
                fetchMembers={fetchMembers}
              />
            }
          />

          <Route
            path="/transactions"
            element={
              <Transactions
                books={books}
                members={members}
                transactions={transactions}
                fetchBooks={fetchBooks}
                fetchMembers={fetchMembers}
                fetchTransactions={fetchTransactions}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}