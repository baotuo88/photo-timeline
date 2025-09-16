// database-setup.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    // 创建 photos 表
    db.run(`
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            imageUrl TEXT NOT NULL,
            thumbnailUrl TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error("Error creating table:", err.message);
        } else {
            console.log("'photos' table created or already exists.");
            // 你可以在这里添加一个索引来优化按日期的查询
            db.run("CREATE INDEX IF NOT EXISTS idx_date ON photos(date)", (err) => {
                if (err) {
                    console.error("Error creating index:", err.message);
                } else {
                    console.log("Index on 'date' created or already exists.");
                }
            });
        }
    });
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Database setup complete. Closed the database connection.');
});