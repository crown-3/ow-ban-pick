# ow-ban-pick — 오버워치 친선전 밴픽 공유

오버워치 사설 내전에서 두 팀이 서로에게 걸 밴 영웅을 링크 하나로 실시간 합의하는 도구.
로그인 없이 초대 링크로만 접근하고, 별도 서버 없이 Supabase(Postgres + Realtime)로 동기화한다.

## 시작하기

### 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만든다.
2. SQL Editor에서 `supabase/migrations/` 안의 파일을 번호 순서대로 실행한다 (또는 Supabase
   CLI로 `supabase db push`).
   - 마이그레이션이 `pg_cron` extension을 활성화한다. 프로젝트/리전에 따라 대시보드의
     **Database > Extensions**에서 `pg_cron`을 직접 켜야 할 수도 있다 (SQL만으로 실패하면 여기부터
     확인).
3. **Settings > API**에서 `Project URL`과 `anon public` key를 복사한다.

### 2. 환경 변수

```bash
cp .env.local.example .env.local
```

`.env.local`에 위에서 복사한 값을 채운다.

### 3. 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 방을 만들고, 다른 브라우저 탭(또는 시크릿
창)으로 같은 링크를 열어 두 팀 흐름을 테스트할 수 있다.

### 4. 테스트 / 빌드

```bash
npm test    # lib/team-proposal.ts 유닛 테스트
npm run lint
npm run build   # 정적 사이트를 out/ 으로 export
```

빌드 결과를 로컬에서 확인하려면 `npx serve out` 으로 띄우면 된다 (Cloudflare Pages와 같은
clean URL 방식이라 `/room?id=...` 이 그대로 동작한다).

## 배포 (Cloudflare Pages)

이 앱은 **정적 사이트로 빌드된다** (`next.config.ts`의 `output: "export"`). 서버가 할 일이
없기 때문 — 데이터는 전부 브라우저에서 Supabase로 직접 오간다. 그래서 Workers 런타임이나
`@opennextjs/cloudflare` 어댑터 없이 Pages에 그냥 올리면 된다.

### 대시보드 설정

**Workers & Pages > Create application > Pages > Import an existing Git repository**에서
저장소를 고르고, 빌드 설정을 아래와 같이 넣는다.

| 항목 | 값 |
| --- | --- |
| Framework preset | `Next.js (Static HTML Export)` |
| Build command | `npx next build` |
| Build output directory | `out` |
| Production branch | `main` |

### 환경 변수 (필수)

**Settings > Environment variables**에 아래 두 개를 **Production과 Preview 양쪽 모두** 추가한다.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

> **중요:** `NEXT_PUBLIC_*` 값은 런타임이 아니라 **빌드 시점에 JS 번들 안으로 구워진다.**
> 그래서 (1) 변수가 없으면 빌드가 실패하고, (2) 값을 바꾸면 재배포(Retry deployment)를
> 해야 반영된다. anon key는 원래 브라우저에 노출되는 공개 키라 번들에 들어가도 문제없다.

### Node 버전

`.node-version`에 `22`로 고정해 뒀다. Cloudflare Pages가 이 파일을 읽는다.

### 방 링크 형식

정적 export는 임의의 id를 가진 동적 경로(`/room/<uuid>`)를 만들 수 없다 —
`generateStaticParams()`로 미리 알 수 있는 방 id가 없기 때문이다. 그래서 방 주소는
**`/room?id=<uuid>`** 쿼리 형식을 쓴다. 앱의 "링크 복사"가 현재 주소를 그대로 복사하므로
공유 흐름은 동일하다.

경로 형식(`/room/<uuid>`)을 꼭 쓰고 싶다면 Pages 대신 Workers +
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)로 가야 한다 (서버 런타임이
붙으므로 설정과 비용이 늘어난다).

## 구조

- `src/app/page.tsx` — 시작 화면 (방 만들기 / 입장하기)
- `src/app/create/page.tsx` — 방 만들기 (밴 개수, 옵션)
- `src/app/room/` — 팀 선택 → 밴픽 선택 → 제출 대기 → 결과 공개까지의 방 화면 (`?id=<uuid>`)
- `src/lib/team-proposal.ts` — 득표순 + 확정 밴 우선순위로 팀 제안을 계산하는 순수 함수
- `src/lib/room-realtime.ts` / `src/lib/room-actions.ts` — Supabase Realtime 구독 / 쓰기
- `src/lib/heroes.ts` — 하드코딩 영웅 목록 (아이콘은 `public/heroes/<id>.webp`)
- `supabase/migrations/` — 스키마, RLS, 만료 방 자동 삭제(pg_cron), realtime replica identity
- 밴픽 선택은 낙관적 업데이트다: 행 id를 클라이언트가 만들어 화면에 먼저 반영하고, 같은 id로
  서버에 쓴다. 나중에 realtime으로 돌아오는 행이 같은 id라 자연스럽게 합쳐지고, 요청이
  실패하면 되돌린다 (`PickScreen`의 handleTap/handleLongPress)

## 참고

- 로그인이 없는 모델이라 방 링크(uuid)를 아는 것 자체가 접근 권한이다. RLS는 anon role에
  대해 열려 있다 — 민감 정보를 다루지 않는 캐주얼 도구라는 전제.
- 방 데이터는 생성 24시간 후 자동 삭제된다 (`rooms.expires_at`, 매시 정각 cron).
