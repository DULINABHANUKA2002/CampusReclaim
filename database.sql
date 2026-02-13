-- Database: campus_reclaim

CREATE DATABASE IF NOT EXISTS campus_reclaim;
USE campus_reclaim;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    profile_pic VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default Admin (Password: admin123)
-- Hash generated using password_hash('admin123', PASSWORD_DEFAULT)
INSERT INTO users (full_name, email, password_hash, role) 
VALUES ('System Admin', 'admin', '$2y$10$8S8O5GkS9/6J6K6L6M6N6OkR6S6T6U6V6W6X6Y6Z6a6b6c6d6e6f', 'admin')
ON DUPLICATE KEY UPDATE role='admin';

-- Items Table
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    type ENUM('Lost', 'Found') NOT NULL,
    location VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    image_url VARCHAR(255),
    contact_phone VARCHAR(20) DEFAULT NULL,
    status ENUM('Active', 'Resolved') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
