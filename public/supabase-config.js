/**
 * SIM-PERSEDIAAN KANTOR RUTAN KELAS II B SIAK SRI INDRAPURA
 * Konfigurasi Supabase Cloud Database (Real-Time Sinkronisasi)
 */

window.SUPABASE_CONFIG = {
  // Masukkan Project URL Supabase Anda di sini, contoh: "https://xyzabcdefghijklmnop.supabase.co"
  url: localStorage.getItem("sim_supabase_url") || "",
  
  // Masukkan Anon Public Key Supabase Anda di sini (dimulai dengan "ey...")
  anonKey: localStorage.getItem("sim_supabase_anon_key") || ""
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
  
  window.SUPABASE_CONFIG.url = url ? url.trim() : "";
  window.SUPABASE_CONFIG.anonKey = anonKey ? anonKey.trim() : "";
  supabaseClientInstance = null; // reset client
}

