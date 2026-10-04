# 냥집사 모임

Supabase 기반의 공개 커뮤니티 앱입니다.

## 1. 준비

1. Supabase 프로젝트 생성
2. Authentication > Email/Password 활성화
3. SQL Editor에서 아래 테이블 생성

```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  content text not null,
  created_at timestamptz default now()
);

create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid not null references posts(id) on delete cascade,
  user_email text not null,
  content text not null,
  created_at timestamptz default now()
);
```

4. RLS 활성화

```sql
alter table posts enable row level security;
alter table comments enable row level security;

create policy "Anyone can read posts"
on posts for select
using (true);

create policy "Authenticated users can insert posts"
on posts for insert
with check (auth.role() = 'authenticated');

create policy "Anyone can read comments"
on comments for select
using (true);

create policy "Authenticated users can insert comments"
on comments for insert
with check (auth.role() = 'authenticated');
```

## 2. 설정값 넣기

`app.js` 안의 다음 값들을 자신의 Supabase 값으로 바꾸세요.

```javascript
const supabaseUrl = "https://YOUR_PROJECT_REF.supabase.co";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
```

## 3. 로컬 실행

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속

## 4. GitHub Pages 배포

1. 이 저장소를 GitHub에 업로드
2. 저장소 → Settings → Pages
3. Source 를 GitHub Actions 또는 Deploy from a branch 로 선택
4. 정적 사이트가 배포됨

## 5. 실사용 팁

- 실제 서비스에서는 이메일 인증, 비속어 필터링, 이미지 업로드, 관리자 모드 등을 추가하세요.
- 이 버전은 가장 빠르게 공개 커뮤니티를 열 수 있는 MVP 형태입니다.

## 6. 필요한 다음 단계

- 게시글 수정/삭제
- 좋아요 기능
- 프로필 페이지
- 관리자 페이지
- 사진 업로드
- 채팅 기능
- 다크모드

다음 단계도 바로 이어서 만들 수 있습니다.
