import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 이 값들은 빌드 시점에 번들로 구워진다. 그래서 빌드 환경에 없으면 여기서 즉시 실패하는 게
// 맞다 — 조용히 넘어가면 배포는 성공했는데 브라우저에서만 깨지는 상황이 된다.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.\n" +
      "- 로컬: .env.local.example을 참고해 .env.local을 채우세요.\n" +
      "- Cloudflare Pages: Settings > Environment variables에 두 값을 Production/Preview 모두 추가하세요."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
