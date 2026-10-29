/**
 * SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA
 * Konfigurasi Supabase Cloud Database (Real-Time Sinkronisasi)
 *
 * PENTING: Credentials Supabase disimpan di bawah (hardcoded oleh Admin)
 * JANGAN hapus baris ini — diisi otomatis oleh fungsi ekspor admin.
 */

// ─── HARDCODED CREDENTIALS (diisi oleh Admin via tombol "Ekspor Config") ─────
var _SB_URL_HARDCODED  = "";  // <<< ADMIN: isi URL Supabase di sini
var _SB_KEY_HARDCODED  = "";  // <<< ADMIN: isi Anon Key Supabase di sini
// ─────────────────────────────────────────────────────────────────────────────

window.SUPABASE_CONFIG = {
  // Prioritas: (1) hardcoded → (2) localStorage browser
  url:     _SB_URL_HARDCODED  || localStorage.getItem("sim_supabase_url")  || "",
  anonKey: _SB_KEY_HARDCODED  || localStorage.getItem("sim_supabase_anon_key") || ""
};

// Instance Supabase Client Global
let supabaseClientInstance = null;

function getSupabaseClient() {
  if (supabaseClientInstance) return supabaseClientInstance;

  const url = window.SUPABASE_CONFIG.url || localStorage.getItem("sim_supabase_url");
  const key = window.SUPABASE_CONFIG.anonKey || localStorage.getItem("sim_supabase_anon_key");

  if (!url || !key || !window.supabase) {
    return null;
  }

  try {
    supabaseClientInstance = window.supabase.createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return supabaseClientInstance;
  } catch (err) {
    console.warn("Gagal inisialisasi Supabase client:", err);
    return null;
  }
}

function saveSupabaseConfig(url, anonKey) {
  if (url) localStorage.setItem("sim_supabase_url", url.trim());
  if (anonKey) localStorage.setItem("sim_supabase_anon_key", anonKey.trim());

  window.SUPABASE_CONFIG.url     = url     ? url.trim()     : "";
  window.SUPABASE_CONFIG.anonKey = anonKey ? anonKey.trim() : "";
  supabaseClientInstance = null; // reset agar client dibuat ulang
}

/**
 * generateAndDownloadConfig()
 * Dipanggil oleh tombol admin "Ekspor supabase-config.js"
 * → Generate file supabase-config.js dengan credentials hardcoded lalu download.
 * → User replace file di folder project dan push/deploy ulang ke Vercel.
 */
function generateAndDownloadConfig() {
  const url = localStorage.getItem("sim_supabase_url") || "";
  const key = localStorage.getItem("sim_supabase_anon_key") || "";

  if (!url || !key) {
    alert("Simpan dulu URL dan Anon Key Supabase melalui form Pengaturan Database!");
    return;
  }

  const fileContent = `/**
 * SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA
 * Konfigurasi Supabase Cloud Database (Real-Time Sinkronisasi)
 * Di-generate otomatis oleh Admin pada: ${new Date().toLocaleString("id-ID")}
 */

// ─── HARDCODED CREDENTIALS ────────────────────────────────────────────────────
var _SB_URL_HARDCODED  = "${url.replace(/"/g, '\\"')}";
var _SB_KEY_HARDCODED  = "${key.replace(/"/g, '\\"')}";
// ─────────────────────────────────────────────────────────────────────────────

window.SUPABASE_CONFIG = {
  url:     _SB_URL_HARDCODED  || localStorage.getItem("sim_supabase_url")  || "",
  anonKey: _SB_KEY_HARDCODED  || localStorage.getItem("sim_supabase_anon_key") || ""
};

let supabaseClientInstance = null;

function getSupabaseClient() {
  if (supabaseClientInstance) return supabaseClientInstance;
  const url = window.SUPABASE_CONFIG.url;
  const key = window.SUPABASE_CONFIG.anonKey;
  if (!url || !key || !window.supabase) return null;
  try {
    supabaseClientInstance = window.supabase.createClient(url.trim(), key.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } }
    });
    return supabaseClientInstance;
  } catch (err) {
    console.warn("Gagal inisialisasi Supabase client:", err);
    return null;
  }
}

function saveSupabaseConfig(url, anonKey) {
  if (url) localStorage.setItem("sim_supabase_url", url.trim());
  if (anonKey) localStorage.setItem("sim_supabase_anon_key", anonKey.trim());
  window.SUPABASE_CONFIG.url     = url     ? url.trim()     : "";
  window.SUPABASE_CONFIG.anonKey = anonKey ? anonKey.trim() : "";
  supabaseClientInstance = null;
}

function generateAndDownloadConfig() {
  alert("File ini sudah berisi credentials hardcoded. Tidak perlu generate ulang.");
}
`;

  const blob = new Blob([fileContent], { type: "text/javascript" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "supabase-config.js";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

