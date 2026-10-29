/**
 * SIM-PERSEDIAAN RUTAN KELAS II B SIAK SRI INDRAPURA
 * Server Database Lokal & Sinkronisasi Real-Time (Node.js)
 * Zero-dependency: Berjalan murni menggunakan modul bawaan Node.js (http, fs, path, os)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const url = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DB_DIR = path.join(__dirname, "database");
const BACKUP_DIR = path.join(DB_DIR, "backups");

// Pastikan folder database dan backup ada
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Daftar klien SSE (Server-Sent Events) untuk notifikasi real-time
let sseClients = [];
let lastModifiedTimestamp = Date.now();

// Utility MIME Types
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf"
};

// Helper: Broadcast event ke seluruh tab dan browser yang terhubung
function broadcastRealtime(event, data) {
  lastModifiedTimestamp = Date.now();
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch (e) {
      // Abaikan jika client terputus
    }
  });
}

// Helper: Baca file JSON lokal dengan fallback
function readJsonFile(filename, defaultData) {
  const filePath = path.join(DB_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`[DB Error] Gagal membaca ${filename}:`, err.message);
  }
  return defaultData;
}

// Helper: Tulis file JSON lokal secara aman (Atomic write)
function writeJsonFile(filename, data) {
  const filePath = path.join(DB_DIR, filename);
  const tempPath = path.join(DB_DIR, filename + ".tmp");
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[DB Error] Gagal menulis ${filename}:`, err.message);
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
    return false;
  }
}

// Helper: Ambil IP LAN Lokal komputer untuk akses via HP / WiFi Kantor
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === "IPv4" && !alias.internal && alias.address !== "127.0.0.1") {
        return alias.address;
      }
    }
  }
  return "localhost";
}

// Handler HTTP Server
const server = http.createServer((req, res) => {
  // Aktifkan CORS agar bisa diakses dari jaringan lokal
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. API: Server-Sent Events (SSE) Real-Time Stream
  if (pathname === "/api/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    });

    const clientId = Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

    req.on("close", () => {
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
    return;
  }

  // 2. API: Status Server & Info Penyimpanan
  if (pathname === "/api/status" && req.method === "GET") {
    const localIp = getLocalIpAddress();
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      status: "online",
      satker: "Rutan Kelas II B Siak Sri Indrapura",
      kodeUakpb: "137.04.0900.692310.000.KD",
      localIp: localIp,
      port: PORT,
      urlLocal: `http://localhost:${PORT}`,
      urlNetwork: `http://${localIp}:${PORT}`,
      urlAmbilBarang: `http://${localIp}:${PORT}/ambil-barang.html`,
      storageDirectory: DB_DIR,
      clientsConnected: sseClients.length,
      lastModified: lastModifiedTimestamp
    }));
    return;
  }

  // 3. API: Ambil Seluruh Data Master Lokal
  if (pathname === "/api/data" && req.method === "GET") {
    const inventory = readJsonFile("inventory.json", []);
    const transactions = readJsonFile("transactions.json", []);
    const officers = readJsonFile("officers.json", []);
    const users = readJsonFile("users.json", []);
    const satker = readJsonFile("satker.json", {});

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      success: true,
      data: {
        inventory,
        transactions,
        officers,
        users,
        satker
      },
      lastModified: lastModifiedTimestamp
    }));
    return;
  }

  // 4. API: Polling Ringan untuk Perangkat yang Tidak Mendukung SSE
  if (pathname === "/api/sync-poll" && req.method === "GET") {
    const clientSince = parseInt(parsedUrl.query.since || "0", 10);
    const hasUpdate = lastModifiedTimestamp > clientSince;

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      hasUpdate,
      lastModified: lastModifiedTimestamp
    }));
    return;
  }

  // 5. API: Perbarui Master Inventory (Simpan ke database/inventory.json)
  if (pathname === "/api/inventory" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const dataToSave = Array.isArray(payload) ? payload : (payload.inventory || []);
        if (Array.isArray(dataToSave) && dataToSave.length > 0) {
          writeJsonFile("inventory.json", dataToSave);
          broadcastRealtime("inventory_updated", { count: dataToSave.length, timestamp: Date.now() });
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: true, count: dataToSave.length }));
          return;
        }
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: "Format data inventory tidak valid" }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 6. API: Perbarui Data Mutasi Transaksi (Simpan ke database/transactions.json)
  if (pathname === "/api/transactions" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const dataToSave = Array.isArray(payload) ? payload : (payload.transactions || []);
        writeJsonFile("transactions.json", dataToSave);
        broadcastRealtime("transactions_updated", { count: dataToSave.length, timestamp: Date.now() });
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, count: dataToSave.length }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 7. API: Pengambilan Mandiri dari Barcode QR (ambil-barang.html)
  // Menulis mutasi dan memperbarui stok barang secara real-time & atomik
  if (pathname === "/api/take-item" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { transaction, barangId, stokKeluar, stokAkhir } = payload;

        if (!transaction || !barangId) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: false, error: "Data transaksi tidak lengkap" }));
          return;
        }

        // Baca data saat ini dari disk
        const inventory = readJsonFile("inventory.json", []);
        const transactions = readJsonFile("transactions.json", []);

        // Cari barang dan sesuaikan stok
        let updatedItem = null;
        const itemIdx = inventory.findIndex((it) => it.id === barangId);
        if (itemIdx !== -1) {
          inventory[itemIdx].stokKeluar = (inventory[itemIdx].stokKeluar || 0) + Number(stokKeluar || 0);
          inventory[itemIdx].stokAkhir = typeof stokAkhir === "number" ? stokAkhir : Math.max(0, (inventory[itemIdx].stokAkhir || 0) - Number(stokKeluar || 0));
          inventory[itemIdx].kondisi = inventory[itemIdx].stokAkhir > 0 ? "Tersedia" : "Habis";
          updatedItem = inventory[itemIdx];
        }

        // Tambah transaksi baru di awal daftar
        transactions.unshift(transaction);

        // Tulis kembali ke harddisk
        writeJsonFile("inventory.json", inventory);
        writeJsonFile("transactions.json", transactions);

        // Siarkan pemberitahuan real-time ke semua dashboard aktif
        broadcastRealtime("item_taken", {
          barang: updatedItem ? updatedItem.namaBarang : transaction.namaBarang,
          jumlah: stokKeluar,
          petugas: transaction.penerima || transaction.petugas,
          sisaStok: updatedItem ? updatedItem.stokAkhir : 0,
          transaction: transaction,
          updatedItem: updatedItem,
          timestamp: Date.now()
        });

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, updatedItem, transaction }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 8. API: Buat Salinan Cadangan (Backup Otomatis ke Harddisk)
  if (pathname === "/api/backup" && req.method === "POST") {
    try {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const targetDir = path.join(BACKUP_DIR, `backup_${stamp}`);
      fs.mkdirSync(targetDir, { recursive: true });

      const files = ["inventory.json", "transactions.json", "officers.json", "users.json", "satker.json"];
      let copied = 0;
      files.forEach((f) => {
        const src = path.join(DB_DIR, f);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(targetDir, f));
          copied++;
        }
      });

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, backupFolder: targetDir, filesCopied: copied }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 9. Static Files Serving (index.html, app.js, app.css, dll.)
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  if (safePath === "/" || safePath === "\\") safePath = "/index.html";

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Periksa apakah file berada di dalam folder public
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Akses dilarang.");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 fallback
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404 Tidak Ditemukan</h1><p>Halaman yang Anda tuju tidak tersedia.</p>");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

// Jalankan Server
server.listen(PORT, "0.0.0.0", () => {
  const localIp = getLocalIpAddress();
  console.log("======================================================================");
  console.log("  SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA");
  console.log("  SERVER DATABASE LOKAL & REAL-TIME BACA-TULIS AKTIF");
  console.log("======================================================================");
  console.log(`  [+] Komputer Lokal (PC Admin) : http://localhost:${PORT}`);
  console.log(`  [+] Jaringan WiFi Kantor (HP) : http://${localIp}:${PORT}`);
  console.log(`  [+] Form Ambil Barang (QR)    : http://${localIp}:${PORT}/ambil-barang.html`);
  console.log(`  [+] Folder Penyimpanan Fisik  : ${DB_DIR}`);
  console.log("======================================================================");
  console.log("  Tekan Ctrl+C di jendela ini untuk menghentikan server.");
  console.log("======================================================================");
});

// Keep-alive ping ke seluruh klien SSE setiap 20 detik
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(": keep-alive ping\n\n");
    } catch (_) {}
  });
}, 20000);

