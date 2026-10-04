import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const postContentInput = document.getElementById("postContent");
const postsList = document.getElementById("posts");

const loggedOut = document.getElementById("loggedOut");
const loggedIn = document.getElementById("loggedIn");
const userEmail = document.getElementById("userEmail");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setAuthUi(session) {
  const isLoggedIn = !!session;
  loggedOut.classList.toggle("visible", !isLoggedIn);
  loggedIn.classList.toggle("visible", isLoggedIn);

  if (session?.user?.email) {
    userEmail.textContent = session.user.email;
  }
}

async function loadPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*, comments(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    postsList.innerHTML = '<div class="empty-state">게시글을 불러오지 못했습니다.</div>';
    return;
  }

  if (!data || data.length === 0) {
    postsList.innerHTML = '<div class="empty-state">아직 게시글이 없습니다. 첫 글을 남겨보세요.</div>';
    return;
  }

  postsList.innerHTML = data
    .map((post) => {
      const comments = Array.isArray(post.comments) ? post.comments : [];
      const commentHtml = comments.length
        ? comments
            .map(
              (comment) => `
                <div class="comment">
                  <strong>${escapeHtml(comment.user_email)}</strong>
                  <span>${escapeHtml(comment.content)}</span>
                </div>
              `
            )
            .join("")
        : '<div class="empty-state">댓글이 아직 없습니다.</div>';

      return `
        <article class="post">
          <div class="post-header">
            <span class="post-user">${escapeHtml(post.user_email)}</span>
            <span class="post-time">${new Date(post.created_at).toLocaleString()}</span>
          </div>
          <p class="post-body">${escapeHtml(post.content)}</p>

          <div class="comment-box">
            <div class="comment-list">${commentHtml}</div>
            <form class="comment-form" data-post-id="${post.id}">
              <input type="text" name="comment" placeholder="댓글을 입력하세요" required />
              <button type="submit">댓글</button>
            </form>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".comment-form").forEach((form) => {
    form.addEventListener("submit", handleCommentSubmit);
  });
}

async function handleCreatePost() {
  const content = postContentInput.value.trim();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    alert("로그인 후 글을 작성할 수 있습니다.");
    return;
  }

  if (!content) {
    alert("내용을 입력해 주세요.");
    return;
  }

  const { error } = await supabase.from("posts").insert({
    user_email: sessionData.session.user.email,
    content,
  });

  if (error) {
    alert(error.message);
    return;
  }

  postContentInput.value = "";
  loadPosts();
}

async function handleCommentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const postId = form.dataset.postId;
  const comment = form.comment.value.trim();

  if (!comment) {
    alert("댓글 내용을 입력해 주세요.");
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    alert("로그인 후 댓글을 작성할 수 있습니다.");
    return;
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_email: sessionData.session.user.email,
    content: comment,
  });

  if (error) {
    alert(error.message);
    return;
  }

  form.reset();
  loadPosts();
}

async function handleSignup() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해 주세요.");
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert(error.message);
    return;
  }

  alert("회원가입 완료! 로그인해 주세요.");
}

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해 주세요.");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert(error.message);
    return;
  }

  if (data?.session) {
    setAuthUi(data.session);
  }
}

async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert(error.message);
  }
}

document.getElementById("createPostBtn").addEventListener("click", handleCreatePost);
document.getElementById("signupBtn").addEventListener("click", handleSignup);
document.getElementById("loginBtn").addEventListener("click", handleLogin);
document.getElementById("logoutBtn").addEventListener("click", handleLogout);

(async function init() {
  const { data } = await supabase.auth.getSession();
  setAuthUi(data.session);
  loadPosts();

  supabase.auth.onAuthStateChange((_event, session) => {
    setAuthUi(session);
    loadPosts();
  });
})();

