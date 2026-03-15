// Конфигурация Supabase
// Используем переменные окружения Vite с fallback на захардкоженные ключи
// Anon key — публичный ключ только для чтения публичных данных.
// Безопасность данных пользователей обеспечивается через RLS-политики в БД.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://byivwaikpdsylhmquqkx.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aXZ3YWlrcGRzeWxobXF1cWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTExNzYsImV4cCI6MjA4ODQ4NzE3Nn0.dEcndp4pg65UDMT25Q6m_ZcfHbOsM35dq_-9SEqGSE4';
