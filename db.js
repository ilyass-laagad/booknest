const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Connection settings (override with environment variables if needed)
const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
};

const DB_NAME = "booknest"; // must match the name in schema.sql

const seedBooks = [
    ["أرض زيكولا", "عمرو عبد الحميد", "2010", "Fantasy", "Arabic", "https://covers.openlibrary.org/b/title/Zikola-L.jpg", "شاب يجد نفسه في أرض غريبة تُستخدم فيها وحدات الذكاء بدلاً من النقود."],
    ["رجال في الشمس", "غسان كنفاني", "1963", "Drama", "Arabic", "https://covers.openlibrary.org/b/title/Men%20in%20the%20Sun-L.jpg", "رواية تروي رحلة ثلاثة لاجئين فلسطينيين يبحثون عن حياة أفضل."],
    ["لأنك الله", "علي بن جابر الفيفي", "2016", "Inspirational", "Arabic", "https://covers.openlibrary.org/b/title/لأنك%20الله-L.jpg", "رحلة تأملية في معاني أسماء الله الحسنى بأسلوب روحاني قريب من القلب."],
    ["الأيام", "طه حسين", "1929", "Biography", "Arabic", "https://covers.openlibrary.org/b/title/الأيام-L.jpg", "السيرة الذاتية لعميد الأدب العربي طه حسين منذ طفولته في صعيد مصر."],
    ["أثر الفراشة", "محمود درويش", "2008", "Poetry", "Arabic", "https://covers.openlibrary.org/b/title/أثر%20الفراشة-L.jpg", "يوميات شعرية ونثرية كتبها محمود درويش في سنواته الأخيرة."],
    ["Le Petit Prince", "Antoine de Saint-Exupéry", "1943", "Philosophy", "French", "https://covers.openlibrary.org/b/title/The%20Little%20Prince-L.jpg", "Un conte poétique et philosophique sur l'amitié, l'amour et le sens de la vie."],
    ["Les Misérables", "Victor Hugo", "1862", "History", "French", "https://covers.openlibrary.org/b/title/Les%20Miserables-L.jpg", "Une fresque sociale suivant le destin de Jean Valjean dans la France du XIXe siècle."],
    ["L'Étranger", "Albert Camus", "1942", "Philosophy", "French", "https://covers.openlibrary.org/b/title/The%20Stranger-L.jpg", "L'histoire de Meursault, un homme indifférent au monde et aux conventions sociales."],
    ["Le Comte de Monte-Cristo", "Alexandre Dumas", "1844", "Adventure", "French", "https://covers.openlibrary.org/b/title/The%20Count%20of%20Monte%20Cristo-L.jpg", "Emprisonné à tort, Edmond Dantès s'évade et prépare méthodiquement sa vengeance."],
    ["Une si longue lettre", "Mariama Bâ", "1979", "Drama", "French", "https://covers.openlibrary.org/b/title/So%20Long%20a%20Letter-L.jpg", "Une lettre poignante sur la condition féminine, l'amitié et la résilience au Sénégal."],
    ["Pride and Prejudice", "Jane Austen", "1813", "Romance", "English", "https://covers.openlibrary.org/b/title/Pride%20and%20Prejudice-L.jpg", "Elizabeth Bennet navigates love, class, and misunderstandings with the proud Mr. Darcy."],
    ["The Hobbit", "J. R. R. Tolkien", "1937", "Fantasy", "English", "https://covers.openlibrary.org/b/title/The%20Hobbit-L.jpg", "Bilbo Baggins is swept into an epic quest to reclaim a dwarf kingdom from the dragon Smaug."],
    ["And Then There Were None", "Agatha Christie", "1939", "Mystery", "English", "https://covers.openlibrary.org/b/title/And%20Then%20There%20Were%20None-L.jpg", "Ten strangers invited to an isolated island begin dying one by one."],
    ["Atomic Habits", "James Clear", "2018", "Self Development", "English", "https://covers.openlibrary.org/b/title/Atomic%20Habits-L.jpg", "A practical guide on how tiny daily habits compound into remarkable results."],
    ["A Brief History of Time", "Stephen Hawking", "1988", "Science", "English", "https://covers.openlibrary.org/b/title/A%20Brief%20History%20of%20Time-L.jpg", "An accessible exploration of black holes, the Big Bang, and the nature of time."]
];

let pool;

// Creates the database + tables if needed, seeds the books, returns the pool
async function initDb() {
    // 1. Run schema.sql
    const setup = await mysql.createConnection({ ...config, multipleStatements: true });
    await setup.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
    await setup.end();

    // 2. Connection pool used by the app
    pool = mysql.createPool({
        ...config,
        database: DB_NAME,
        charset: "utf8mb4",
        waitForConnections: true,
        connectionLimit: 10
    });

    // 3. Seed books
    await pool.query(
        "INSERT IGNORE INTO books (title, author, release_date, genre, language, cover, description) VALUES ?",
        [seedBooks]
    );

    return pool;
}

module.exports = { initDb, getPool: () => pool };