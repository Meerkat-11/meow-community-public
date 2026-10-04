# 냥집사 모임

Supabase 기반의 공용 커뮤니티 앱입니다. 로그인, 게시글 작성, 댓글 작성까지 동작합니다.

## 준비

1. Supabase 프로젝트를 만듭니다.
2. Authentication > Email/Password를 활성화합니다.
3. SQL Editor에서 아래 테이블을 생성합니다.

```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  content text not null,
  created_at timestamptz default now()
);

create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_email text not null,
  content text not null,
  created_at timestamptz default now()
);
```

4. RLS를 켜고, 공개 읽기 / 인증된 사용자 쓰기를 허용합니다.

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

## 설정

`app.js` 파일에서 아래 값을 본인 Supabase 값으로 바꿉니다.

```javascript
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";
```

## 로컬 실행

```bash
python -m http.server 8000
```

브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:8000
```

## GitHub Pages 배포

1. 이 저장소를 GitHub에 올립니다.
2. Settings > Pages 로 이동합니다.
3. Deploy from a branch 를 선택하고, `main` 브랜치와 `/root` 폴더를 선택합니다.
4. 배포 링크를 받습니다.

## 기능

- 회원가입
- 로그인 / 로그아웃
- 게시글 작성
- 댓글 작성
- 실시간 게시글 목록

## 다음 단계

- 게시글 수정 / 삭제
- 좋아요 기능
- 프로필 페이지
- 채팅 기능
- 관리자 페이지
- 이미지/사진 업로드

을 이어서 추가할 수 있습니다.
