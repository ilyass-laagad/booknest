-- BookNest database schema (MySQL 8+ / MariaDB 10.4+)

CREATE DATABASE IF NOT EXISTS booknest
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE booknest;

CREATE TABLE IF NOT EXISTS books (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    author       VARCHAR(255) NOT NULL,
    release_date VARCHAR(50)  NULL,
    genre        VARCHAR(50)  NOT NULL,
    language     ENUM('Arabic', 'French', 'English') NOT NULL,
    cover        VARCHAR(500) NULL,
    description  TEXT         NULL,
    UNIQUE KEY uq_title_author (title, author),
    INDEX idx_books_genre (genre),
    INDEX idx_books_language (language)
) ENGINE=InnoDB;

-- One row = one favorited book
CREATE TABLE IF NOT EXISTS favorites (
    book_id    INT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorites_book
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;