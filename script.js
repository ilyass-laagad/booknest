let allBooks = [];
let selectedLanguage = "All";
let selectedGenre = "All";
let currentBook = null;

const booksContainer = document.getElementById("booksContainer");
const searchInput = document.getElementById("searchInput");
const bookCount = document.getElementById("bookCount");

// ==========================================
// 1. FETCH BOOKS & FAVORITES FROM MYSQL API
// ==========================================

async function loadBooks() {
    const search = searchInput ? searchInput.value.trim() : "";
    const params = new URLSearchParams({
        search,
        language: selectedLanguage,
        genre: selectedGenre
    });

    const res = await fetch(`/api/books?${params}`);
    const books = await res.json();

    if (selectedLanguage === "All" && selectedGenre === "All" && !search) {
        allBooks = books;
    }

    displayBooks(books);
}

async function loadFavorites() {
    const favoritesContainer = document.getElementById("favoritesContainer");
    const favoritesEmpty = document.getElementById("favoritesEmpty");
    if (!favoritesContainer) return;

    const res = await fetch("/api/favorites");
    const favoriteBooks = await res.json();

    favoritesContainer.innerHTML = "";

    if (favoriteBooks.length === 0) {
        if (favoritesEmpty) favoritesEmpty.style.display = "block";
        return;
    }

    if (favoritesEmpty) favoritesEmpty.style.display = "none";

    favoriteBooks.forEach(book => {
        favoritesContainer.appendChild(createBookCard(book));
    });
}

// ==========================================
// 2. RENDER CARDS & OPEN DESCRIPTION MODAL
// ==========================================

function createBookCard(book) {
    const card = document.createElement("div");
    card.className = "book-card";

    card.innerHTML = `
        <img
            class="book-cover"
            src="${book.cover || 'https://placehold.co/300x420/32131E/F8E9ED?text=Book+Cover'}"
            alt="Couverture de ${book.title}"
            loading="lazy"
            onerror="this.onerror=null; this.src='https://placehold.co/300x420/32131E/F8E9ED?text=Book+Cover';"
        >
        <div class="book-info">
            <h3>${book.title}</h3>
            <p class="book-author">${book.author}${book.release_date ? ` (${book.release_date})` : ""}</p>
            <div class="book-tags">
                <span class="book-tag">${book.genre}</span>
                <span class="book-tag">${book.language}</span>
            </div>
            <button class="favorite-btn ${book.isFavorite ? "is-favorite" : ""}" aria-label="Favorite">
                ${book.isFavorite ? "♥" : "♡"}
            </button>
        </div>
    `;

    // Clicking the heart toggles favorite without opening the modal
    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(book.id, book.isFavorite);
    });

    // Clicking anywhere else on the card opens the description modal
    card.addEventListener("click", () => openBookModal(book));

    return card;
}

function displayBooks(bookList) {
    if (!booksContainer) return;
    booksContainer.innerHTML = "";

    if (bookList.length === 0) {
        booksContainer.innerHTML = "<p class='empty-message'>No books found.</p>";
        if (bookCount) bookCount.textContent = "0 books";
        return;
    }

    bookList.forEach(book => booksContainer.appendChild(createBookCard(book)));

    if (bookCount) {
        bookCount.textContent = `${bookList.length} books`;
    }
}

const bookModal = document.getElementById("bookModal");
const modalViewMode = document.getElementById("modalViewMode");
const editBookForm = document.getElementById("editBookForm");

function openBookModal(book) {
    currentBook = book;

    modalViewMode.hidden = false;
    editBookForm.hidden = true;

    document.getElementById("modalCover").src =
        book.cover || "https://placehold.co/300x420/32131E/F8E9ED?text=Book+Cover";
    document.getElementById("modalTitle").textContent = book.title;
    document.getElementById("modalGenre").textContent = book.genre;
    document.getElementById("modalLanguage").textContent = book.language;
    document.getElementById("modalMeta").textContent =
        `By ${book.author}` + (book.release_date ? ` • Released: ${book.release_date}` : "");
    document.getElementById("modalDescription").textContent =
        book.description || "No description available for this book yet.";

    bookModal.hidden = false;
}

function closeBookModal() {
    bookModal.hidden = true;
    currentBook = null;
}

document.getElementById("closeModalBtn")?.addEventListener("click", closeBookModal);
bookModal?.addEventListener("click", (e) => {
    if (e.target === bookModal) closeBookModal();
});

// ==========================================
// 3. MODIFY & DELETE BOOK IN MYSQL
// ==========================================

document.getElementById("editBookBtn")?.addEventListener("click", () => {
    if (!currentBook) return;

    document.getElementById("editTitle").value = currentBook.title;
    document.getElementById("editAuthor").value = currentBook.author;
    document.getElementById("editReleaseDate").value = currentBook.release_date || "";
    document.getElementById("editGenre").value = currentBook.genre;
    document.getElementById("editLanguage").value = currentBook.language;
    document.getElementById("editCover").value = currentBook.cover || "";
    document.getElementById("editDescription").value = currentBook.description || "";

    modalViewMode.hidden = true;
    editBookForm.hidden = false;
});

document.getElementById("cancelEditBtn")?.addEventListener("click", () => {
    editBookForm.hidden = true;
    modalViewMode.hidden = false;
});

editBookForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentBook) return;

    const payload = {
        title: document.getElementById("editTitle").value.trim(),
        author: document.getElementById("editAuthor").value.trim(),
        release_date: document.getElementById("editReleaseDate").value.trim() || null,
        genre: document.getElementById("editGenre").value,
        language: document.getElementById("editLanguage").value,
        cover: document.getElementById("editCover").value.trim() || null,
        description: document.getElementById("editDescription").value.trim() || null
    };

    const res = await fetch(`/api/books/${currentBook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json();
        alert("Error modifying book: " + (err.error || "Unknown error"));
        return;
    }

    closeBookModal();
    await loadBooks();
    await loadFavorites();
});

document.getElementById("deleteBookBtn")?.addEventListener("click", async () => {
    if (!currentBook) return;

    const confirmed = confirm(`Are you sure you want to delete "${currentBook.title}"?`);
    if (!confirmed) return;

    const res = await fetch(`/api/books/${currentBook.id}`, {
        method: "DELETE"
    });

    if (!res.ok) {
        const err = await res.json();
        alert("Error deleting book: " + (err.error || "Unknown error"));
        return;
    }

    closeBookModal();
    await loadBooks();
    await loadFavorites();
});

// ==========================================
// 4. ADD NEW BOOK TO MYSQL
// ==========================================

const addBookForm = document.getElementById("addBookForm");
if (addBookForm) {
    addBookForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            title: document.getElementById("bookTitle").value.trim(),
            author: document.getElementById("bookAuthor").value.trim(),
            release_date: document.getElementById("bookReleaseDate").value.trim() || null,
            genre: document.getElementById("bookGenre").value,
            language: document.getElementById("bookLanguage").value,
            cover: document.getElementById("bookCover").value.trim() || null,
            description: document.getElementById("bookDescription").value.trim() || null
        };

        const res = await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            alert("Error adding book: " + (err.error || "Unknown error"));
            return;
        }

        addBookForm.reset();
        await loadBooks();
    });
}

// ==========================================
// 5. FAVORITES, SEARCH & FILTERS
// ==========================================

async function toggleFavorite(bookId, currentlyFavorite) {
    await fetch(`/api/favorites/${bookId}`, {
        method: currentlyFavorite ? "DELETE" : "POST"
    });
    await loadBooks();
    await loadFavorites();
}

if (searchInput) searchInput.addEventListener("input", loadBooks);

document.querySelectorAll("[data-language]").forEach(button => {
    button.addEventListener("click", () => {
        selectedLanguage = button.dataset.language;
        document.querySelectorAll("[data-language]").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        loadBooks();
    });
});

document.querySelectorAll("[data-genre]").forEach(button => {
    button.addEventListener("click", () => {
        selectedGenre = button.dataset.genre;
        document.querySelectorAll("[data-genre]").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        loadBooks();
    });
});

// ==========================================
// 6. CHATBOT RECOMMENDATIONS (GENRE + DESCRIPTION KEYWORDS)
// ==========================================

const genreResponses = {
    "Fantasy": "Looking for magic and epic worlds? Here are some great Fantasy reads for you:",
    "Romance": "In the mood for love and heartfelt stories? Check out these Romance picks:",
    "Mystery": "Ready to solve a thrilling puzzle? Here are some gripping Mystery books:",
    "Drama": "Here are some emotional and deeply moving Drama stories:",
    "Science": "Curious about how the universe works? Here are top Science picks:",
    "Poetry": "Here are some beautiful Poetry collections to inspire you:",
    "Adventure": "Ready for action and unforgettable journeys? Try these Adventure books:",
    "Philosophy": "Looking for deep ideas and reflection? Here are great Philosophy reads:",
    "Biography": "Interested in real lives and inspiring journeys? Check out these Biographies:",
    "History": "Step back in time with these compelling History books:",
    "Self Development": "Want to build better habits and grow? Here are top Self Development picks:",
    "Inspirational": "Here are some uplifting and Inspirational books for you:"
};

// Common filler words to ignore when extracting keywords from user queries
const stopWords = new Set([
    "i", "me", "my", "a", "an", "the", "is", "are", "was", "for", "to", "of", "in", "on", "with",
    "want", "need", "like", "find", "book", "books", "recommend", "recommendation", "about", "some", "any", "that",
    "je", "veux", "un", "une", "des", "le", "la", "les", "de", "du", "livre", "livres", "sur", "avec", "pour",
    "بغيت", "شي", "كتاب", "كتب", "عن", "في", "من", "على"
]);

function extractKeywords(text) {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
}

async function sendMessage() {
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    if (!chatInput || !chatMessages) return;

    const question = chatInput.value.trim();
    if (!question) return;

    addMessage(question, "user-message");
    chatInput.value = "";

    // Always fetch the latest books from MySQL so newly added/edited descriptions are included
    const res = await fetch("/api/books");
    allBooks = await res.json();

    const response = getBotResponse(question);

    setTimeout(() => {
        addMessage(response.text, "bot-message");
        if (response.books.length > 0) displayChatRecommendations(response.books);
    }, 400);
}

function addMessage(message, className) {
    const chatMessages = document.getElementById("chatMessages");
    const el = document.createElement("div");
    el.className = `message ${className}`;
    el.textContent = message;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotResponse(question) {
    const q = question.toLowerCase();
    let genre = null;
    let language = null;

    // 1. Detect Genre
    if (q.includes("fantasy") || q.includes("fantastique") || q.includes("magic") || q.includes("خيال")) {
        genre = "Fantasy";
    } else if (q.includes("romance") || q.includes("romantic") || q.includes("romantique") || q.includes("amour") || q.includes("love") || q.includes("حب") || q.includes("رومانسي")) {
        genre = "Romance";
    } else if (q.includes("mystery") || q.includes("mystère") || q.includes("thriller") || q.includes("detective") || q.includes("غموض")) {
        genre = "Mystery";
    } else if (q.includes("drama") || q.includes("drame") || q.includes("sad") || q.includes("حزن") || q.includes("دراما")) {
        genre = "Drama";
    } else if (q.includes("science") || q.includes("physics") || q.includes("space") || q.includes("علم") || q.includes("علوم")) {
        genre = "Science";
    } else if (q.includes("poetry") || q.includes("poem") || q.includes("poésie") || q.includes("شعر")) {
        genre = "Poetry";
    } else if (q.includes("adventure") || q.includes("aventure") || q.includes("مغامرة")) {
        genre = "Adventure";
    } else if (q.includes("philosophy") || q.includes("philosophie") || q.includes("فلسفة")) {
        genre = "Philosophy";
    } else if (q.includes("biography") || q.includes("biographie") || q.includes("سيرة")) {
        genre = "Biography";
    } else if (q.includes("history") || q.includes("histoire") || q.includes("تاريخ")) {
        genre = "History";
    } else if (q.includes("habit") || q.includes("development") || q.includes("développement") || q.includes("تطوير الذات")) {
        genre = "Self Development";
    } else if (q.includes("inspirational") || q.includes("motivation") || q.includes("inspire") || q.includes("تحفيز")) {
        genre = "Inspirational";
    }

    // 2. Detect Language
    if (q.includes("arabic") || q.includes("arabe") || q.includes("العربية") || q.includes("عربي")) {
        language = "Arabic";
    } else if (q.includes("french") || q.includes("français") || q.includes("francais") || q.includes("فرنسي")) {
        language = "French";
    } else if (q.includes("english") || q.includes("anglais") || q.includes("إنجليزي")) {
        language = "English";
    }

    // 3. Extract keywords from the question to match against book descriptions, titles & authors
    const keywords = extractKeywords(q);

    const keywordMatches = allBooks.filter(book => {
        if (language && book.language !== language) return false;
        const searchable = `${book.title} ${book.author} ${book.description || ""}`.toLowerCase();
        return keywords.some(kw => searchable.includes(kw));
    });

    // Prioritize description/title keyword matches if no explicit genre was requested
    if (!genre && keywordMatches.length > 0) {
        const matchedWords = keywords.filter(kw =>
            keywordMatches.some(b => `${b.title} ${b.author} ${b.description || ""}`.toLowerCase().includes(kw))
        );
        return {
            text: `I found books matching "${matchedWords.join(", ")}" in their description:`,
            books: keywordMatches.slice(0, 3)
        };
    }

    // 4. Filter by Genre / Language (and rank description keyword matches first)
    let recommendations = allBooks.filter(book =>
        (!genre || book.genre === genre) && (!language || book.language === language)
    );

    if (keywords.length > 0) {
        recommendations.sort((a, b) => {
            const scoreA = keywords.filter(kw => (a.description || "").toLowerCase().includes(kw)).length;
            const scoreB = keywords.filter(kw => (b.description || "").toLowerCase().includes(kw)).length;
            return scoreB - scoreA;
        });
    }

    if (recommendations.length === 0) {
        const label = [language, genre].filter(Boolean).join(" ");
        return {
            text: `Sorry, I couldn't find any ${label || ""} books matching your request. Try another keyword or genre!`,
            books: []
        };
    }

    let replyText = "Here are some books I recommend for you:";
    if (genre && genreResponses[genre]) {
        replyText = genreResponses[genre];
    } else if (language) {
        replyText = `Here are some great ${language} books from our collection:`;
    }

    return {
        text: replyText,
        books: recommendations.slice(0, 3)
    };
}

function displayChatRecommendations(recommendations) {
    const chatMessages = document.getElementById("chatMessages");
    const container = document.createElement("div");
    container.className = "chat-recommendations";

    recommendations.forEach(book => {
        const item = document.createElement("div");
        item.className = "chat-book";
        item.innerHTML = `
            <img src="${book.cover || 'https://placehold.co/100x140/32131E/F8E9ED?text=Book'}" alt="${book.title}">
            <div class="chat-book-info">
                <strong>${book.title}</strong>
                <span>${book.author}</span>
            </div>
        `;
        item.style.cursor = "pointer";
        item.addEventListener("click", () => openBookModal(book));
        container.appendChild(item);
    });

    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById("sendBtn")?.addEventListener("click", sendMessage);
document.getElementById("chatInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
});
document.querySelectorAll(".suggestion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const input = document.getElementById("chatInput");
        if (input) {
            input.value = btn.dataset.question || btn.textContent.trim();
            sendMessage();
        }
    });
});

// ==========================================
// 7. INITIALIZE
// ==========================================
loadBooks();
loadFavorites();