import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://YOUR_PROJECT_REF.supabase.co";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const postContentInput = document.getElementById("postContent");
const postsContainer = document.getElementById("posts");
const loggedOut = document.getElementById("loggedOut");
const loggedIn = document.getElementById("loggedIn");
const userEmail = document.getElementById("userEmail");

const formatDate = (value) => {
  if (!value) return "방금";
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

async function loadPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*, comments(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    postsContainer.innerHTML = `<div class="post"><p>게시글을 불러오지 못했습니다.</p></div>`;
    return;
  }

  postsContainer.innerHTML = "";

  if (!data || !data.length) {
    postsContainer.innerHTML = `<div class="post"><p>아직 작성된 게시글이 없어요. 첫 글을 남겨보세요.</p></div>`;
    return;
  }

  data.forEach((post) => {
    const postEl = document.createElement("article");
    postEl.className = "post";

    const comments = post.comments || [];

    postEl.innerHTML = `
      <div class="post-header">
        <span class="post-author">${escapeHtml(post.user_email)}</span>
        <span>${formatDate(post.created_at)}</span>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>

      <div class="comment-box">
        <div class="comment-list">
          ${comments.length
            ? comments
                .map(
                  (comment) => `
                    <div class="comment">
                      <strong>${escapeHtml(comment.user_email)}</strong>
                      <div>${escapeHtml(comment.content)}</div>
                    </div>
                  `
                )
                .join("")
            : `<div class="comment"><strong>아직 댓글이 없어요.</strong></div>`}
        </div>

        <form class="comment-form" data-post-id="${post.id}">
          <input type="text" name="comment" placeholder="댓글을 입력하세요" required />
          <button type="submit">댓글</button>
        </form>
      </div>
    `;

    postsContainer.appendChild(postEl);
  });

  document.querySelectorAll(".comment-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const { postId } = form.dataset;
      const commentInput = form.querySelector("input[name='comment']");
      const content = commentInput.value.trim();

      if (!content) {
        alert("댓글 내용을 입력해 주세요.");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        alert("로그인 후 댓글을 작성할 수 있어요.");
        return;
      }

      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_email: sessionData.session.user.email,
        content
      });

      if (error) {
        alert(error.message);
        return;
      }

      commentInput.value = "";
      await loadPosts();
    });
  });
}

async function handleSignUp() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해 주세요.");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.user) {
    alert("회원가입 완료! 이메일 인증을 확인해 주세요.");
  }
}

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해 주세요.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("로그인되었습니다.");
}

async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert(error.message);
    return;
  }
  alert("로그아웃되었습니다.");
}

async function handleCreatePost() {
  const content = postContentInput.value.trim();
  if (!content) {
    alert("내용을 입력해 주세요.");
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    alert("로그인 후 게시글을 작성할 수 있어요.");
    return;
  }

  const { error } = await supabase.from("posts").insert({
    user_email: sessionData.session.user.email,
    content
  });

  if (error) {
    alert(error.message);
    return;
  }

  postContentInput.value = "";
  await loadPosts();
}

async function syncAuthUi() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (user) {
    loggedOut.classList.add("hidden");
    loggedIn.classList.remove("hidden");
    userEmail.textContent = user.email;
  } else {
    loggedOut.classList.remove("hidden");
    loggedIn.classList.add("hidden");
    userEmail.textContent = "";
  }
}

supabase.auth.onAuthStateChange(async () => {
  await syncAuthUi();
  await loadPosts();
});

document.getElementById("signupBtn").addEventListener("click", handleSignUp);
document.getElementById("loginBtn").addEventListener("click", handleLogin);
document.getElementById("logoutBtn").addEventListener("click", handleLogout);
document.getElementById("postBtn").addEventListener("click", handleCreatePost);

syncAuthUi();
loadPosts();
