document.addEventListener("DOMContentLoaded", () => {
    // App State
    const state = {
        activeTab: "chat-tab",
        llmProvider: localStorage.getItem("rag_provider") || "local",
        apiKey: localStorage.getItem("rag_api_key") || "",
        systemPrompt: localStorage.getItem("rag_sys_prompt") || "You are an Autonomous AI Customer Support Agent with RAG. You provide accurate, factual assistance grounded strictly in company policies.",
        userEmail: "bishtkartik2005@gmail.com",
        chunks: [],
        stats: null
    };

    // DOM Elements
    const navItems = document.querySelectorAll(".nav-item");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");
    const chipBtns = document.querySelectorAll(".chip-btn");
    const chunksContainer = document.getElementById("chunks-container");
    const sidebarChunkCount = document.getElementById("sidebar-chunk-count");
    const topbarDocCount = document.getElementById("topbar-doc-count");
    const kbTotalChunks = document.getElementById("kb-total-chunks");
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("file-input");
    const dropzone = document.getElementById("dropzone");
    const docCategory = document.getElementById("doc-category");
    const btnQuickReset = document.getElementById("btn-quick-reset");
    const activeModelTag = document.getElementById("active-model-tag");

    // Sandbox Elements
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

    // Modal
    const citationModal = document.getElementById("citation-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMeta = document.getElementById("modal-meta");
    const modalContent = document.getElementById("modal-content");
    const btnCloseModal = document.getElementById("btn-close-modal");

    // 1. Tab Navigation
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-tab");
            navItems.forEach(n => n.classList.remove("active"));
            tabPanes.forEach(p => p.classList.remove("active"));

            item.classList.add("active");
            document.getElementById(target).classList.add("active");
            state.activeTab = target;

            if (target === "kb-tab") loadKnowledgeBase();
            if (target === "tools-tab") loadToolsData();
        });
    });

    // 2. Initial Setup & Welcome Message
    function init() {
        llmProviderSelect.value = state.llmProvider;
        apiKeyInput.value = state.apiKey;
        systemPromptInput.value = state.systemPrompt;
        updateProviderUI();

        appendBotMessage({
            response: `👋 **Welcome to the Autonomous AI Support Agent with RAG!**\n\nI am connected to your enterprise knowledge base and real-time order/billing systems. I can help you with:\n- 📦 **Order & Shipment Tracking** (e.g. \`ORD-9821\`, \`ORD-4412\`)\n- 💰 **Automated Refund & Return Evaluations**\n- 🛡️ **Hardware Warranty Verification** (e.g. \`SN-QT8892\`)\n- 🚨 **Autonomous Escalation & Ticket Creation**\n\nSelect one of the suggested prompts below or type any question to begin!`,
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
            activeModelTag.textContent = "Provider: Local Grounded Engine";
        } else if (state.llmProvider === "gemini") {
            apiKeyGroup.style.display = "block";
            activeModelTag.textContent = "Provider: Google Gemini 2.0";
        } else if (state.llmProvider === "openai") {
            apiKeyGroup.style.display = "block";
            activeModelTag.textContent = "Provider: OpenAI GPT-4o";
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
    chipBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            userInput.value = btn.getAttribute("data-query");
            chatForm.dispatchEvent(new Event("submit"));
        });
    });

    function appendUserMessage(text) {
        const row = document.createElement("div");
        row.className = "message-row user-row";
        row.innerHTML = `
            <div class="message-bubble-wrapper">
                <div class="message-bubble">${escapeHtml(text)}</div>
            </div>
            <div class="avatar user"><i class="fa-solid fa-user"></i></div>
        `;
        chatMessages.appendChild(row);
        scrollToBottom();
    }

    function appendLoadingIndicator() {
        const id = "loading-" + Date.now();
        const row = document.createElement("div");
        row.className = "message-row bot-row";
        row.id = id;
        row.innerHTML = `
            <div class="avatar bot"><i class="fa-solid fa-robot"></i></div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--primary);">
                        <i class="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Autonomous Agent Orchestrating RAG Pipeline...</span>
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
        row.className = "message-row bot-row";

        let thoughtsHtml = "";
        if (data.thought_steps && data.thought_steps.length > 0) {
            thoughtsHtml = `
                <div class="thought-box">
                    <div class="thought-header" onclick="this.parentElement.querySelector('.thought-content').classList.toggle('hidden')">
                        <span><i class="fa-solid fa-brain"></i> Agentic Thought Trace (${data.thought_steps.length} Steps) • ${data.execution_time_seconds ? data.execution_time_seconds + 's' : '0.04s'}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="thought-content">
                        ${data.thought_steps.map(s => `
                            <div class="thought-step-item">
                                <i class="fa-solid fa-check-circle"></i>
                                <div><strong>${s.title}:</strong> ${s.description}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        let citationsHtml = "";
        if (data.citations && data.citations.length > 0) {
            citationsHtml = `
                <div class="citations-bar">
                    <span style="font-size: 0.72rem; color: var(--text-dim); margin-right: 4px;"><i class="fa-solid fa-bookmark"></i> Sources:</span>
                    ${data.citations.map(c => `
                        <button class="citation-chip" onclick="showCitationModal('${escapeHtml(c.source)}', '${c.category || 'Policy'}', ${c.score || 0.95})">
                            <i class="fa-solid fa-file-lines"></i> ${escapeHtml(c.source)}
                        </button>
                    `).join("")}
                </div>
            `;
        }

        row.innerHTML = `
            <div class="avatar bot"><i class="fa-solid fa-robot"></i></div>
            <div class="message-bubble-wrapper">
                ${thoughtsHtml}
                <div class="message-bubble">${renderMarkdown(data.response || "")}</div>
                ${citationsHtml}
            </div>
        `;
        chatMessages.appendChild(row);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
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

            sidebarChunkCount.textContent = stats.total_chunks;
            topbarDocCount.textContent = `${stats.total_sources} Policy Docs`;
            kbTotalChunks.textContent = `${stats.total_chunks} Chunks`;

            renderChunksList(chunks);
        } catch (err) {
            console.error("Failed to load KB:", err);
        }
    }

    function renderChunksList(chunks) {
        if (!chunks || chunks.length === 0) {
            chunksContainer.innerHTML = `<div class="empty-state"><p>No chunks found in Vector Store.</p></div>`;
            return;
        }

        chunksContainer.innerHTML = chunks.map((c, idx) => `
            <div class="chunk-card">
                <div class="chunk-header">
                    <span class="chunk-source"><i class="fa-solid fa-file"></i> ${escapeHtml(c.metadata.source || 'Doc')}</span>
                    <span class="chunk-badge">${escapeHtml(c.metadata.category || 'General')} • Chunk #${c.metadata.chunk_index || idx+1}</span>
                </div>
                <div class="chunk-body">
                    ${escapeHtml(c.text)}
                </div>
                <div style="margin-top: 8px; font-size: 0.7rem; color: var(--text-dim);">
                    Est. Tokens: ${c.token_estimate || 80} | Chunk ID: <code>${c.chunk_id}</code>
                </div>
            </div>
        `).join("");
    }

    // Dropzone & File Upload
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.style.borderColor = "var(--primary)"; });
    dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = "rgba(6, 182, 212, 0.35)"; });
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "rgba(6, 182, 212, 0.35)";
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelection();
        }
    });

    fileInput.addEventListener("change", handleFileSelection);

    function handleFileSelection() {
        if (fileInput.files.length > 0) {
            dropzone.querySelector(".dropzone-text").innerHTML = `Selected: <strong>${escapeHtml(fileInput.files[0].name)}</strong>`;
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
        btnUpload.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing & Chunking...`;
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
                dropzone.querySelector(".dropzone-text").innerHTML = `Drag & drop your <strong>PDF</strong>, <strong>Markdown</strong>, or <strong>Text</strong> document`;
                loadKnowledgeBase();
            } else {
                alert(`Upload failed: ${data.detail}`);
            }
        } catch (err) {
            alert("Network error while uploading file.");
        } finally {
            btnUpload.innerHTML = `<i class="fa-solid fa-upload"></i> Process & Index Chunks`;
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

        sandboxResults.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Calculating vector cosine similarities...</p></div>`;

        try {
            const resp = await fetch("/api/kb/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query, top_k: 4 })
            });
            const data = await resp.json();

            if (data.results.length === 0) {
                sandboxResults.innerHTML = `<div class="empty-state"><p>No relevant vector matches found above threshold.</p></div>`;
                return;
            }

            sandboxResults.innerHTML = data.results.map((r, idx) => `
                <div class="search-result-card">
                    <div class="search-result-top">
                        <div>
                            <strong>#${idx+1} ${escapeHtml(r.metadata.source || 'Policy')}</strong>
                            <span style="font-size: 0.75rem; color: var(--text-dim); margin-left: 8px;">Category: ${escapeHtml(r.metadata.category || 'General')}</span>
                        </div>
                        <div class="score-badge">Cosine Score: ${(r.score * 100).toFixed(1)}%</div>
                    </div>
                    <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.5;">${escapeHtml(r.text)}</p>
                    <div class="score-meter">
                        <div class="score-meter-fill" style="width: ${Math.min(100, r.score * 100)}%;"></div>
                    </div>
                </div>
            `).join("");
        } catch (err) {
            sandboxResults.innerHTML = `<div class="empty-state"><p>Failed to execute search query.</p></div>`;
        }
    });

    // 6. Tools & Live DB Tab
    async function loadToolsData() {
        try {
            const resp = await fetch("/api/tools/orders");
            const orders = await resp.json();

            ordersContainer.innerHTML = Object.values(orders).map(o => `
                <div class="order-row-card">
                    <div class="flex-between">
                        <strong>${o.order_id} • ${escapeHtml(o.customer_name)}</strong>
                        <span class="chunk-badge">${o.tier}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">
                        <div><strong>Item:</strong> ${escapeHtml(o.product)} ($${o.amount_usd})</div>
                        <div><strong>Status:</strong> ${o.status} | <strong>Carrier:</strong> ${o.carrier} (${o.tracking_code})</div>
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
            toolParamContainer.innerHTML = `<label>Order ID:</label><input type="text" id="tool-param-input" class="form-input" value="ORD-9821">`;
        } else if (val === "calculate_refund") {
            toolParamContainer.innerHTML = `<label>Order ID:</label><input type="text" id="tool-param-input" class="form-input" value="ORD-9821">`;
        } else if (val === "check_warranty") {
            toolParamContainer.innerHTML = `<label>Serial Number:</label><input type="text" id="tool-param-input" class="form-input" value="SN-QT8892">`;
        } else if (val === "escalate_ticket") {
            toolParamContainer.innerHTML = `<label>Customer Email:</label><input type="text" id="tool-param-input" class="form-input" value="bishtkartik2005@gmail.com">`;
        }
    });

    btnRunTool.addEventListener("click", async () => {
        const toolName = toolSelect.value;
        const paramVal = document.getElementById("tool-param-input").value.trim();

        let args = {};
        if (toolName === "lookup_order" || toolName === "calculate_refund") {
            args = { order_id: paramVal, reason: "Manual UI Test" };
        } else if (toolName === "check_warranty") {
            args = { serial_number: paramVal };
        } else if (toolName === "escalate_ticket") {
            args = { customer_email: paramVal, issue_summary: "Critical assistance needed", severity: "Critical" };
        }

        toolOutput.innerHTML = `<pre>Executing tool...</pre>`;

        try {
            const resp = await fetch("/api/tools/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tool_name: toolName, arguments: args })
            });
            const data = await resp.json();
            toolOutput.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        } catch (err) {
            toolOutput.innerHTML = `<pre>Error executing tool.</pre>`;
        }
    });

    // 7. Modal Citation Viewer
    window.showCitationModal = (source, category, score) => {
        modalTitle.textContent = source;
        modalMeta.innerHTML = `<span class="chunk-badge">${category}</span> <span style="color: var(--accent-emerald); font-size: 0.8rem; margin-left: 8px;">Relevance: ${(score*100).toFixed(0)}%</span>`;
        
        // Find matching chunks in state
        const matching = state.chunks.filter(c => c.metadata.source === source);
        if (matching.length > 0) {
            modalContent.innerHTML = matching.map(m => `<div style="margin-bottom: 14px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px;">${escapeHtml(m.text)}</div>`).join("");
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
        html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 4px; font-family: monospace;">$1</code>');
        // Headers
        html = html.replace(/### (.*?)\n/g, '<h4 style="margin: 10px 0 6px; color: var(--primary); font-size: 0.95rem;">$1</h4>');
        // Bullet points
        html = html.replace(/^\s*-\s+(.*?)$/gm, '<li style="margin-left: 20px;">$1</li>');
        // Blockquotes
        html = html.replace(/^&gt; (.*?)$/gm, '<blockquote style="border-left: 3px solid var(--primary); padding-left: 10px; margin: 8px 0; color: var(--text-dim); font-style: italic;">$1</blockquote>');
        // Linebreaks
        html = html.replace(/\n\n/g, '<br><br>');
        return html;
    }

    init();
});
