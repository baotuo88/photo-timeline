// server.js (最终部署到 Render 的版本)

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { Pool } = require('pg'); // 使用 pg 连接 PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

// 配置 PostgreSQL 连接池 (Render 会自动提供 DATABASE_URL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- 中间件 ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'a_fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 
    }
}));
app.use(express.static(path.join(__dirname, 'public')));
function requireAuth(req, res, next) { if (req.session.isAuthenticated) { next(); } else { res.redirect('/login.html'); } }
function requireApiAuth(req, res, next) { if (req.session.isAuthenticated) { next(); } else { res.status(401).json({ message: 'Unauthorized' }); } }
function noCache(req, res, next) { res.setHeader('Cache-Control', 'no-store'); next(); }
app.get('/admin', requireAuth, noCache, (req, res) => { res.sendFile(path.join(__dirname, 'public', 'admin.html')); });
app.get('/manage.html', requireAuth, noCache, (req, res) => { res.sendFile(path.join(__dirname, 'public', 'manage.html')); });

// --- API 路由 (使用 PostgreSQL) ---

// API 分页
app.get('/api/photos', async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const offset = (page - 1) * limit;

    try {
        const totalResult = await pool.query("SELECT COUNT(*) FROM photos");
        const total = parseInt(totalResult.rows[0].count, 10);
        
        const photosResult = await pool.query('SELECT *, to_char("createdAt", \'YYYY-MM-DD\') as formatted_date FROM photos ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2', [limit, offset]);
        
        res.json({ photos: photosResult.rows, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching photos" });
    }
});

// 上传并生成缩略图
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/upload', requireApiAuth, upload.array('photo', 10), async (req, res) => {
    const { date, description } = req.body;
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: '没有上传文件' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sql = 'INSERT INTO photos (date, description, "imageUrl", "thumbnailUrl") VALUES ($1, $2, $3, $4)';

        for (const file of req.files) {
            const timestamp = Date.now();
            const originalFilename = `${timestamp}-${file.originalname}`;
            const thumbnailFilename = `${timestamp}-thumb-${file.originalname}`;
            
            // 这个路径现在会指向 Render 的持久化磁盘
            const uploadsPath = path.join(__dirname, 'public/uploads');
            await fs.mkdir(uploadsPath, { recursive: true });
            const originalPath = path.join(uploadsPath, originalFilename);
            const thumbnailPath = path.join(uploadsPath, thumbnailFilename);

            await sharp(file.buffer).resize({ width: 1920, withoutEnlargement: true }).toFile(originalPath);
            await sharp(file.buffer).resize({ width: 400 }).toFile(thumbnailPath);

            await client.query(sql, [date, description, `/uploads/${originalFilename}`, `/uploads/${thumbnailFilename}`]);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: `上传成功！共 ${req.files.length} 张照片已添加。` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: '上传失败' });
    } finally {
        client.release();
    }
});

// 更新
app.put('/api/photos/:id', requireApiAuth, async (req, res) => {
    const { date, description } = req.body;
    try {
        const result = await pool.query('UPDATE photos SET date = $1, description = $2 WHERE id = $3', [date, description, req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ message: '照片未找到' });
        res.json({ message: '更新成功！' });
    } catch (err) {
        res.status(500).json({ message: '更新失败' });
    }
});

// 删除
app.delete('/api/photos/:id', requireApiAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const findResult = await client.query('SELECT "imageUrl", "thumbnailUrl" FROM photos WHERE id = $1', [req.params.id]);
        if (findResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "照片未找到" });
        }
        
        const row = findResult.rows[0];
        // 从持久化磁盘删除文件
        if (row.imageUrl) await fs.unlink(path.join(__dirname, 'public', row.imageUrl));
        if (row.thumbnailUrl) await fs.unlink(path.join(__dirname, 'public', row.thumbnailUrl));

        await client.query("DELETE FROM photos WHERE id = $1", [req.params.id]);
        await client.query('COMMIT');
        res.json({ message: '删除成功！' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "删除失败" });
    } finally {
        client.release();
    }
});


// --- 启动服务器 ---
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));