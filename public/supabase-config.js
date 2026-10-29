/**
 * SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA
 * Konfigurasi Supabase Cloud Database (Real-Time Sinkronisasi)
 * Di-generate otomatis oleh Admin pada: 29/10/2026, 16.18.28
 */

// ─── HARDCODED CREDENTIALS ────────────────────────────────────────────────────
var _SB_URL_HARDCODED  = "https://oawnwveazpegyxkpjiup.supabase.co";
var _SB_KEY_HARDCODED  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hd253dmVhenBlZ3l4a3BqaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMzUyODEsImV4cCI6MjEwODgxMTI4MX0.TSf-Wo1vTwuatFIeZR7Cd8wrtiQ0Y0D5OrE4Cobu1N4";
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
