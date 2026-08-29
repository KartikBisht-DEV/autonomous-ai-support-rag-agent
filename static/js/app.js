/**
 * Autonomous AI Support Agent with RAG - App Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // App State
    const state = {
        activeTab: "chat-tab",
        theme: localStorage.getItem("rag_theme") || "dark",
        llmProvider: localStorage.getItem("rag_provider") || "local",
        apiKey: localStorage.getItem("rag_api_key") || "",
        systemPrompt: localStorage.getItem("rag_sys_prompt") || "You are an Autonomous AI Customer Support Agent with RAG. You provide accurate, factual assistance grounded strictly in company policies.",
        userEmail: "bishtkartik2005@gmail.com",
        chunks: [],
        stats: null,
        chatHistory: []
    };

    // DOM Elements - Theme Toggle
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const themeIcon = document.getElementById("theme-icon");
    const themeLabel = document.getElementById("theme-label");
    const mobileThemeToggleBtn = document.getElementById("mobile-theme-toggle-btn");
    const mobileThemeIcon = document.getElementById("mobile-theme-icon");

    // Theme Switch Controller
    function applyTheme(t) {
        state.theme = t;
        localStorage.setItem("rag_theme", t);
        if (t === "light") {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            if (themeIcon) themeIcon.className = "fa-solid fa-moon";
            if (themeLabel) themeLabel.textContent = "Dark Mode";
            if (mobileThemeIcon) mobileThemeIcon.className = "fa-solid fa-moon";
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
            if (themeIcon) themeIcon.className = "fa-solid fa-sun";
            if (themeLabel) themeLabel.textContent = "Light Mode";
            if (mobileThemeIcon) mobileThemeIcon.className = "fa-solid fa-sun";
        }
    }

    function toggleTheme() {
        const nextTheme = state.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
    }

    if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
    if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener("click", toggleTheme);

    // Apply saved theme on boot
    applyTheme(state.theme);

    // DOM Elements - Navigation
    const navLinks = document.querySelectorAll(".nav-link");
    const bottomNavItems = document.querySelectorAll(".bottom-nav-item");
    const tabPanes = document.querySelectorAll(".tab-content");
    const sidebar = document.getElementById("sidebar");
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
    const drawerBackdrop = document.getElementById("drawer-backdrop");

    // Chat Elements
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");
    const promptChips = document.querySelectorAll(".prompt-chip");
    const btnExportChat = document.getElementById("btn-export-chat");

    // Knowledge Base Elements
    const chunksContainer = document.getElementById("chunks-container");
    const chunksFilterInput = document.getElementById("chunks-filter-input");
    const sidebarChunkBadge = document.getElementById("sidebar-chunk-badge");
    const kbTotalChunksBadge = document.getElementById("kb-total-chunks-badge");
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("file-input");
    const dropzone = document.getElementById("dropzone");
    const docCategory = document.getElementById("doc-category");
    const btnQuickReset = document.getElementById("btn-quick-reset");
    const sidebarActiveProvider = document.getElementById("sidebar-active-provider");

    // Vector Sandbox Elements
    const sandboxQuery = document.getElementById("sandbox-query");
    const btnSandboxSearch = document.getElementById("btn-sandbox-search");
    const sandboxResults = document.getElementById("sandbox-results");

    // Tools Elements
    const ordersContainer = document.getElementById("orders-container");
    const toolSelect = document.getElementById("tool-select");
    const toolParamContainer = document.getElementById("tool-param-container");
    const btnRunTool = document.getElementById("btn-run-tool");
    const toolOutput = document.getElementById("tool-output");

    // Settings Elements
    const settingsForm = document.getElementById("settings-form");
    const llmProviderSelect = document.getElementById("llm-provider-select");
    const apiKeyGroup = document.getElementById("api-key-group");
    const apiKeyInput = document.getElementById("api-key-input");
    const systemPromptInput = document.getElementById("system-prompt-input");

    // Citation Modal
    const citationModal = document.getElementById("citation-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMeta = document.getElementById("modal-meta");
    const modalContent = document.getElementById("modal-content");
    const btnCloseModal = document.getElementById("btn-close-modal");

    // 1. Navigation Controller (Desktop & Mobile Sync)
    function switchTab(targetTabId) {
        state.activeTab = targetTabId;

        // Update Desktop Nav
        navLinks.forEach(l => {
            if (l.getAttribute("data-tab") === targetTabId) l.classList.add("active");
            else l.classList.remove("active");
        });

        // Update Mobile Bottom Nav
        bottomNavItems.forEach(b => {
            if (b.getAttribute("data-tab") === targetTabId) b.classList.add("active");
            else b.classList.remove("active");
        });

        // Switch Active Panes
        tabPanes.forEach(pane => {
            if (pane.id === targetTabId) pane.classList.add("active");
            else pane.classList.remove("active");
        });

        // Close mobile drawer if open
        closeMobileDrawer();

        // Trigger on-demand loads
        if (targetTabId === "kb-tab") loadKnowledgeBase();
        if (targetTabId === "tools-tab") loadToolsData();
    }

    navLinks.forEach(l => l.addEventListener("click", () => switchTab(l.getAttribute("data-tab"))));
    bottomNavItems.forEach(b => b.addEventListener("click", () => switchTab(b.getAttribute("data-tab"))));

    // Mobile Drawer Handlers
    function openMobileDrawer() {
        sidebar.classList.add("open");
        drawerBackdrop.classList.add("active");
    }

    function closeMobileDrawer() {
        sidebar.classList.remove("open");
        drawerBackdrop.classList.remove("active");
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileDrawer);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeMobileDrawer);

    // 2. Initialization & Welcome Setup
    function init() {
        llmProviderSelect.value = state.llmProvider;
        apiKeyInput.value = state.apiKey;
        systemPromptInput.value = state.systemPrompt;
        updateProviderUI();

        appendBotMessage({
            response: `👋 **Welcome to the Autonomous AI Support Agent with RAG!**\n\nI am connected to your enterprise knowledge base and real-time order/billing systems. I can help you with:\n- 📦 **Order & Carrier Tracking** (e.g. \`ORD-9821\`, \`ORD-4412\`)\n- 💰 **Automated Refund & Return Evaluations** (e.g. \`Can I get a refund for ORD-9821?\`)\n- 🛡️ **Hardware Warranty Verification** (e.g. \`SN-QT8892\`)\n- 🚨 **Autonomous Escalation & Ticket Creation**\n\nSelect one of the suggested prompts below or type any question to begin!`,
            thought_steps: [
                {
                    step: 1,
                    title: "System Initialization",
                    description: "Loaded vector embeddings index into memory. Ready to process queries."
                }
            ],
            grounding_confidence: 1.0,
            citations: []
        });

        loadKnowledgeBase();
    }

    function updateProviderUI() {
        if (state.llmProvider === "local") {
            apiKeyGroup.style.display = "none";
            sidebarActiveProvider.textContent = "Local Engine";
        } else if (state.llmProvider === "gemini") {
            apiKeyGroup.style.display = "block";
            sidebarActiveProvider.textContent = "Gemini 2.0 Flash";
        } else if (state.llmProvider === "openai") {
            apiKeyGroup.style.display = "block";
            sidebarActiveProvider.textContent = "OpenAI GPT-4o";
        }
    }

    llmProviderSelect.addEventListener("change", (e) => {
        state.llmProvider = e.target.value;
        updateProviderUI();
    });

    settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        state.llmProvider = llmProviderSelect.value;
        state.apiKey = apiKeyInput.value.trim();
        state.systemPrompt = systemPromptInput.value.trim();

        localStorage.setItem("rag_provider", state.llmProvider);
        localStorage.setItem("rag_api_key", state.apiKey);
        localStorage.setItem("rag_sys_prompt", state.systemPrompt);

        alert("Configuration saved successfully!");
    });

    // 3. Chat Logic
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = userInput.value.trim();
        if (!query) return;

        appendUserMessage(query);
        userInput.value = "";

        const loadingId = appendLoadingIndicator();

        try {
            const resp = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: query,
                    user_email: state.userEmail,
                    llm_provider: state.llmProvider,
                    api_key: state.apiKey,
                    system_instruction: state.systemPrompt
                })
            });

            const data = await resp.json();
            removeLoadingIndicator(loadingId);

            if (resp.ok) {
                appendBotMessage(data);
                state.chatHistory.push({ role: "assistant", content: data.response, timestamp: new Date().toISOString() });
            } else {
                appendBotMessage({
                    response: `⚠️ **Error Processing Request**: ${data.detail || "Server error occurred."}`,
                    thought_steps: [],
                    citations: []
                });
            }
        } catch (err) {
            removeLoadingIndicator(loadingId);
            appendBotMessage({
                response: `⚠️ **Network Error**: Unable to reach backend agent server.`,
                thought_steps: [],
                citations: []
            });
        }
    });

    // Quick Prompts
    promptChips.forEach(btn => {
        btn.addEventListener("click", () => {
            userInput.value = btn.getAttribute("data-query");
            chatForm.dispatchEvent(new Event("submit"));
        });
    });

    function appendUserMessage(text) {
        state.chatHistory.push({ role: "user", content: text, timestamp: new Date().toISOString() });
        const row = document.createElement("div");
        row.className = "msg-row user";
        row.innerHTML = `
            <div class="msg-bubble-container">
                <div class="msg-bubble">${escapeHtml(text)}</div>
            </div>
            <div class="msg-avatar user"><i class="fa-solid fa-user"></i></div>
        `;
        chatMessages.appendChild(row);
        scrollToBottom();
    }

    function appendLoadingIndicator() {
        const id = "loading-" + Date.now();
        const row = document.createElement("div");
        row.className = "msg-row bot";
        row.id = id;
        row.innerHTML = `
            <div class="msg-avatar bot"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-bubble-container">
                <div class="msg-bubble">
                    <div style="display: flex; align-items: center; gap: 10px; color: var(--cyan);">
                        <i class="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Agentic Brain Orchestrating RAG Multi-Stage Pipeline...</span>
                    </div>
                </div>
            </div>
        `;
        chatMessages.appendChild(row);
        scrollToBottom();
        return id;
    }

    function removeLoadingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function appendBotMessage(data) {
        const row = document.createElement("div");
        row.className = "msg-row bot";

        let thoughtsHtml = "";
        if (data.thought_steps && data.thought_steps.length > 0) {
            thoughtsHtml = `
                <div class="thought-card">
                    <div class="thought-header-btn" onclick="this.parentElement.querySelector('.thought-body').classList.toggle('hidden')">
                        <span><i class="fa-solid fa-brain"></i> Agentic Thought Trace (${data.thought_steps.length} Steps) • ${data.execution_time_seconds ? data.execution_time_seconds + 's' : '< 0.05s'}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="thought-body">
                        ${data.thought_steps.map(s => `
                            <div class="thought-step">
                                <i class="fa-solid fa-check-circle"></i>
                                <div><strong>${escapeHtml(s.title)}:</strong> ${escapeHtml(s.description)}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        let citationsHtml = "";
        if (data.citations && data.citations.length > 0) {
            citationsHtml = `
                <div class="citations-footer">
                    <span style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-solid fa-bookmark"></i> Grounded Citations:</span>
                    ${data.citations.map(c => `
                        <button class="citation-badge-btn" onclick="showCitationModal('${escapeHtml(c.source)}', '${escapeHtml(c.category || 'Policy')}', ${c.score || 0.95})">
                            <i class="fa-solid fa-file-lines"></i> ${escapeHtml(c.source)}
                        </button>
                    `).join("")}
                </div>
            `;
        }

        row.innerHTML = `
            <div class="msg-avatar bot"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-bubble-container">
                ${thoughtsHtml}
                <div class="msg-bubble">${renderMarkdown(data.response || "")}</div>
                ${citationsHtml}
            </div>
        `;
        chatMessages.appendChild(row);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Export Chat History
    if (btnExportChat) {
        btnExportChat.addEventListener("click", () => {
            const blob = new Blob([JSON.stringify(state.chatHistory, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chat-transcript-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // 4. Knowledge Base Operations
    async function loadKnowledgeBase() {
        try {
            const [statsRes, chunksRes] = await Promise.all([
                fetch("/api/kb/stats"),
                fetch("/api/kb/chunks")
            ]);

            const stats = await statsRes.json();
            const chunks = await chunksRes.json();

            state.stats = stats;
            state.chunks = chunks;

            if (sidebarChunkBadge) sidebarChunkBadge.textContent = `${stats.total_chunks} Chunks`;
            if (kbTotalChunksBadge) kbTotalChunksBadge.textContent = `${stats.total_chunks} Chunks`;

            renderChunksList(chunks);
        } catch (err) {
            console.error("Failed to load KB:", err);
        }
    }

    function renderChunksList(chunks) {
        if (!chunks || chunks.length === 0) {
            chunksContainer.innerHTML = `<div class="empty-state-box"><p>No chunks in vector store.</p></div>`;
            return;
        }

        chunksContainer.innerHTML = chunks.map((c, idx) => `
            <div class="chunk-card-item">
                <div class="chunk-top-row">
                    <span class="chunk-title"><i class="fa-solid fa-file-lines"></i> ${escapeHtml(c.metadata.source || 'Doc')}</span>
                    <span class="chunk-category-tag">${escapeHtml(c.metadata.category || 'General')} • Chunk #${c.metadata.chunk_index || idx+1}</span>
                </div>
                <div class="chunk-text-snippet">
                    ${escapeHtml(c.text)}
                </div>
                <div style="margin-top: 8px; font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">
                    Tokens: ~${c.token_estimate || 80} | Chunk ID: <code>${c.chunk_id}</code>
                </div>
            </div>
        `).join("");
    }

    if (chunksFilterInput) {
        chunksFilterInput.addEventListener("input", (e) => {
            const val = e.target.value.toLowerCase().trim();
            if (!val) {
                renderChunksList(state.chunks);
                return;
            }
            const filtered = state.chunks.filter(c => 
                (c.metadata.source && c.metadata.source.toLowerCase().includes(val)) ||
                (c.text && c.text.toLowerCase().includes(val)) ||
                (c.metadata.category && c.metadata.category.toLowerCase().includes(val))
            );
            renderChunksList(filtered);
        });
    }

    // Dropzone & File Upload
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.style.borderColor = "var(--cyan)"; });
    dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = "rgba(6, 182, 212, 0.4)"; });
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "rgba(6, 182, 212, 0.4)";
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelection();
        }
    });

    fileInput.addEventListener("change", handleFileSelection);

    function handleFileSelection() {
        if (fileInput.files.length > 0) {
            dropzone.querySelector(".dropzone-subtitle").innerHTML = `Selected: <strong>${escapeHtml(fileInput.files[0].name)}</strong>`;
        }
    }

    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!fileInput.files.length) {
            alert("Please select a file (PDF, TXT, MD) to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("category", docCategory.value);

        const btnUpload = document.getElementById("btn-upload");
        btnUpload.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Ingesting & Chunking...`;
        btnUpload.disabled = true;

        try {
            const resp = await fetch("/api/kb/upload", {
                method: "POST",
                body: formData
            });
            const data = await resp.json();
            if (resp.ok) {
                alert(`Success! Created ${data.chunks_created} vector chunks from '${data.filename}'.`);
                fileInput.value = "";
                dropzone.querySelector(".dropzone-subtitle").innerHTML = `Drag and drop your <strong>PDF</strong>, <strong>MD</strong>, or <strong>TXT</strong> file here`;
                loadKnowledgeBase();
            } else {
                alert(`Upload failed: ${data.detail}`);
            }
        } catch (err) {
            alert("Network error while uploading file.");
        } finally {
            btnUpload.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>Chunk & Embed into Vector DB</span>`;
            btnUpload.disabled = false;
        }
    });

    // Reset Knowledge Base
    btnQuickReset.addEventListener("click", async () => {
        if (confirm("Reset knowledge base to default sample enterprise policies?")) {
            await fetch("/api/kb/reset", { method: "POST" });
            loadKnowledgeBase();
            alert("Knowledge base reset completed.");
        }
    });

    // 5. Vector Search Sandbox
    btnSandboxSearch.addEventListener("click", async () => {
        const query = sandboxQuery.value.trim();
        if (!query) return;

        sandboxResults.innerHTML = `<div class="empty-state-box"><i class="fa-solid fa-circle-notch fa-spin empty-icon"></i><p>Calculating high-dimensional cosine similarity...</p></div>`;

        try {
            const resp = await fetch("/api/kb/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query, top_k: 4 })
            });
            const data = await resp.json();

            if (data.results.length === 0) {
                sandboxResults.innerHTML = `<div class="empty-state-box"><p>No relevant vector matches found above threshold.</p></div>`;
                return;
            }

            sandboxResults.innerHTML = data.results.map((r, idx) => {
                const relevancePct = r.relevance_pct || (r.score ? (r.score * 100).toFixed(1) : 88.5);
                const tier = r.relevance_tier || (relevancePct >= 85 ? "High Relevance" : (relevancePct >= 72 ? "Moderate Relevance" : "Fair Relevance"));
                const tierClass = relevancePct >= 85 ? "score-high" : (relevancePct >= 72 ? "score-mid" : "score-low");
                const icon = relevancePct >= 85 ? "fa-circle-check" : "fa-circle-info";

                return `
                    <div class="result-card">
                        <div class="result-card-top">
                            <div>
                                <strong>#${idx+1} ${escapeHtml(r.metadata.source || 'Policy Document')}</strong>
                                <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 8px;">Category: ${escapeHtml(r.metadata.category || 'General')}</span>
                            </div>
                            <div class="score-badge ${tierClass}">
                                <i class="fa-solid ${icon}"></i> ${tier} (${relevancePct}% Match)
                            </div>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${escapeHtml(r.text)}</p>
                        <div class="score-meter">
                            <div class="score-meter-fill ${tierClass}" style="width: ${Math.min(100, relevancePct)}%;"></div>
                        </div>
                    </div>
                `;
            }).join("");
        } catch (err) {
            sandboxResults.innerHTML = `<div class="empty-state-box"><p>Failed to execute search query.</p></div>`;
        }
    });

    // 6. Tools & Live DB Tab
    async function loadToolsData() {
        try {
            const resp = await fetch("/api/tools/orders");
            const orders = await resp.json();

            ordersContainer.innerHTML = Object.values(orders).map(o => `
                <div class="order-entry-card">
                    <div class="flex-between">
                        <strong>${o.order_id} • ${escapeHtml(o.customer_name)}</strong>
                        <span class="count-badge">${o.tier}</span>
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 8px;">
                        <div><strong>Item:</strong> ${escapeHtml(o.product)} ($${o.amount_usd})</div>
                        <div><strong>Status:</strong> <span class="text-emerald">${o.status}</span> | <strong>Carrier:</strong> ${o.carrier} (<code>${o.tracking_code}</code>)</div>
                        <div><strong>Warranty:</strong> ${o.warranty_type}</div>
                    </div>
                </div>
            `).join("");
        } catch (err) {
            console.error("Failed to load tools data:", err);
        }
    }

    toolSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "lookup_order") {
            toolParamContainer.innerHTML = `<label class="form-label">Order ID:</label><input type="text" id="tool-param-input" class="custom-input" value="ORD-9821">`;
        } else if (val === "calculate_refund") {
            toolParamContainer.innerHTML = `<label class="form-label">Order ID:</label><input type="text" id="tool-param-input" class="custom-input" value="ORD-9821">`;
        } else if (val === "check_warranty") {
            toolParamContainer.innerHTML = `<label class="form-label">Serial Number:</label><input type="text" id="tool-param-input" class="custom-input" value="SN-QT8892">`;
        } else if (val === "escalate_ticket") {
            toolParamContainer.innerHTML = `<label class="form-label">Customer Email:</label><input type="text" id="tool-param-input" class="custom-input" value="bishtkartik2005@gmail.com">`;
        }
    });

    btnRunTool.addEventListener("click", async () => {
        const toolName = toolSelect.value;
        const paramInput = document.getElementById("tool-param-input");
        const paramVal = paramInput ? paramInput.value.trim() : "";

        let args = {};
        if (toolName === "lookup_order" || toolName === "calculate_refund") {
            args = { order_id: paramVal, reason: "Manual UI Test" };
        } else if (toolName === "check_warranty") {
            args = { serial_number: paramVal };
        } else if (toolName === "escalate_ticket") {
            args = { customer_email: paramVal, issue_summary: "Critical assistance needed", severity: "Critical" };
        }

        toolOutput.querySelector("pre").textContent = "Executing tool...";

        try {
            const resp = await fetch("/api/tools/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: toolName, arguments: args })
            });
            const data = await resp.json();
            toolOutput.querySelector("pre").textContent = JSON.stringify(data, null, 2);
        } catch (err) {
            toolOutput.querySelector("pre").textContent = "Error executing tool.";
        }
    });

    // 7. Modal Citation Viewer
    window.showCitationModal = (source, category, score) => {
        modalTitle.textContent = source;
        modalMeta.innerHTML = `<span class="count-badge">${category}</span> <span style="color: var(--emerald); font-size: 0.82rem; margin-left: 8px; font-weight: 700;">Relevance Score: ${(score*100).toFixed(0)}% Match</span>`;
        
        const matching = state.chunks.filter(c => c.metadata.source === source);
        if (matching.length > 0) {
            modalContent.innerHTML = matching.map(m => `<div style="margin-bottom: 14px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px;">${escapeHtml(m.text)}</div>`).join("");
        } else {
            modalContent.innerHTML = `<p>Referenced directly from pre-indexed policy knowledge base.</p>`;
        }
        citationModal.style.display = "flex";
    };

    btnCloseModal.addEventListener("click", () => {
        citationModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === citationModal) citationModal.style.display = "none";
    });

    // Utilities
    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function renderMarkdown(md) {
        if (!md) return "";
        let html = escapeHtml(md);
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); color: var(--color-green);">$1</code>');
        // Headers
        html = html.replace(/### (.*?)\n/g, '<h4 style="margin: 12px 0 8px; color: var(--color-yellow); font-size: 0.95rem; font-weight: 800;">$1</h4>');
        // Bullet points
        html = html.replace(/^\s*-\s+(.*?)$/gm, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>');
        // Blockquotes
        html = html.replace(/^&gt; (.*?)$/gm, '<blockquote style="border-left: 3px solid var(--color-green); padding-left: 12px; margin: 10px 0; color: var(--text-secondary); font-style: italic; background: var(--color-green-bg); padding: 8px 12px; border-radius: 0 6px 6px 0;">$1</blockquote>');
        // Linebreaks
        html = html.replace(/\n\n/g, '<br><br>');
        return html;
    }

    init();
});
