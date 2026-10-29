require('dotenv').config(); // Load variables from the .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas Connection String (stored in the .env file, never in the code)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is missing. Create a .env file in the server folder (see .env.example).');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected Successfully');
    // Cleanup: remove leading/trailing spaces from existing book titles and authors
    try {
      await Book.updateMany(
        {},
        [{ $set: { title: { $trim: { input: '$title' } }, author: { $trim: { input: '$author' } } } }],
        { updatePipeline: true }
      );
    } catch (e) {
      console.log('Book cleanup skipped:', e.message);
    }
  })
  .catch(err => console.log('MongoDB Connection Error:', err.message));

// Helper: today's date as YYYY-MM-DD
const today = () => new Date().toISOString().split('T')[0];

// Normalize text for comparison: trim, collapse repeated spaces, ignore case
const clean = (s) => String(s || '').trim().replace(/\s+/g, ' ');
const normalize = (s) => clean(s).toLowerCase();

// ---------------------------------------------------------------------------
// Schemas & Models
// ---------------------------------------------------------------------------
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  quantity: { type: Number, default: 1, min: 1 },
  available: { type: Number, default: 1, min: 0 }
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  membershipDate: { type: String, default: today }
}, { timestamps: true });

const Member = mongoose.model('Member', memberSchema);

const transactionSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },      // exact book reference
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },  // exact member reference
  book: { type: String, required: true },     // book title (for display)
  member: { type: String, required: true },   // member name (for display)
  issueDate: { type: String, default: today },
  returnDate: { type: String, default: '' },
  status: { type: String, default: 'Issued' }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

// ---------------------------------------------------------------------------
// BOOKS APIS
// ---------------------------------------------------------------------------
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error('GET Books Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const title = clean(req.body.title);
    const author = clean(req.body.author);
    const qty = parseInt(req.body.quantity) || 1;

    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }
    if (qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // If the same title + author already exists, add copies to it instead of creating a duplicate
    const allBooks = await Book.find();
    const existing = allBooks.find(
      (b) => normalize(b.title) === normalize(title) && normalize(b.author) === normalize(author)
    );
    if (existing) {
      existing.quantity += qty;
      existing.available += qty;
      const updated = await existing.save();
      console.log(`Book already exists, added ${qty} copies:`, updated.title);
      return res.status(200).json(updated);
    }

    const newBook = new Book({
      title,
      author,
      category: clean(req.body.category) || 'General',
      quantity: qty,
      available: qty
    });
    const savedBook = await newBook.save();
    console.log('Book Added:', savedBook.title);
    res.status(201).json(savedBook);
  } catch (err) {
    console.error('POST Book Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// EDIT BOOK
app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const title = clean(req.body.title);
    const author = clean(req.body.author);
    const category = clean(req.body.category) || 'General';
    const quantity = parseInt(req.body.quantity);

    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Copies that are currently issued must stay covered by the total quantity
    const issuedCount = book.quantity - book.available;
    if (quantity < issuedCount) {
      return res.status(400).json({
        message: `Quantity cannot be less than ${issuedCount}, because that many copies are currently issued`
      });
    }

    // Do not allow two books with the same title and author
    const others = await Book.find({ _id: { $ne: id } });
    const duplicate = others.some(
      (b) => normalize(b.title) === normalize(title) && normalize(b.author) === normalize(author)
    );
    if (duplicate) {
      return res.status(400).json({ message: 'Another book with the same title and author already exists' });
    }

    // Update only if the copy counts have not changed in the meantime (for example by an issue or return)
    const updated = await Book.findOneAndUpdate(
      { _id: id, quantity: book.quantity, available: book.available },
      { title, author, category, quantity, available: quantity - issuedCount },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ message: 'This book was changed by another action. Please try again.' });
    }

    console.log('Book Updated:', updated.title);
    res.json(updated);
  } catch (err) {
    console.error('PUT Book Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// DELETE BOOK
app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Do not allow deleting a book that is currently issued.
    // Older transactions may have no bookId, so those are matched by title instead.
    const issued = await Transaction.exists({
      status: 'Issued',
      $or: [
        { bookId: id },
        { bookId: null, book: book.title }
      ]
    });
    if (issued) {
      return res.status(400).json({ message: 'Cannot delete: this book is currently issued to a member' });
    }

    await Book.findByIdAndDelete(id);
    console.log('Book Deleted:', book.title);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error('DELETE Book Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------------------------
// MEMBERS APIS
// ---------------------------------------------------------------------------
app.get('/api/members', async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (err) {
    console.error('GET Members Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Email must be unique (ignoring case and extra spaces)
    const members = await Member.find();
    const emailTaken = members.some((m) => normalize(m.email) === email);
    if (emailTaken) {
      return res.status(400).json({ message: 'A member with this email already exists' });
    }

    const newMember = new Member({
      name,
      email,
      phone: clean(req.body.phone),
      membershipDate: today()
    });
    const savedMember = await newMember.save();
    console.log('Member Added:', savedMember.name);
    res.status(201).json(savedMember);
  } catch (err) {
    console.error('POST Member Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// EDIT MEMBER
app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid member id' });
    }

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const phone = clean(req.body.phone);

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check email uniqueness only when the email is being changed
    if (normalize(member.email) !== email) {
      const others = await Member.find({ _id: { $ne: id } });
      if (others.some((m) => normalize(m.email) === email)) {
        return res.status(400).json({ message: 'A member with this email already exists' });
      }
    }

    member.name = name;
    member.email = email;
    member.phone = phone;
    const updated = await member.save();

    console.log('Member Updated:', updated.name);
    res.json(updated);
  } catch (err) {
    console.error('PUT Member Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// DELETE MEMBER
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid member id' });
    }

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Do not allow deleting a member who still has an issued book.
    // Older transactions may have no memberId, so those are matched by name instead.
    const hasIssued = await Transaction.exists({
      status: 'Issued',
      $or: [
        { memberId: id },
        { memberId: null, member: member.name }
      ]
    });
    if (hasIssued) {
      return res.status(400).json({ message: 'Cannot delete: this member has an issued book that is not returned yet' });
    }

    await Member.findByIdAndDelete(id);
    console.log('Member Deleted:', member.name);
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('DELETE Member Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------------------------------------------------
// TRANSACTIONS APIS
// ---------------------------------------------------------------------------
app.get('/api/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    console.error('GET Transactions Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ISSUE BOOK (uses bookId and memberId)
app.post('/api/transactions/issue', async (req, res) => {
  try {
    const { bookId, memberId } = req.body;

    if (!mongoose.isValidObjectId(bookId) || !mongoose.isValidObjectId(memberId)) {
      return res.status(400).json({ message: 'Valid bookId and memberId are required' });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Decrease available copies only if at least one copy is available
    const book = await Book.findOneAndUpdate(
      { _id: bookId, available: { $gt: 0 } },
      { $inc: { available: -1 } },
      { new: true }
    );

    if (!book) {
      const exists = await Book.exists({ _id: bookId });
      if (!exists) {
        return res.status(404).json({ message: 'Book not found' });
      }
      return res.status(400).json({ message: 'No copies available' });
    }

    try {
      const savedTx = await new Transaction({
        bookId: book._id,
        memberId: member._id,
        book: book.title,
        member: member.name,
        issueDate: today(),
        status: 'Issued'
      }).save();

      console.log(`Book Issued: ${book.title} -> ${member.name}`);
      res.status(201).json(savedTx);
    } catch (saveErr) {
      // Roll back the copy count if saving the transaction failed
      await Book.findByIdAndUpdate(book._id, { $inc: { available: 1 } });
      throw saveErr;
    }
  } catch (err) {
    console.error('Issue Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// RETURN BOOK
app.put('/api/transactions/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid transaction id' });
    }

    // Mark as returned only if it is still issued (prevents double return)
    const tx = await Transaction.findOneAndUpdate(
      { _id: id, status: 'Issued' },
      { status: 'Returned', returnDate: today() },
      { new: true }
    );

    if (!tx) {
      const exists = await Transaction.exists({ _id: id });
      if (!exists) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      return res.status(400).json({ message: 'Book already returned' });
    }

    // Increase available copies, but never above total quantity
    const bookFilter = tx.bookId ? { _id: tx.bookId } : { title: tx.book };
    await Book.findOneAndUpdate(
      { ...bookFilter, $expr: { $lt: ['$available', '$quantity'] } },
      { $inc: { available: 1 } }
    );

    console.log(`Book Returned: ${tx.book} <- ${tx.member}`);
    res.json(tx);
  } catch (err) {
    console.error('Return Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));