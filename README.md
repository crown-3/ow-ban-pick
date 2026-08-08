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

빌드 결과를 로컬에서 확인하려면 `npm run preview` (`next build` + `wrangler dev`)를 쓴다.
배포와 같은 에셋 라우팅으로 서빙되므로 `/room?id=...` 동작을 그대로 확인할 수 있다.

## 배포 (Cloudflare Workers — 정적 에셋)

이 앱은 **정적 사이트로 빌드된다** (`next.config.ts`의 `output: "export"`). 서버가 할 일이
없기 때문 — 데이터는 전부 브라우저에서 Supabase로 직접 오간다. 그래서 서버 런타임이나
`@opennextjs/cloudflare` 어댑터 없이 정적 에셋만 올리면 된다.

### Workers인가 Pages인가

이 저장소는 **Workers Static Assets** 기준으로 설정돼 있다 (`wrangler.jsonc`).

Cloudflare는 Pages와 Workers를
[하나의 경험으로 합치는 중](https://blog.cloudflare.com/pages-and-workers-are-converging-into-one-experience/)이지만,
2026-08 기준 **Pages는 폐기(deprecate)되지 않았고 새 프로젝트도 계속 만들 수 있다.** 둘 다
유효한 선택이며, 대시보드의 "Import a repository" 흐름이 Workers 프로젝트를 만들기 때문에
이쪽으로 맞춘 것뿐이다.

> **Pages로 가려면 `wrangler.jsonc`를 반드시 지워야 한다.** Pages 프로젝트에서 wrangler 설정
> 파일은 선택이지만, *존재한다면* `pages_build_output_dir` 키가 반드시 있어야 한다. 이
> 파일은 Workers용(`assets` 블록)이라 그 키가 없어서 `wrangler pages deploy`가 검증 단계에서
> 실패한다. Pages를 쓸 경우 설정은 대시보드에만 넣는다 — Framework preset
> `Next.js (Static HTML Export)`, Build command `npx next build`, Build output directory `out`.

### `wrangler.jsonc`를 지우지 말 것 (Workers를 쓰는 한)

wrangler는 설정 파일이 **없으면** 자동 설정(autoconfig)을 돌려 프레임워크를 추측한다.
Next.js를 발견하면 `@opennextjs/cloudflare`(서버 런타임)로 배포하려 드는데, 이 앱은 정적
빌드라 OpenNext가 찾는 `.next/standalone`이 존재하지 않아 **반드시 실패한다**:

```
Error: ENOENT: no such file or directory,
  open '.next/standalone/.next/server/pages-manifest.json'
```

`wrangler.jsonc`가 있으면 autoconfig가 건너뛰어지고 정적 에셋 설정이 그대로 쓰인다.

### 대시보드 설정

**Workers & Pages > Create > Import a repository**로 저장소를 연결하고, 빌드 설정을 아래와
같이 넣는다.

| 항목 | 값 |
| --- | --- |
| Build command | `npx next build` |
| Deploy command | `npx wrangler deploy` (기본값) |
| Root directory | 비워 둠 |

출력 디렉터리·라우팅은 대시보드가 아니라 `wrangler.jsonc`의 `assets`가 결정한다
(`./out`, `html_handling`, `not_found_handling`).

### 환경 변수 (필수)

**Settings > Build > Variables and Secrets**에 아래 두 개를 추가한다.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

> **중요 1 — 반드시 *빌드* 변수여야 한다.** Worker 런타임 변수(Settings > Runtime)에 넣으면
> 동작하지 않는다. 정적 사이트라 실행되는 Worker 코드가 없고, 값은 빌드 때 이미 결정된다.
>
> **중요 2 — `NEXT_PUBLIC_*`은 빌드 시점에 JS 번들 안으로 구워진다.** 그래서 (1) 변수가
> 없으면 빌드가 즉시 실패하고, (2) 값을 바꾸면 재배포해야 반영된다. anon key는 원래
> 브라우저에 노출되는 공개 키라 번들에 들어가도 문제없다.

### 로컬에서 배포 산출물 확인

```bash
npm run preview          # next build + wrangler dev (실제 에셋 라우팅 그대로)
npx wrangler deploy --dry-run   # 설정만 검증, 업로드 안 함
```

### Node 버전

`.node-version`에 `22`로 고정해 뒀다.

### 방 링크 형식

정적 export는 임의의 id를 가진 동적 경로(`/room/<uuid>`)를 만들 수 없다 —
`generateStaticParams()`로 미리 알 수 있는 방 id가 없기 때문이다. 그래서 방 주소는
**`/room?id=<uuid>`** 쿼리 형식을 쓴다. 앱의 "링크 복사"가 현재 주소를 그대로 복사하므로
공유 흐름은 동일하다.

경로 형식(`/room/<uuid>`)을 꼭 쓰고 싶다면 정적 빌드를 포기하고
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)로 가야 한다 — `output: "export"`를
빼고 어댑터를 붙이는 방식이다 (서버 런타임이 붙으므로 설정과 비용이 늘어난다).

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
