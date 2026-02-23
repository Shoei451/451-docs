// Supabase Client
// markdown-viewer の js/supabase-client.js と同じ実装

class SupabaseClient {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.headers = {
      'apikey':        supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type':  'application/json'
    };
  }

  async hashPassword(password) {
    const encoder   = new TextEncoder();
    const data      = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // パスワード認証して記事本文を取得
  async getProtectedPost(slug, password) {
    try {
      const passwordHash = await this.hashPassword(password);
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/protected_posts?slug=eq.${slug}&password_hash=eq.${passwordHash}&select=*`,
        { method: 'GET', headers: this.headers }
      );
      if (!response.ok) throw new Error('Failed to fetch post');
      const data = await response.json();
      if (data.length === 0) return { success: false, error: 'Invalid password or post not found' };
      return { success: true, post: data[0] };
    } catch (error) {
      console.error('Error fetching protected post:', error);
      return { success: false, error: error.message };
    }
  }

  // index 用：パスワードなしでメタデータのみ取得
  async getProtectedPostsMeta() {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/protected_posts?select=id,slug,title,tags,excerpt,read_time,created_at`,
        { method: 'GET', headers: this.headers }
      );
      if (!response.ok) throw new Error('Failed to fetch posts metadata');
      const data = await response.json();
      return { success: true, posts: data };
    } catch (error) {
      console.error('Error fetching posts metadata:', error);
      return { success: false, error: error.message };
    }
  }
}