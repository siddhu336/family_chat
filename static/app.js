const authView = document.querySelector("#auth-view");
const offlineView = document.querySelector("#offline-view");
const chatView = document.querySelector("#chat-view");
const authForm = document.querySelector("#auth-form");
const contactsElement = document.querySelector("#contacts");
const conversation = document.querySelector("#conversation");
const emptyConversation = document.querySelector("#empty-conversation");
const activeConversation = document.querySelector("#active-conversation");
const messages = document.querySelector("#messages");
const memberDialog = document.querySelector("#member-dialog");
const adminDialog = document.querySelector("#admin-dialog");
const changePasswordDialog = document.querySelector("#change-password-dialog");
const resetPasswordDialog = document.querySelector("#reset-password-dialog");
const profileDialog = document.querySelector("#profile-dialog");
const notificationButton = document.querySelector("#notification-button");
const notificationStatus = document.querySelector("#notification-status");
const conversationStatus = document.querySelector("#conversation-status");
const messageInput = document.querySelector("#message-input");
const composerContext = document.querySelector("#composer-context");
const sendButton = document.querySelector("#send-button");
const attachmentInput = document.querySelector("#attachment-input");
const cameraInput = document.querySelector("#camera-input");
const attachmentPreview = document.querySelector("#attachment-preview");
const uploadProgress = document.querySelector("#upload-progress");

const icons = {
  "arrow-left": '<path d="m15 18-6-6 6-6"/><path d="M9 12h10"/>',
  bell: '<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  camera: '<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z"/><circle cx="12" cy="13" r="3"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  fingerprint: '<path d="M12 11a2 2 0 0 1 2 2c0 2.5-.5 5-1.5 7"/><path d="M8.2 21a16 16 0 0 0 1.8-8 2 2 0 0 1 4 0"/><path d="M5 18a20 20 0 0 0 1-5 6 6 0 0 1 12 0c0 2-.2 4-.7 6"/><path d="M4.5 8.5a9 9 0 0 1 15 0"/><path d="M8 4.5a9 9 0 0 1 8 0"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m12 12 8-8"/><path d="m15 7 2 2"/><path d="m18 4 2 2"/>',
  "key-round": '<path d="M21 2 13.6 9.4"/><circle cx="7.5" cy="15.5" r="5.5"/><path d="m18 5 2 2"/><path d="m15 8 2 2"/>',
  "log-out": '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',
  paperclip: '<path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 0 1-2.8-2.8l8.9-8.9"/>',
  reply: '<path d="m9 17-5-5 5-5"/><path d="M4 12h10a6 6 0 0 1 6 6v1"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
  user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
  "user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}

function setButtonIcon(button, name, label = null) {
  button.innerHTML = icon(name);
  if (label) {
    const text = document.createElement("span");
    text.textContent = label;
    button.append(text);
  }
}

document.querySelectorAll("[data-icon]").forEach((button) => {
  const existingLabel = button.querySelector("span")?.textContent || null;
  setButtonIcon(button, button.dataset.icon, existingLabel);
});

let currentUser = null;
let selectedContact = null;
let contacts = [];
let needsSetup = false;
let socket = null;
let reconnectTimer = null;
let unreadCount = 0;
let remoteTypingTimer = null;
let typingContactId = null;
let typingStopTimer = null;
let replyToMessage = null;
let editingMessage = null;
let selectedAttachment = null;
let attachmentObjectUrl = null;
let maxAttachmentBytes = 10 * 1024 * 1024;
let maxAvatarBytes = 2 * 1024 * 1024;
let profileAvatarFile = null;
let removeProfileAvatar = false;
let profilePreviewUrl = null;
let installPrompt = null;
let refreshingServiceWorker = false;
let pushPublicKey = null;
let pushSubscribed = false;
let inviteToken = new URLSearchParams(window.location.search).get("invite");
const messagesById = new Map();

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Something went wrong");
  return data;
}

function bufferToBase64url(value) {
  if (!value) return null;
  const bytes = new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function prepareCreationOptions(options) {
  if (PublicKeyCredential.parseCreationOptionsFromJSON) {
    return PublicKeyCredential.parseCreationOptionsFromJSON(options);
  }
  return {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
    user: { ...options.user, id: base64urlToBuffer(options.user.id) },
    excludeCredentials: (options.excludeCredentials || []).map((credential) => ({
      ...credential,
      id: base64urlToBuffer(credential.id),
    })),
  };
}

function prepareRequestOptions(options) {
  if (PublicKeyCredential.parseRequestOptionsFromJSON) {
    return PublicKeyCredential.parseRequestOptionsFromJSON(options);
  }
  return {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
    allowCredentials: (options.allowCredentials || []).map((credential) => ({
      ...credential,
      id: base64urlToBuffer(credential.id),
    })),
  };
}

function serializeCredential(credential) {
  const response = {
    clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
  };
  if ("attestationObject" in credential.response) {
    response.attestationObject = bufferToBase64url(credential.response.attestationObject);
    response.transports = credential.response.getTransports?.() || [];
  } else {
    response.authenticatorData = bufferToBase64url(credential.response.authenticatorData);
    response.signature = bufferToBase64url(credential.response.signature);
    response.userHandle = bufferToBase64url(credential.response.userHandle);
  }
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response,
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function renderAvatar(element, user) {
  element.replaceChildren();
  if (user.avatar_url) {
    const image = document.createElement("img");
    image.src = user.avatar_url;
    image.alt = "";
    image.addEventListener("error", () => {
      element.replaceChildren(document.createTextNode(initials(user.display_name)));
    }, { once: true });
    element.append(image);
  } else {
    element.textContent = initials(user.display_name);
  }
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLastSeen(timestamp) {
  if (!timestamp) return "offline";
  const date = new Date(timestamp * 1000);
  const isToday = date.toDateString() === new Date().toDateString();
  const formatted = date.toLocaleString([], {
    month: isToday ? undefined : "short",
    day: isToday ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `last seen ${isToday ? "today " : ""}${formatted}`;
}

function formatDateTime(timestamp) {
  if (!timestamp) return "Never";
  return new Date(timestamp * 1000).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function updateConversationStatus() {
  if (!selectedContact) {
    conversationStatus.textContent = "Private conversation";
    return;
  }
  if (typingContactId === selectedContact.id) {
    conversationStatus.textContent = "typing...";
    conversationStatus.classList.add("typing");
    return;
  }
  conversationStatus.classList.remove("typing");
  conversationStatus.textContent = selectedContact.is_online
    ? "online"
    : formatLastSeen(selectedContact.last_seen);
  document.querySelector("#conversation-avatar").classList.toggle(
    "online",
    selectedContact.is_online,
  );
}

function conversationIsVisible() {
  const mobile = window.matchMedia("(max-width: 700px)").matches;
  return Boolean(
    selectedContact
    && (!mobile || chatView.classList.contains("conversation-open")),
  );
}

function showAuth() {
  offlineView.classList.add("hidden");
  authView.classList.remove("hidden");
  chatView.classList.add("hidden");
  document.querySelector("#normal-auth-area").classList.remove("hidden");
  document.querySelector("#invitation-area").classList.add("hidden");
  document.querySelector("#display-name").parentElement.classList.toggle("hidden", !needsSetup);
  document.querySelector("#auth-help").textContent = needsSetup
    ? "Create the first administrator account."
    : "Sign in with your family account.";
  document.querySelector("#auth-button").textContent = needsSetup ? "Create family chat" : "Sign in";
  document.querySelector("#passkey-login-area").classList.toggle(
    "hidden",
    needsSetup || !window.PublicKeyCredential,
  );
}

async function showInvitationRegistration() {
  offlineView.classList.add("hidden");
  chatView.classList.add("hidden");
  authView.classList.remove("hidden");
  document.querySelector("#normal-auth-area").classList.add("hidden");
  document.querySelector("#invitation-area").classList.remove("hidden");
  try {
    const details = await api("/api/invitations/inspect", {
      method: "POST",
      body: JSON.stringify({ token: inviteToken }),
    });
    document.querySelector("#invitation-email").textContent = details.email;
    document.querySelector("#invitation-display-name").value = details.suggested_name || "";
  } catch (exception) {
    document.querySelector("#invitation-email").textContent = "Invitation unavailable";
    document.querySelector("#invitation-error").textContent = exception.message;
    document.querySelector("#invitation-form").classList.add("hidden");
  }
}

function renderContacts() {
  contactsElement.replaceChildren();
  if (!contacts.length) {
    const empty = document.createElement("p");
    empty.className = "contacts-empty";
    empty.textContent = currentUser.is_admin
      ? "Add a family member to begin chatting."
      : "No other family members yet.";
    contactsElement.append(empty);
    return;
  }

  contacts.forEach((contact) => {
    const button = document.createElement("button");
    button.className = `contact${selectedContact?.id === contact.id ? " selected" : ""}`;
    button.type = "button";
    button.addEventListener("click", () => selectContact(contact.id));

    const avatar = document.createElement("span");
    avatar.className = `avatar${contact.is_online ? " online" : ""}`;
    renderAvatar(avatar, contact);

    const details = document.createElement("span");
    details.className = "contact-details";
    const name = document.createElement("strong");
    name.textContent = contact.display_name;
    const username = document.createElement("small");
    if (
      contact.last_message_body
      || contact.last_message_attachment_name
      || contact.last_message_deleted_at
    ) {
      if (contact.last_message_user_id === currentUser.id) {
        const receipt = document.createElement("span");
        receipt.className = "contact-receipt";
        receipt.textContent = contact.last_message_read_at
          ? "\u2713\u2713"
          : contact.last_message_delivered_at
            ? "\u2713\u2713"
            : "\u2713";
        receipt.classList.toggle("read", Boolean(contact.last_message_read_at));
        const preview = contact.last_message_deleted_at
          ? "Message deleted"
          : contact.last_message_body || `Attachment: ${contact.last_message_attachment_name}`;
        username.append(receipt, document.createTextNode(` You: ${preview}`));
      } else {
        username.textContent = contact.last_message_deleted_at
          ? "Message deleted"
          : contact.last_message_body || `Attachment: ${contact.last_message_attachment_name}`;
      }
    } else {
      username.textContent = contact.is_online ? "online" : `@${contact.username}`;
    }
    details.append(name, username);

    const meta = document.createElement("span");
    meta.className = "contact-meta";
    const time = document.createElement("small");
    time.textContent = formatTime(contact.last_message_at);
    meta.append(time);
    if (contact.unread_count > 0) {
      const badge = document.createElement("span");
      badge.className = "unread-badge";
      badge.textContent = contact.unread_count > 99 ? "99+" : contact.unread_count;
      meta.append(badge);
    }

    button.append(avatar, details, meta);
    contactsElement.append(button);
  });
}

async function loadContacts() {
  contacts = await api("/api/contacts");
  const hadSelectedContact = Boolean(selectedContact);
  if (selectedContact) {
    selectedContact = contacts.find((contact) => contact.id === selectedContact.id) || null;
  }
  if (hadSelectedContact && !selectedContact) {
    chatView.classList.remove("conversation-open");
    conversation.classList.add("empty");
    activeConversation.classList.add("hidden");
    emptyConversation.classList.remove("hidden");
    messages.replaceChildren();
  }
  renderContacts();
  updateAppBadge();
}

function totalUnreadCount() {
  return contacts.reduce((total, contact) => total + Number(contact.unread_count || 0), 0);
}

async function updateAppBadge() {
  const count = totalUnreadCount();
  document.title = count ? `(${count}) Family Chat` : "Family Chat";
  if (!("setAppBadge" in navigator)) return;
  try {
    if (count) await navigator.setAppBadge(count);
    else await navigator.clearAppBadge();
  } catch {
    // Badge support varies between browsers and installation modes.
  }
}

function appendMessage(message) {
  if (document.querySelector(`[data-message-id="${message.id}"]`)) return;
  messagesById.set(message.id, message);
  const article = document.createElement("article");
  article.className = `message${message.user_id === currentUser.id ? " mine" : ""}`;
  article.dataset.messageId = message.id;

  if (message.reply_to_id) {
    const quote = document.createElement("button");
    quote.type = "button";
    quote.className = "message-quote";
    const author = document.createElement("strong");
    author.textContent = message.reply_display_name || "Message";
    const quoteBody = document.createElement("span");
    quoteBody.textContent = message.reply_deleted_at
      ? "Message deleted"
      : message.reply_body || message.reply_attachment_name || "Attachment";
    quote.append(author, quoteBody);
    quote.addEventListener("click", () => {
      document.querySelector(`[data-message-id="${message.reply_to_id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    article.append(quote);
  }

  const body = document.createElement("p");
  body.className = "message-body";
  body.textContent = message.deleted_at ? "Message deleted" : message.body;
  body.classList.toggle("deleted", Boolean(message.deleted_at));
  if (message.attachment_url && !message.deleted_at) {
    const attachmentLink = document.createElement("a");
    attachmentLink.className = "message-attachment";
    attachmentLink.href = message.attachment_url;
    attachmentLink.target = "_blank";
    attachmentLink.rel = "noopener";
    attachmentLink.download = message.attachment_name;
    if (message.attachment_content_type?.startsWith("image/")) {
      const image = document.createElement("img");
      image.src = message.attachment_url;
      image.alt = message.attachment_name;
      image.loading = "lazy";
      attachmentLink.append(image);
    } else {
      const fileIcon = document.createElement("span");
      fileIcon.className = "file-icon";
      fileIcon.innerHTML = icon("paperclip");
      attachmentLink.append(fileIcon);
    }
    const details = document.createElement("span");
    details.className = "attachment-details";
    const name = document.createElement("strong");
    name.textContent = message.attachment_name;
    const size = document.createElement("small");
    size.textContent = formatBytes(message.attachment_size);
    details.append(name, size);
    attachmentLink.append(details);
    article.append(attachmentLink);
  }
  const footer = document.createElement("footer");
  const edited = document.createElement("span");
  edited.className = "edited-label";
  edited.textContent = message.edited_at && !message.deleted_at ? "edited" : "";
  const timestamp = document.createElement("time");
  timestamp.dateTime = new Date(message.created_at * 1000).toISOString();
  timestamp.textContent = formatTime(message.created_at);
  footer.append(edited, timestamp);

  if (message.user_id === currentUser.id) {
    const receipt = document.createElement("span");
    const receiptState = message.read_at
      ? "read"
      : message.delivered_at
        ? "delivered"
        : "sent";
    receipt.className = `receipt ${receiptState}`;
    receipt.textContent = receiptState === "sent" ? "\u2713" : "\u2713\u2713";
    receipt.title = receiptState[0].toUpperCase() + receiptState.slice(1);
    footer.append(receipt);
  }

  const actions = document.createElement("div");
  actions.className = "message-actions";
  if (!message.deleted_at) {
    const replyButton = document.createElement("button");
    replyButton.type = "button";
    replyButton.title = "Reply";
    replyButton.setAttribute("aria-label", "Reply");
    setButtonIcon(replyButton, "reply");
    replyButton.addEventListener("click", () => startReply(message));
    actions.append(replyButton);
    if (message.user_id === currentUser.id) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.title = "Edit";
      editButton.setAttribute("aria-label", "Edit");
      setButtonIcon(editButton, "edit");
      editButton.addEventListener("click", () => startEdit(message));
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.title = "Delete";
      deleteButton.setAttribute("aria-label", "Delete");
      setButtonIcon(deleteButton, "trash");
      deleteButton.addEventListener("click", () => deleteMessage(message));
      actions.append(editButton, deleteButton);
    }
  }

  article.append(body, footer, actions);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
}

function clearComposerContext() {
  replyToMessage = null;
  editingMessage = null;
  composerContext.classList.add("hidden");
  messageInput.value = "";
  setButtonIcon(sendButton, "send");
  sendButton.title = "Send";
  sendButton.setAttribute("aria-label", "Send");
}

function clearAttachment() {
  selectedAttachment = null;
  attachmentInput.value = "";
  attachmentPreview.classList.add("hidden");
  uploadProgress.classList.add("hidden");
  uploadProgress.value = 0;
  document.querySelector("#attachment-preview-content").replaceChildren();
  if (attachmentObjectUrl) {
    URL.revokeObjectURL(attachmentObjectUrl);
    attachmentObjectUrl = null;
  }
}

function showAttachment(file) {
  if (file.size > maxAttachmentBytes) {
    attachmentInput.value = "";
    alert(`File is larger than ${formatBytes(maxAttachmentBytes)}.`);
    return;
  }
  clearAttachment();
  selectedAttachment = file;
  document.querySelector("#attachment-preview-name").textContent = file.name;
  document.querySelector("#attachment-preview-size").textContent = formatBytes(file.size);
  const content = document.querySelector("#attachment-preview-content");
  if (file.type.startsWith("image/")) {
    attachmentObjectUrl = URL.createObjectURL(file);
    const image = document.createElement("img");
    image.src = attachmentObjectUrl;
    image.alt = "";
    content.append(image);
  } else {
    content.innerHTML = icon("paperclip");
  }
  attachmentPreview.classList.remove("hidden");
}

function uploadAttachment(file, body) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("recipient_id", selectedContact.id);
    form.append("body", body);
    if (replyToMessage) form.append("reply_to_id", replyToMessage.id);
    form.append("attachment", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/messages/attachment");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      uploadProgress.classList.remove("hidden");
      uploadProgress.value = Math.round((event.loaded / event.total) * 100);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response);
      } else {
        reject(new Error(request.response?.detail || "Upload failed"));
      }
    };
    request.onerror = () => reject(new Error("Upload failed"));
    request.send(form);
  });
}

function showComposerContext(title, body) {
  document.querySelector("#composer-context-title").textContent = title;
  document.querySelector("#composer-context-body").textContent = body;
  composerContext.classList.remove("hidden");
  messageInput.focus();
}

function startReply(message) {
  editingMessage = null;
  replyToMessage = message;
  setButtonIcon(sendButton, "send");
  showComposerContext(
    `Reply to ${message.display_name}`,
    message.deleted_at
      ? "Message deleted"
      : message.body || message.attachment_name || "Attachment",
  );
}

function startEdit(message) {
  clearAttachment();
  replyToMessage = null;
  editingMessage = message;
  messageInput.value = message.body;
  setButtonIcon(sendButton, "save");
  sendButton.title = "Save edit";
  sendButton.setAttribute("aria-label", "Save edit");
  showComposerContext("Edit message", message.body);
  messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
}

async function deleteMessage(message) {
  if (!confirm("Delete this message?")) return;
  try {
    await api(`/api/messages/${message.id}`, { method: "DELETE" });
  } catch (exception) {
    alert(exception.message);
  }
}

async function markSelectedConversationRead() {
  if (!selectedContact) return;
  await api(`/api/messages/${selectedContact.id}/read`, { method: "POST" });
  const contact = contacts.find((item) => item.id === selectedContact.id);
  if (contact) contact.unread_count = 0;
  renderContacts();
  updateAppBadge();
}

async function selectContact(contactId) {
  if (selectedContact && selectedContact.id !== contactId) {
    sendTyping(false);
  }
  selectedContact = contacts.find((contact) => contact.id === contactId);
  if (!selectedContact) return;

  renderContacts();
  conversation.classList.remove("empty");
  chatView.classList.add("conversation-open");
  emptyConversation.classList.add("hidden");
  activeConversation.classList.remove("hidden");
  document.querySelector("#conversation-name").textContent = selectedContact.display_name;
  renderAvatar(document.querySelector("#conversation-avatar"), selectedContact);
  document.querySelector("#reset-password-button").classList.toggle(
    "hidden",
    !currentUser.is_admin,
  );
  updateConversationStatus();
  messages.replaceChildren();
  messagesById.clear();
  clearComposerContext();
  clearAttachment();
  (await api(`/api/messages/${selectedContact.id}`)).forEach(appendMessage);
  await markSelectedConversationRead();
  document.querySelector("#message-input").focus();
}

async function updateNotificationButton() {
  if (!("Notification" in window)) {
    setButtonIcon(notificationButton, "bell", "Notifications unsupported");
    return;
  }
  if (pushPublicKey && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      pushSubscribed = Boolean(await registration.pushManager.getSubscription());
    } catch {
      pushSubscribed = false;
    }
  }
  const labels = {
    default: "Enable notifications",
    granted: pushPublicKey && !pushSubscribed ? "Finish enabling notifications" : "Notifications on",
    denied: "Notifications blocked",
  };
  setButtonIcon(notificationButton, "bell", labels[Notification.permission]);
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

async function enablePushNotifications() {
  if (!pushPublicKey || !("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pushPublicKey),
    });
  }
  await api("/api/push/subscriptions", {
    method: "POST",
    body: JSON.stringify(subscription.toJSON()),
  });
  pushSubscribed = true;
  return true;
}

async function disablePushNotifications() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  try {
    await api("/api/push/subscriptions", {
      method: "DELETE",
      body: JSON.stringify(subscription.toJSON()),
    });
  } finally {
    await subscription.unsubscribe();
    pushSubscribed = false;
  }
}

function showNotificationStatus(message, isError = false) {
  notificationStatus.textContent = message;
  notificationStatus.classList.remove("hidden", "status-error");
  notificationStatus.classList.toggle("status-error", isError);
}

function notifyIncomingMessage(message, sender) {
  if (message.user_id === currentUser.id || !document.hidden) return;
  unreadCount = totalUnreadCount();
  updateAppBadge();

  if (
    "Notification" in window
    && Notification.permission === "granted"
    && !pushSubscribed
  ) {
    const options = {
      body: message.body || `Attachment: ${message.attachment_name}`,
      tag: `family-message-${message.id}`,
      icon: "/static/icons/icon-192.png",
      badge: "/static/icons/icon-192.png",
      data: { contactId: sender?.id || message.user_id },
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(sender?.display_name || message.display_name, options);
      });
    } else {
      const notification = new Notification(
        sender?.display_name || message.display_name,
        options,
      );
      notification.onclick = () => {
        window.focus();
        if (sender) selectContact(sender.id);
        notification.close();
      };
    }
  }
}

function updateReadReceipts(event) {
  event.message_ids.forEach((messageId) => {
    const receipt = document.querySelector(
      `[data-message-id="${messageId}"] .receipt`,
    );
    if (receipt) {
      receipt.textContent = "\u2713\u2713";
      receipt.classList.remove("sent", "delivered");
      receipt.classList.add("read");
      receipt.title = "Read";
    }
  });
}

function updateDeliveredReceipts(event) {
  event.message_ids.forEach((messageId) => {
    const receipt = document.querySelector(
      `[data-message-id="${messageId}"] .receipt`,
    );
    if (receipt && !receipt.classList.contains("read")) {
      receipt.textContent = "\u2713\u2713";
      receipt.classList.remove("sent");
      receipt.classList.add("delivered");
      receipt.title = "Delivered";
    }
  });
}

function updatePresence(event) {
  const contact = contacts.find((item) => item.id === event.user_id);
  if (!contact) return;
  contact.is_online = event.is_online;
  if (event.last_seen) contact.last_seen = event.last_seen;
  if (!event.is_online && typingContactId === event.user_id) {
    typingContactId = null;
  }
  renderContacts();
  updateConversationStatus();
}

function updateTyping(event) {
  if (event.user_id !== selectedContact?.id) return;
  clearTimeout(remoteTypingTimer);
  typingContactId = event.is_typing ? event.user_id : null;
  updateConversationStatus();
  if (event.is_typing) {
    remoteTypingTimer = setTimeout(() => {
      typingContactId = null;
      updateConversationStatus();
    }, 2000);
  }
}

function applyMessageEdit(event) {
  const message = messagesById.get(event.message_id);
  if (message) {
    message.body = event.body;
    message.edited_at = event.edited_at;
  }
  const article = document.querySelector(`[data-message-id="${event.message_id}"]`);
  if (!article) return;
  article.querySelector(".message-body").textContent = event.body;
  article.querySelector(".edited-label").textContent = "edited";
  if (editingMessage?.id === event.message_id) clearComposerContext();
}

function applyMessageDelete(event) {
  const message = messagesById.get(event.message_id);
  if (message) {
    message.body = "";
    message.deleted_at = event.deleted_at;
    message.edited_at = null;
  }
  const article = document.querySelector(`[data-message-id="${event.message_id}"]`);
  if (article) {
    article.querySelector(".message-attachment")?.remove();
    const body = article.querySelector(".message-body");
    body.textContent = "Message deleted";
    body.classList.add("deleted");
    article.querySelector(".edited-label").textContent = "";
    article.querySelector(".message-actions").replaceChildren();
  }
  document.querySelectorAll(".message-quote").forEach((quote) => {
    const quotedMessage = quote.closest(".message");
    const quotedData = messagesById.get(Number(quotedMessage?.dataset.messageId));
    if (quotedData?.reply_to_id === event.message_id) {
      quote.querySelector("span").textContent = "Message deleted";
      quotedData.reply_deleted_at = event.deleted_at;
    }
  });
  if (replyToMessage?.id === event.message_id || editingMessage?.id === event.message_id) {
    clearComposerContext();
  }
}

async function receiveSocketEvent(event) {
  if (event.type === "session_revoked") {
    currentUser = null;
    selectedContact = null;
    if (socket) socket.close();
    if (adminDialog.open) adminDialog.close();
    if (profileDialog.open) profileDialog.close();
    showAuth();
    document.querySelector("#auth-error").textContent = event.reason || "Your session ended.";
    return;
  }
  if (event.type === "session_refresh") {
    await initialize();
    return;
  }
  if (event.type === "members_changed") {
    await loadContacts();
    if (currentUser.is_admin && adminDialog.open) await loadAdminOverview();
    return;
  }
  if (event.type === "member_added") {
    await loadContacts();
    return;
  }
  if (event.type === "profile_updated") {
    if (event.user.id === currentUser.id) {
      currentUser = { ...currentUser, ...event.user };
      document.querySelector("#identity").textContent = currentUser.display_name;
    }
    const contact = contacts.find((item) => item.id === event.user.id);
    if (contact) Object.assign(contact, event.user);
    if (selectedContact?.id === event.user.id) {
      Object.assign(selectedContact, event.user);
      document.querySelector("#conversation-name").textContent = selectedContact.display_name;
      renderAvatar(document.querySelector("#conversation-avatar"), selectedContact);
    }
    renderContacts();
    return;
  }
  if (event.type === "messages_read") {
    updateReadReceipts(event);
    return;
  }
  if (event.type === "messages_delivered") {
    updateDeliveredReceipts(event);
    return;
  }
  if (event.type === "presence") {
    updatePresence(event);
    return;
  }
  if (event.type === "typing") {
    updateTyping(event);
    return;
  }
  if (event.type === "message_edited") {
    applyMessageEdit(event);
    await loadContacts();
    return;
  }
  if (event.type === "message_deleted") {
    applyMessageDelete(event);
    await loadContacts();
    return;
  }
  if (event.type !== "message") return;

  const message = event.message;
  const otherUserId = message.user_id === currentUser.id
    ? message.recipient_id
    : message.user_id;
  const contact = contacts.find((item) => item.id === otherUserId);
  const isOpen = selectedContact?.id === otherUserId;

  if (isOpen) {
    appendMessage(message);
    if (
      message.recipient_id === currentUser.id
      && !document.hidden
      && document.hasFocus()
      && conversationIsVisible()
    ) {
      await markSelectedConversationRead();
    }
  }
  await loadContacts();
  updateConversationStatus();
  notifyIncomingMessage(message, contact);
}

function connectSocket() {
  if (socket) socket.close();
  clearTimeout(reconnectTimer);
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${protocol}://${location.host}/ws`);
  socket.onmessage = (event) => receiveSocketEvent(JSON.parse(event.data));
  socket.onopen = () => loadContacts().then(updateConversationStatus);
  socket.onclose = () => {
    if (!chatView.classList.contains("hidden")) {
      reconnectTimer = setTimeout(connectSocket, 1500);
    }
  };
}

async function showChat() {
  offlineView.classList.add("hidden");
  authView.classList.add("hidden");
  chatView.classList.remove("hidden");
  document.querySelector("#identity").textContent = currentUser.display_name;
  document.querySelector("#add-member-button").classList.toggle("hidden", !currentUser.is_admin);
  await updateNotificationButton();
  await loadContacts();
  connectSocket();
  const contactId = Number(new URLSearchParams(window.location.search).get("contact"));
  if (contactId && contacts.some((contact) => contact.id === contactId)) {
    await selectContact(contactId);
    window.history.replaceState({}, "", "/");
  }
  if (inviteToken) {
    showNotificationStatus(
      "Sign out before accepting an invitation for another family member.",
    );
  }
}

function adminButton(label, action, id, style = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  if (style) button.className = style;
  return button;
}

function renderAdminOverview(data) {
  const membersElement = document.querySelector("#admin-members");
  const invitationsElement = document.querySelector("#admin-invitations");
  membersElement.replaceChildren();
  invitationsElement.replaceChildren();

  const passkeysByUser = new Map();
  data.passkeys.forEach((passkey) => {
    const list = passkeysByUser.get(passkey.user_id) || [];
    list.push(passkey);
    passkeysByUser.set(passkey.user_id, list);
  });

  data.members.forEach((member) => {
    const row = document.createElement("article");
    row.className = "admin-row";
    const main = document.createElement("div");
    main.className = "admin-row-main";
    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = member.display_name;
    const identity = document.createElement("small");
    identity.textContent = `${member.email || `@${member.username}`} · joined ${formatDateTime(member.created_at)}`;
    details.append(name, identity);
    const badge = document.createElement("span");
    badge.className = `admin-badge${member.disabled_at ? " disabled" : ""}`;
    badge.textContent = member.disabled_at ? "Disabled" : member.is_admin ? "Admin" : "Member";
    main.append(details, badge);
    row.append(main);

    const actions = document.createElement("div");
    actions.className = "admin-actions";
    if (member.id !== currentUser.id) {
      actions.append(
        adminButton(member.disabled_at ? "Enable" : "Disable", "toggle-disabled", member.id, "secondary"),
        adminButton(member.is_admin ? "Remove admin" : "Make admin", "toggle-admin", member.id, "secondary"),
        adminButton("Sign out devices", "sign-out", member.id, "secondary"),
        adminButton("Remove account", "delete-user", member.id, "danger"),
      );
    } else {
      const self = document.createElement("small");
      self.textContent = "This is your account.";
      actions.append(self);
    }
    row.append(actions);

    const memberPasskeys = passkeysByUser.get(member.id) || [];
    if (memberPasskeys.length) {
      const passkeyList = document.createElement("div");
      passkeyList.className = "admin-passkeys";
      memberPasskeys.forEach((passkey) => {
        const item = document.createElement("div");
        item.className = "admin-passkey";
        const text = document.createElement("span");
        const type = passkey.device_type === "multi_device" ? "Synced passkey" : "Device passkey";
        text.textContent = `${type} · last used ${formatDateTime(passkey.last_used_at)}`;
        item.append(text, adminButton("Revoke", "revoke-passkey", passkey.id, "danger"));
        passkeyList.append(item);
      });
      row.append(passkeyList);
    }
    membersElement.append(row);
  });

  if (!data.invitations.length) {
    invitationsElement.textContent = "No invitations yet.";
  }
  data.invitations.forEach((invitation) => {
    const row = document.createElement("article");
    row.className = "admin-row";
    const main = document.createElement("div");
    main.className = "admin-row-main";
    const details = document.createElement("div");
    const email = document.createElement("strong");
    email.textContent = invitation.email;
    const meta = document.createElement("small");
    meta.textContent = `${invitation.suggested_name || "No suggested name"} · sent ${formatDateTime(invitation.created_at)}`;
    details.append(email, meta);
    const badge = document.createElement("span");
    badge.className = `admin-badge ${invitation.status}`;
    badge.textContent = invitation.status;
    main.append(details, badge);
    row.append(main);
    if (invitation.status !== "accepted") {
      const actions = document.createElement("div");
      actions.className = "admin-actions";
      actions.append(
        adminButton("Resend", "resend-invitation", invitation.id),
        adminButton("Revoke", "revoke-invitation", invitation.id, "danger"),
      );
      row.append(actions);
    }
    invitationsElement.append(row);
  });
}

async function loadAdminOverview() {
  const error = document.querySelector("#admin-error");
  error.textContent = "";
  try {
    renderAdminOverview(await api("/api/admin/overview"));
  } catch (exception) {
    error.textContent = exception.message;
  }
}

async function initialize() {
  const status = await api("/api/status");
  needsSetup = status.needs_setup;
  currentUser = status.user;
  maxAttachmentBytes = status.max_attachment_bytes || maxAttachmentBytes;
  maxAvatarBytes = status.max_avatar_bytes || maxAvatarBytes;
  pushPublicKey = status.push_public_key || null;
  if (currentUser) {
    await showChat();
  } else if (inviteToken) {
    await showInvitationRegistration();
  } else {
    showAuth();
  }
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#auth-error");
  error.textContent = "";
  try {
    await api(needsSetup ? "/api/setup" : "/api/login", {
      method: "POST",
      body: JSON.stringify({
        display_name: document.querySelector("#display-name").value || null,
        username: document.querySelector("#username").value,
        password: document.querySelector("#password").value,
      }),
    });
    await initialize();
  } catch (exception) {
    error.textContent = exception.message;
  }
});

document.querySelector("#invitation-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#invitation-error");
  error.textContent = "";
  try {
    await api("/api/invitations/register", {
      method: "POST",
      body: JSON.stringify({
        token: inviteToken,
        display_name: document.querySelector("#invitation-display-name").value.trim(),
        username: document.querySelector("#invitation-username").value.trim(),
      }),
    });
    window.history.replaceState({}, "", "/");
    inviteToken = null;
    await initialize();
    showNotificationStatus(
      "Account created. Open your profile and set up phone sign-in now.",
    );
    document.querySelector("#profile-button").click();
  } catch (exception) {
    error.textContent = exception.message;
  }
});

document.querySelector("#passkey-login-button").addEventListener("click", async () => {
  const error = document.querySelector("#auth-error");
  error.textContent = "";
  if (!window.PublicKeyCredential) {
    error.textContent = "This browser does not support passkeys.";
    return;
  }
  try {
    const ceremony = await api("/api/passkeys/authenticate/options", {
      method: "POST",
    });
    const credential = await navigator.credentials.get({
      publicKey: prepareRequestOptions(ceremony.options),
    });
    await api("/api/passkeys/authenticate/verify", {
      method: "POST",
      body: JSON.stringify({
        ceremony_id: ceremony.ceremony_id,
        credential: serializeCredential(credential),
      }),
    });
    await initialize();
  } catch (exception) {
    error.textContent = exception.name === "NotAllowedError"
      ? "Phone sign-in was cancelled or no passkey is registered."
      : exception.message;
  }
});

document.querySelector("#message-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedContact) return;
  const input = messageInput;
  const body = input.value.trim();
  if (!body && !selectedAttachment) return;
  input.value = "";
  try {
    if (editingMessage) {
      await api(`/api/messages/${editingMessage.id}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
      clearComposerContext();
      await loadContacts();
      return;
    }
    if (selectedAttachment) {
      const sent = await uploadAttachment(selectedAttachment, body);
      appendMessage(sent);
      clearAttachment();
      clearComposerContext();
      await loadContacts();
      return;
    }
    const sent = await api("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipient_id: selectedContact.id,
        body,
        reply_to_id: replyToMessage?.id || null,
      }),
    });
    appendMessage(sent);
    clearComposerContext();
    await loadContacts();
  } catch (exception) {
    input.value = body;
    alert(exception.message);
  }
});

document.querySelector("#cancel-composer-context").addEventListener(
  "click",
  clearComposerContext,
);
document.querySelector("#attachment-button").addEventListener(
  "click",
  () => attachmentInput.click(),
);
attachmentInput.addEventListener("change", () => {
  const file = attachmentInput.files[0];
  if (file) showAttachment(file);
});
document.querySelector("#camera-button").addEventListener(
  "click",
  () => cameraInput.click(),
);
cameraInput.addEventListener("change", () => {
  const file = cameraInput.files[0];
  if (file) showAttachment(file);
  cameraInput.value = "";
});
document.querySelector("#cancel-attachment").addEventListener(
  "click",
  clearAttachment,
);

function sendTyping(isTyping) {
  if (!selectedContact || socket?.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({
    type: "typing",
    recipient_id: selectedContact.id,
    is_typing: isTyping,
  }));
}

messageInput.addEventListener("input", () => {
  clearTimeout(typingStopTimer);
  sendTyping(Boolean(messageInput.value.trim()));
  typingStopTimer = setTimeout(() => sendTyping(false), 1200);
});
messageInput.addEventListener("blur", () => sendTyping(false));

document.querySelector("#back-button").addEventListener("click", () => {
  sendTyping(false);
  chatView.classList.remove("conversation-open");
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    await disablePushNotifications();
  } catch {
    // Logout should still work if a push service is temporarily unavailable.
  }
  await api("/api/logout", { method: "POST" });
  currentUser = null;
  selectedContact = null;
  if (socket) socket.close();
  contacts = [];
  updateAppBadge();
  if (inviteToken) await initialize();
  else showAuth();
});

document.querySelector("#passkey-register-button").addEventListener("click", async () => {
  const error = document.querySelector("#profile-error");
  error.textContent = "";
  if (!window.PublicKeyCredential) {
    error.textContent = "This browser does not support passkeys.";
    return;
  }
  try {
    const ceremony = await api("/api/passkeys/register/options", {
      method: "POST",
    });
    const credential = await navigator.credentials.create({
      publicKey: prepareCreationOptions(ceremony.options),
    });
    await api("/api/passkeys/register/verify", {
      method: "POST",
      body: JSON.stringify({
        ceremony_id: ceremony.ceremony_id,
        credential: serializeCredential(credential),
      }),
    });
    profileDialog.close();
    showNotificationStatus(
      "Phone sign-in is ready. You can now use fingerprint, face unlock, or your screen lock.",
    );
  } catch (exception) {
    error.textContent = exception.name === "NotAllowedError"
      ? "Passkey setup was cancelled."
      : `Could not set up phone sign-in: ${exception.message}`;
  }
});

function clearProfilePreviewUrl() {
  if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
  profilePreviewUrl = null;
}

function updateProfilePreview() {
  const preview = document.querySelector("#profile-avatar-preview");
  if (profileAvatarFile) {
    clearProfilePreviewUrl();
    profilePreviewUrl = URL.createObjectURL(profileAvatarFile);
    renderAvatar(preview, {
      display_name: document.querySelector("#profile-display-name").value || currentUser.display_name,
      avatar_url: profilePreviewUrl,
    });
  } else {
    renderAvatar(preview, {
      ...currentUser,
      display_name: document.querySelector("#profile-display-name").value || currentUser.display_name,
      avatar_url: removeProfileAvatar ? null : currentUser.avatar_url,
    });
  }
  document.querySelector("#remove-profile-avatar").classList.toggle(
    "hidden",
    !profileAvatarFile && (!currentUser.avatar_url || removeProfileAvatar),
  );
}

document.querySelector("#profile-button").addEventListener("click", () => {
  profileAvatarFile = null;
  removeProfileAvatar = false;
  clearProfilePreviewUrl();
  document.querySelector("#profile-form").reset();
  document.querySelector("#profile-display-name").value = currentUser.display_name;
  document.querySelector("#profile-error").textContent = "";
  updateProfilePreview();
  profileDialog.showModal();
});

document.querySelector("#profile-display-name").addEventListener("input", updateProfilePreview);
document.querySelector("#profile-avatar-input").addEventListener("change", (event) => {
  const file = event.target.files[0] || null;
  const error = document.querySelector("#profile-error");
  error.textContent = "";
  if (file && file.size > maxAvatarBytes) {
    event.target.value = "";
    error.textContent = `Profile photo must be smaller than ${formatBytes(maxAvatarBytes)}.`;
    return;
  }
  profileAvatarFile = file;
  removeProfileAvatar = false;
  updateProfilePreview();
});
document.querySelector("#remove-profile-avatar").addEventListener("click", () => {
  profileAvatarFile = null;
  removeProfileAvatar = true;
  document.querySelector("#profile-avatar-input").value = "";
  clearProfilePreviewUrl();
  updateProfilePreview();
});
document.querySelector("#cancel-profile").addEventListener("click", () => {
  clearProfilePreviewUrl();
  profileDialog.close();
});
document.querySelector("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#profile-error");
  const displayName = document.querySelector("#profile-display-name").value.trim();
  error.textContent = "";
  if (!displayName) {
    error.textContent = "Enter a display name.";
    return;
  }
  const formData = new FormData();
  formData.append("display_name", displayName);
  formData.append("remove_avatar", String(removeProfileAvatar));
  if (profileAvatarFile) formData.append("avatar", profileAvatarFile);
  try {
    const response = await fetch("/api/profile", { method: "PUT", body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Could not update profile");
    currentUser = { ...currentUser, ...data };
    document.querySelector("#identity").textContent = currentUser.display_name;
    clearProfilePreviewUrl();
    profileDialog.close();
  } catch (exception) {
    error.textContent = exception.message;
  }
});

document.querySelector("#change-password-button").addEventListener("click", () => {
  document.querySelector("#change-password-error").textContent = "";
  document.querySelector("#change-password-form").reset();
  changePasswordDialog.showModal();
});
document.querySelector("#cancel-change-password").addEventListener("click", () => {
  changePasswordDialog.close();
});
document.querySelector("#change-password-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#change-password-error");
  const newPassword = document.querySelector("#new-password").value;
  const confirmation = document.querySelector("#confirm-new-password").value;
  error.textContent = "";
  if (newPassword !== confirmation) {
    error.textContent = "New passwords do not match";
    return;
  }
  try {
    await api("/api/password", {
      method: "POST",
      body: JSON.stringify({
        current_password: document.querySelector("#current-password").value,
        new_password: newPassword,
      }),
    });
    changePasswordDialog.close();
    await api("/api/logout", { method: "POST" });
    currentUser = null;
    selectedContact = null;
    if (socket) socket.close();
    showAuth();
    document.querySelector("#auth-error").textContent =
      "Password changed. Sign in with your new password.";
  } catch (exception) {
    error.textContent = exception.message;
  }
});

document.querySelector("#reset-password-button").addEventListener("click", () => {
  if (!selectedContact || !currentUser.is_admin) return;
  document.querySelector("#reset-password-name").textContent = selectedContact.display_name;
  document.querySelector("#reset-password-error").textContent = "";
  document.querySelector("#reset-password-form").reset();
  resetPasswordDialog.showModal();
});
document.querySelector("#cancel-reset-password").addEventListener("click", () => {
  resetPasswordDialog.close();
});
document.querySelector("#reset-password-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedContact) return;
  const error = document.querySelector("#reset-password-error");
  const newPassword = document.querySelector("#reset-password-value").value;
  const confirmation = document.querySelector("#confirm-reset-password").value;
  error.textContent = "";
  if (newPassword !== confirmation) {
    error.textContent = "Passwords do not match";
    return;
  }
  try {
    await api(`/api/users/${selectedContact.id}/password`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    });
    resetPasswordDialog.close();
    alert(`Password reset for ${selectedContact.display_name}.`);
  } catch (exception) {
    error.textContent = exception.message;
  }
});

notificationButton.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    showNotificationStatus("This browser does not support desktop notifications.", true);
    return;
  }
  if (!window.isSecureContext) {
    showNotificationStatus(
      "Notifications require HTTPS. For local testing, open http://localhost:8765.",
      true,
    );
    return;
  }
  if (Notification.permission === "denied") {
    showNotificationStatus(
      "Notifications are blocked. Allow them in the browser site settings, then reload.",
      true,
    );
    return;
  }
  try {
    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    if (permission === "granted") await enablePushNotifications();
    await updateNotificationButton();
    if (permission === "granted") {
      const options = {
        body: "Notifications are now enabled.",
        icon: "/static/icons/icon-192.png",
        badge: "/static/icons/icon-192.png",
      };
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Family Chat", options);
      } else {
        new Notification("Family Chat", options);
      }
      showNotificationStatus("Notifications are enabled.");
    } else {
      showNotificationStatus("Notification permission was not granted.", true);
    }
  } catch (error) {
    showNotificationStatus(`Could not enable notifications: ${error.message}`, true);
  }
});

document.addEventListener("visibilitychange", async () => {
  if (!document.hidden) {
    unreadCount = 0;
    if (conversationIsVisible()) await markSelectedConversationRead();
    else await loadContacts();
  }
});

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

function updateViewportHeight() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

window.visualViewport?.addEventListener("resize", updateViewportHeight);
window.addEventListener("resize", updateViewportHeight);
updateViewportHeight();

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  document.querySelector("#install-button").classList.remove("hidden");
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  document.querySelector("#install-button").classList.add("hidden");
  showNotificationStatus("Family Chat is installed.");
});

document.querySelector("#install-button").addEventListener("click", async () => {
  if (installPrompt) {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    document.querySelector("#install-button").classList.add("hidden");
    return;
  }
  showNotificationStatus(
    "On iPhone or iPad, use Safari Share, then choose Add to Home Screen.",
  );
});

function configureInstallButton() {
  if (isStandalone()) return;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos) document.querySelector("#install-button").classList.remove("hidden");
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        worker.postMessage({ type: "SKIP_WAITING" });
      }
    });
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingServiceWorker) return;
    refreshingServiceWorker = true;
    window.location.reload();
  });
}

document.querySelector("#retry-button").addEventListener("click", () => {
  window.location.reload();
});

window.addEventListener("online", () => {
  if (!offlineView.classList.contains("hidden")) window.location.reload();
});

document.querySelector("#add-member-button").addEventListener("click", async () => {
  adminDialog.showModal();
  await loadAdminOverview();
});
document.querySelector("#close-admin").addEventListener("click", () => adminDialog.close());
document.querySelector("#refresh-admin").addEventListener("click", loadAdminOverview);
document.querySelector("#invite-from-admin").addEventListener("click", () => {
  adminDialog.close();
  document.querySelector("#member-error").textContent = "";
  document.querySelector("#member-form").reset();
  memberDialog.showModal();
});
document.querySelector("#admin-dialog").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  let path;
  let options = { method: "POST" };
  let confirmation = null;

  if (action === "toggle-disabled") {
    path = `/api/admin/users/${id}/toggle-disabled`;
    confirmation = `${button.textContent} this family member?`;
  } else if (action === "toggle-admin") {
    const makeAdmin = button.textContent === "Make admin";
    path = `/api/admin/users/${id}/role`;
    options.body = JSON.stringify({ is_admin: makeAdmin });
    confirmation = makeAdmin
      ? "Give this member administrator access?"
      : "Remove administrator access from this member?";
  } else if (action === "sign-out") {
    path = `/api/admin/users/${id}/sign-out`;
    confirmation = "Sign this member out from every device?";
  } else if (action === "delete-user") {
    path = `/api/admin/users/${id}`;
    options.method = "DELETE";
    confirmation = "Permanently remove this account and all of its messages and files?";
  } else if (action === "revoke-passkey") {
    path = `/api/admin/passkeys/${id}`;
    options.method = "DELETE";
    confirmation = "Revoke this passkey? That device may no longer be able to sign in.";
  } else if (action === "resend-invitation") {
    path = `/api/admin/invitations/${id}/resend`;
  } else if (action === "revoke-invitation") {
    path = `/api/admin/invitations/${id}`;
    options.method = "DELETE";
    confirmation = "Revoke this invitation link?";
  } else {
    return;
  }

  if (confirmation && !window.confirm(confirmation)) return;
  const error = document.querySelector("#admin-error");
  error.textContent = "";
  button.disabled = true;
  try {
    await api(path, options);
    await loadAdminOverview();
    await loadContacts();
  } catch (exception) {
    error.textContent = exception.message;
  } finally {
    button.disabled = false;
  }
});
document.querySelector("#cancel-member").addEventListener("click", () => memberDialog.close());
document.querySelector("#member-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#member-error");
  error.textContent = "";
  try {
    const result = await api("/api/invitations", {
      method: "POST",
      body: JSON.stringify({
        email: document.querySelector("#member-email").value,
        display_name: document.querySelector("#member-display-name").value || null,
      }),
    });
    event.target.reset();
    memberDialog.close();
    showNotificationStatus(`Invitation sent to ${result.email}.`);
    adminDialog.showModal();
    await loadAdminOverview();
  } catch (exception) {
    error.textContent = exception.message;
  }
});

configureInstallButton();
registerServiceWorker().catch(() => {
  // The app remains usable if service-worker registration is unavailable.
});
initialize().catch((exception) => {
  authView.classList.add("hidden");
  chatView.classList.add("hidden");
  offlineView.classList.remove("hidden");
  const message = offlineView.querySelector("p");
  message.textContent = navigator.onLine
    ? `Family Chat could not start: ${exception.message}`
    : "Your messages are safe. Reconnect to the internet and try again.";
});
