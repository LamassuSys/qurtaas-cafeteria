import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  console.warn(
    "⚠️  Supabase env vars missing — app will run in offline/demo mode.\n" +
    "    Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env (local) " +
    "or Netlify → Site configuration → Environment variables (production)."
  );
}

// Use a safe placeholder when env vars are absent so createClient never throws.
// The app will fall back to mock/seed data automatically (see menuStore, ordersStore).
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  url
    ? (key || "placeholder")
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20nEV8rw6HtnRmaiXw8Szwyo85GYcWn8SqcE"
);
