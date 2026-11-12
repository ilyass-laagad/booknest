const express = require("express");
const { initDb, getPool } = require("./db");

const app = express();
app.use(express.json());

// Wraps async handlers so errors return a 500 instead of crashing
const wrap = fn => (req, res) =>
    fn(req, res).catch(err => {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    });

// ---------- BOOKS ----------
// GET /api/books?search=&language=&genre=
app.get("/api/books", wrap(async (req, res) => {
    const { search = "", language = "All", genre = "All" } = req.query;
    const like = `%${search}%`;

    const [rows] = await getPool().query(`
        SELECT b.*, (f.book_id IS NOT NULL) AS isFavorite
        FROM books b
        LEFT JOIN favorites f ON f.book_id = b.id
        WHERE (b.title LIKE ? OR b.author LIKE ? OR b.genre LIKE ? OR b.description LIKE ?)
          AND (? = 'All' OR b.language = ?)
          AND (? = 'All' OR b.genre = ?)
        ORDER BY b.id
    `, [like, like, like, like, language, language, genre, genre]);

    res.json(rows.map(r => ({ ...r, isFavorite: !!r.isFavorite })));
}));

// POST /api/books
app.post("/api/books", wrap(async (req, res) => {
    const {
        title,
        author,
        release_date = null,
        genre,
        language,
        cover = null,
        description = null
    } = req.body;

    if (!title || !author || !genre || !language) {
        return res.status(400).json({
            error: "title, author, genre and language are required"
        });
    }

    try {
        const [result] = await getPool().query(
            "INSERT INTO books (title, author, release_date, genre, language, cover, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [title, author, release_date, genre, language, cover, description]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}));

// PUT /api/books/:id (Modify an existing book)
app.put("/api/books/:id", wrap(async (req, res) => {
    const bookId = Number(req.params.id);
    const {
        title,
        author,
        release_date = null,
        genre,
        language,
        cover = null,
        description = null
    } = req.body;

    if (!title || !author || !genre || !language) {
        return res.status(400).json({
            error: "title, author, genre and language are required"
        });
    }

    try {
        const [result] = await getPool().query(
            `UPDATE books
             SET title = ?, author = ?, release_date = ?, genre = ?, language = ?, cover = ?, description = ?
             WHERE id = ?`,
            [title, author, release_date, genre, language, cover, description, bookId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Book not found" });
        }

        res.json({ id: bookId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}));

// DELETE /api/books/:id (Delete a book)
app.delete("/api/books/:id", wrap(async (req, res) => {
    const bookId = Number(req.params.id);
    const [result] = await getPool().query("DELETE FROM books WHERE id = ?", [bookId]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Book not found" });
    }

    res.json({ deletedId: bookId });
}));

// ---------- FAVORITES ----------
app.get("/api/favorites", wrap(async (req, res) => {
    const [rows] = await getPool().query(`
        SELECT b.*
        FROM favorites f JOIN books b ON b.id = f.book_id
        ORDER BY f.created_at DESC, b.id DESC
    `);
    res.json(rows.map(r => ({ ...r, isFavorite: true })));
}));

app.post("/api/favorites/:bookId", wrap(async (req, res) => {
    const bookId = Number(req.params.bookId);

    const [books] = await getPool().query("SELECT id FROM books WHERE id = ?", [bookId]);
    if (books.length === 0) return res.status(404).json({ error: "Book not found" });

    await getPool().query("INSERT IGNORE INTO favorites (book_id) VALUES (?)", [bookId]);
    res.status(201).json({ bookId, isFavorite: true });
}));

app.delete("/api/favorites/:bookId", wrap(async (req, res) => {
    const bookId = Number(req.params.bookId);
    await getPool().query("DELETE FROM favorites WHERE book_id = ?", [bookId]);
    res.json({ bookId, isFavorite: false });
}));

// ---------- FRONTEND ----------
app.use(express.static(__dirname, { index: "index.html" }));

// ---------- START ----------
const PORT = process.env.PORT || 3000;

initDb()
    .then(() => {
        app.listen(PORT, () =>
            console.log(`BookNest running on http://localhost:${PORT}`)
        );
    })
    .catch(err => {
        console.error("Could not connect to MySQL:", err.message);
        console.error("Check that MySQL is running and the DB_USER / DB_PASSWORD settings are right.");
        process.exit(1);
    });