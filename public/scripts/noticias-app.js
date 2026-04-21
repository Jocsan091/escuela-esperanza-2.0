(function () {
  const configElement = document.getElementById("news-runtime-config");

  if (!configElement) return;

  const config = JSON.parse(configElement.textContent || "{}");
  const {
    supabaseUrl = "",
    supabaseAnonKey = "",
    supabaseBucket = "noticias",
    defaultImage = "/images/slide3.png"
  } = config;

  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
  const authStorageKey = "escuela_esperanza_admin_session";

  function createHeaders(token, extraHeaders) {
    return {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token || supabaseAnonKey}`,
      ...extraHeaders
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  }

  function getImageUrl(imageUrl) {
    return imageUrl || defaultImage;
  }

  function setText(element, text) {
    if (element) element.textContent = text;
  }

  function getStoredSession() {
    try {
      return JSON.parse(window.localStorage.getItem(authStorageKey) || "null");
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    window.localStorage.setItem(authStorageKey, JSON.stringify(session));
  }

  function clearSession() {
    window.localStorage.removeItem(authStorageKey);
  }

  async function request(path, options) {
    const response = await fetch(`${supabaseUrl}${path}`, options);

    if (!response.ok) {
      let message = "Ocurrio un error inesperado.";

      try {
        const data = await response.json();
        message = data.msg || data.message || data.error_description || data.error || message;
      } catch {
        message = response.statusText || message;
      }

      throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  }

  async function fetchPublicNews(limit) {
    const query = new URLSearchParams({
      select: "id,titulo,contenido,imagen_url,fecha_publicacion",
      publicada: "eq.true",
      order: "fecha_publicacion.desc"
    });

    if (limit) {
      query.set("limit", String(limit));
    }

    return request(`/rest/v1/noticias?${query.toString()}`, {
      headers: createHeaders(null)
    });
  }

  async function fetchAdminNews(session) {
    const query = new URLSearchParams({
      select: "id,titulo,contenido,imagen_url,fecha_publicacion,publicada",
      order: "fecha_publicacion.desc"
    });

    return request(`/rest/v1/noticias?${query.toString()}`, {
      headers: createHeaders(session.access_token)
    });
  }

  async function loginAdmin(email, password) {
    return request("/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
  }

  async function uploadImage(file, session) {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const fileName = `noticia-${Date.now()}-${sanitizedName}`;

    await request(`/storage/v1/object/${supabaseBucket}/${fileName}`, {
      method: "POST",
      headers: createHeaders(session.access_token, {
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true"
      }),
      body: file
    });

    return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${fileName}`;
  }

  async function createNews(payload, session) {
    return request("/rest/v1/noticias", {
      method: "POST",
      headers: createHeaders(session.access_token, {
        "Content-Type": "application/json",
        Prefer: "return=representation"
      }),
      body: JSON.stringify(payload)
    });
  }

  async function updateNews(id, payload, session) {
    const query = new URLSearchParams({
      id: `eq.${id}`,
      select: "*"
    });

    return request(`/rest/v1/noticias?${query.toString()}`, {
      method: "PATCH",
      headers: createHeaders(session.access_token, {
        "Content-Type": "application/json",
        Prefer: "return=representation"
      }),
      body: JSON.stringify(payload)
    });
  }

  async function deleteNews(id, session) {
    const query = new URLSearchParams({
      id: `eq.${id}`
    });

    return request(`/rest/v1/noticias?${query.toString()}`, {
      method: "DELETE",
      headers: createHeaders(session.access_token)
    });
  }

  function renderHomeNews(items) {
    const list = document.querySelector("[data-news-home-list]");
    const emptyState = document.querySelector("[data-news-home-empty]");
    const actions = document.querySelector("[data-news-home-actions]");
    const setupState = document.querySelector("[data-news-home-setup]");

    if (!list || !emptyState || !actions) return;

    if (!hasSupabaseConfig) {
      emptyState.hidden = true;
      actions.hidden = true;
      list.innerHTML = "";
      if (setupState) {
        setupState.hidden = false;
        setText(
          setupState,
          "Falta configurar Supabase para mostrar las noticias del sitio."
        );
      }
      return;
    }

    if (setupState) setupState.hidden = true;

    if (items.length === 0) {
      list.innerHTML = "";
      emptyState.hidden = false;
      actions.hidden = true;
      return;
    }

    emptyState.hidden = true;
    actions.hidden = false;
    list.innerHTML = items
      .map(
        (item) => `
          <article class="news-card">
            <div class="news-card-image-wrap">
              <img src="${escapeHtml(getImageUrl(item.imagen_url))}" alt="${escapeHtml(item.titulo)}" />
              <div class="news-date-badge">
                <span class="news-date-icon"><i class="fa-solid fa-book-open"></i></span>
                <span class="news-date-text">${escapeHtml(formatDate(item.fecha_publicacion))}</span>
              </div>
            </div>
            <div class="news-card-content">
              <h3>${escapeHtml(item.titulo)}</h3>
              <p>${escapeHtml(truncateText(item.contenido, 165))}</p>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderPublicNewsPage(items) {
    const list = document.querySelector("[data-news-public-list]");
    const emptyState = document.querySelector("[data-news-public-empty]");
    const setupState = document.querySelector("[data-news-public-setup]");

    if (!list || !emptyState) return;

    if (!hasSupabaseConfig) {
      emptyState.hidden = true;
      list.innerHTML = "";
      if (setupState) {
        setupState.hidden = false;
        setText(
          setupState,
          "Falta configurar Supabase para mostrar las noticias publicadas."
        );
      }
      return;
    }

    if (setupState) setupState.hidden = true;

    if (items.length === 0) {
      list.innerHTML = "";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    list.innerHTML = items
      .map(
        (item) => `
          <article class="news-page-card">
            <div class="news-page-media">
              <img src="${escapeHtml(getImageUrl(item.imagen_url))}" alt="${escapeHtml(item.titulo)}" />
              <div class="news-date-badge news-date-badge--page">
                <span class="news-date-icon"><i class="fa-solid fa-book-open"></i></span>
                <span class="news-date-text">${escapeHtml(formatDate(item.fecha_publicacion))}</span>
              </div>
            </div>
            <div class="news-page-content">
              <h2>${escapeHtml(item.titulo)}</h2>
              <p>${escapeHtml(item.contenido)}</p>
            </div>
          </article>
        `
      )
      .join("");
  }

  async function initPublicPages() {
    const isHome = document.querySelector("[data-news-home-list]");
    const isPublicNewsPage = document.querySelector("[data-news-public-list]");

    if (!isHome && !isPublicNewsPage) return;

    try {
      const publicNews = await fetchPublicNews(isHome ? 3 : undefined);
      if (isHome) renderHomeNews(publicNews.slice(0, 3));
      if (isPublicNewsPage) renderPublicNewsPage(publicNews);
    } catch (error) {
      const homeSetup = document.querySelector("[data-news-home-setup]");
      const pageSetup = document.querySelector("[data-news-public-setup]");
      const homeEmpty = document.querySelector("[data-news-home-empty]");
      const homeActions = document.querySelector("[data-news-home-actions]");
      const publicEmpty = document.querySelector("[data-news-public-empty]");

      if (homeEmpty) homeEmpty.hidden = true;
      if (homeActions) homeActions.hidden = true;
      if (publicEmpty) publicEmpty.hidden = true;

      if (homeSetup) {
        homeSetup.hidden = false;
        setText(homeSetup, error.message);
      }

      if (pageSetup) {
        pageSetup.hidden = false;
        setText(pageSetup, error.message);
      }
    }
  }

  async function initAdminPage() {
    const loginForm = document.querySelector("[data-admin-login-form]");
    if (!loginForm) return;

    const authCard = document.querySelector("[data-admin-auth-card]");
    const panel = document.querySelector("[data-admin-panel]");
    const loginMessage = document.querySelector("[data-admin-login-message]");
    const statusBox = document.querySelector("[data-admin-status]");
    const managerForm = document.querySelector("[data-admin-news-form]");
    const adminList = document.querySelector("[data-admin-news-list]");
    const adminEmpty = document.querySelector("[data-admin-news-empty]");
    const previewImage = document.querySelector("[data-admin-preview-image]");
    const titleInput = document.querySelector("[data-news-title-input]");
    const contentInput = document.querySelector("[data-news-content-input]");
    const imageInput = document.querySelector("[data-news-image-input]");
    const idInput = document.querySelector("[data-news-id-input]");
    const submitLabel = document.querySelector("[data-admin-submit-label]");
    const formTitle = document.querySelector("[data-admin-form-title]");
    const cancelEditButton = document.querySelector("[data-admin-cancel-edit]");
    const logoutButton = document.querySelector("[data-admin-logout]");
    const setupState = document.querySelector("[data-admin-setup]");

    if (
      !managerForm ||
      !adminList ||
      !adminEmpty ||
      !titleInput ||
      !contentInput ||
      !imageInput ||
      !idInput
    ) {
      return;
    }

    if (!hasSupabaseConfig) {
      if (authCard) authCard.hidden = true;
      if (panel) panel.hidden = true;
      if (setupState) {
        setupState.hidden = false;
        setText(
          setupState,
          "Falta configurar Supabase para activar el panel administrador."
        );
      }
      return;
    }

    let session = getStoredSession();
    let adminNews = [];

    function resetForm() {
      managerForm.reset();
      idInput.value = "";
      if (submitLabel) submitLabel.textContent = "Subir nueva noticia";
      if (formTitle) formTitle.textContent = "Subir nueva noticia";
      if (cancelEditButton) cancelEditButton.hidden = true;
      if (previewImage) previewImage.src = defaultImage;
    }

    function showAdminStatus(message, isError) {
      if (!statusBox) return;
      statusBox.hidden = false;
      statusBox.textContent = message;
      statusBox.dataset.variant = isError ? "error" : "success";
    }

    function renderAdminList() {
      if (adminNews.length === 0) {
        adminList.innerHTML = "";
        adminEmpty.hidden = false;
        return;
      }

      adminEmpty.hidden = true;
      adminList.innerHTML = adminNews
        .map(
          (item) => `
            <article class="admin-news-item" data-news-item-id="${item.id}">
              <img src="${escapeHtml(getImageUrl(item.imagen_url))}" alt="${escapeHtml(item.titulo)}" />
              <div class="admin-news-item-body">
                <strong>${escapeHtml(formatDate(item.fecha_publicacion))}</strong>
                <h3>${escapeHtml(item.titulo)}</h3>
                <p>${escapeHtml(truncateText(item.contenido, 180))}</p>
                <div class="admin-news-item-actions">
                  <button type="button" class="admin-secondary-link" data-edit-id="${item.id}">Editar</button>
                  <button type="button" class="admin-secondary-link" data-delete-id="${item.id}">Eliminar</button>
                </div>
              </div>
            </article>
          `
        )
        .join("");
    }

    async function refreshAdminNews() {
      adminNews = await fetchAdminNews(session);
      renderAdminList();
    }

    function applySessionState() {
      const isLoggedIn = Boolean(session?.access_token);
      if (authCard) authCard.hidden = isLoggedIn;
      if (panel) panel.hidden = !isLoggedIn;
      if (setupState) setupState.hidden = true;
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");

      try {
        setText(loginMessage, "Ingresando...");
        const result = await loginAdmin(email, password);
        session = result;
        saveSession(session);
        applySessionState();
        setText(loginMessage, "");
        await refreshAdminNews();
      } catch (error) {
        setText(loginMessage, error.message);
      }
    });

    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        clearSession();
        session = null;
        applySessionState();
        resetForm();
        adminList.innerHTML = "";
        adminEmpty.hidden = false;
        showAdminStatus("Sesion cerrada.", false);
      });
    }

    if (imageInput && previewImage) {
      imageInput.addEventListener("change", () => {
        const file = imageInput.files?.[0];
        if (!file) {
          previewImage.src = defaultImage;
          return;
        }

        const objectUrl = URL.createObjectURL(file);
        previewImage.src = objectUrl;
      });
    }

    if (cancelEditButton) {
      cancelEditButton.addEventListener("click", () => {
        resetForm();
      });
    }

    managerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!session?.access_token) return;

      const title = String(titleInput.value || "").trim();
      const content = String(contentInput.value || "").trim();
      const selectedId = String(idInput.value || "").trim();
      const file = imageInput.files?.[0];

      if (!title || !content) {
        showAdminStatus("Debes completar titulo y texto.", true);
        return;
      }

      try {
        showAdminStatus("Guardando noticia...", false);

        let imageUrl = defaultImage;
        const currentItem = adminNews.find((item) => String(item.id) === selectedId);

        if (currentItem?.imagen_url) {
          imageUrl = currentItem.imagen_url;
        }

        if (file) {
          imageUrl = await uploadImage(file, session);
        }

        const payload = {
          titulo: title,
          contenido: content,
          imagen_url: imageUrl,
          fecha_publicacion: new Date().toISOString(),
          publicada: true
        };

        if (selectedId) {
          await updateNews(selectedId, payload, session);
          showAdminStatus("Noticia actualizada correctamente.", false);
        } else {
          await createNews(payload, session);
          showAdminStatus("Noticia creada correctamente.", false);
        }

        resetForm();
        await refreshAdminNews();
      } catch (error) {
        showAdminStatus(error.message, true);
      }
    });

    adminList.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const editId = target.getAttribute("data-edit-id");
      const deleteId = target.getAttribute("data-delete-id");

      if (editId) {
        const item = adminNews.find((entry) => String(entry.id) === editId);
        if (!item) return;

        idInput.value = String(item.id);
        titleInput.value = item.titulo;
        contentInput.value = item.contenido;
        if (previewImage) previewImage.src = getImageUrl(item.imagen_url);
        if (submitLabel) submitLabel.textContent = "Guardar cambios";
        if (formTitle) formTitle.textContent = "Editar noticia";
        if (cancelEditButton) cancelEditButton.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (deleteId) {
        if (!window.confirm("Quieres eliminar esta noticia?")) {
          return;
        }

        try {
          showAdminStatus("Eliminando noticia...", false);
          await deleteNews(deleteId, session);
          resetForm();
          await refreshAdminNews();
          showAdminStatus("Noticia eliminada correctamente.", false);
        } catch (error) {
          showAdminStatus(error.message, true);
        }
      }
    });

    if (session?.access_token) {
      applySessionState();
      try {
        await refreshAdminNews();
      } catch (error) {
        clearSession();
        session = null;
        applySessionState();
        if (setupState) {
          setupState.hidden = false;
          setText(setupState, error.message);
        }
      }
    } else {
      applySessionState();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initPublicPages();
    initAdminPage();
  });
})();
