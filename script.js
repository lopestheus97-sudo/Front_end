/**
 * Ferramentas WEB - Lógica da SPA, Consumo de API REST Flask e API Externa ViaCEP
 * Atende aos critérios do MVP (Componentização e Serviços Autônomos - Cenário 1)
 */

// Configuração do endpoint da API Back-End (Flask)
const API_BASE_URL = 'http://localhost:5000/api';

// Estado global da aplicação
let allProducts = [];
let activeCategory = 'TODAS';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initApiStatusCheck();
    loadCategories();
    loadProducts();
    initProductForm();
    initEditModal();
    initSearchAndFilters();
    initFreteViaCep();
});

/* ==========================================================================
   1. NAVEGAÇÃO SPA (Single Page Application)
   ========================================================================== */
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    // Troca de seções sem recarregar a página
    window.navigateToSection = function (targetId) {
        document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (navMenu && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            navigateToSection(targetId);
        });
    });

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }
}

/* ==========================================================================
   2. VERIFICAÇÃO DE STATUS DA API (Health Check)
   ========================================================================== */
async function initApiStatusCheck() {
    const statusBadge = document.getElementById('apiStatusBadge');
    if (!statusBadge) return;

    try {
        const response = await fetch(`${API_BASE_URL}/produtos`, { method: 'GET' });
        if (response.ok) {
            statusBadge.className = 'api-status-badge online';
            statusBadge.innerHTML = `<span class="status-dot"></span><span class="status-text">API Conectada (5000)</span>`;
        } else {
            throw new Error('API respondeu com erro');
        }
    } catch (err) {
        statusBadge.className = 'api-status-badge offline';
        statusBadge.innerHTML = `<span class="status-dot"></span><span class="status-text">API Desconectada</span>`;
    }
}

/* ==========================================================================
   3. ROTA GET 1: Listar Categorias (/api/categorias)
   ========================================================================== */
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`);
        if (!response.ok) return;
        const categorias = await response.json();

        // Atualiza os selects de formulário se houver novas categorias
        const prodCategorySelect = document.getElementById('prodCategory');
        const editCategorySelect = document.getElementById('editProdCategory');

        if (categorias && categorias.length > 0) {
            const optionsHtml = categorias.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            if (prodCategorySelect) {
                prodCategorySelect.innerHTML = `<option value="" disabled selected>Selecione uma categoria...</option>` + optionsHtml;
            }
            if (editCategorySelect) {
                editCategorySelect.innerHTML = optionsHtml;
            }
        }
    } catch (error) {
        console.warn('Categorias locais em uso (API backend ainda não iniciada ou sem conexão).');
    }
}

/* ==========================================================================
   4. ROTA GET 2: Listar Produtos (GET /api/produtos)
   ========================================================================== */
async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando ferramentas do banco de dados (GET /api/produtos)...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        allProducts = await response.json();
        renderProducts(allProducts);
        initApiStatusCheck();
    } catch (error) {
        grid.innerHTML = `
            <div class="loading-state" style="border: 2px dashed #ff6b6b;">
                <h3 style="color: #e74c3c; margin-bottom: 10px;">⚠️ Falha na comunicação com o Back-End</h3>
                <p style="color: #666; margin-bottom: 15px;">Não foi possível carregar os produtos de <code>${API_BASE_URL}/produtos</code>.</p>
                <p style="font-size: 0.9rem; color: #888;">Certifique-se de que a API Flask está em execução (porta 5000) e o CORS está habilitado.</p>
                <button class="btn-primary" style="margin-top: 15px;" onclick="loadProducts()">Tentar Novamente</button>
            </div>
        `;
        showToast('Não foi possível conectar à API de produtos.', 'error');
    }
}

// Renderiza a lista de produtos no DOM
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered = activeCategory === 'TODAS'
        ? products
        : products.filter(p => p.category === activeCategory);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p>Nenhuma ferramenta encontrada para a categoria ou termo pesquisado.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(prod => {
        const imageSrc = getProductImage(prod.name, prod.category);
        const precoFormatado = Number(prod.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const dataFormatada = prod.created_at ? new Date(prod.created_at).toLocaleDateString('pt-BR') : '';

        return `
            <div class="product-card" id="product-${prod.id}">
                <div class="product-image-container">
                    <img src="${imageSrc}" alt="${escapeHtml(prod.name)}" class="product-image" onerror="this.src='imagens/furadeira.png'">
                </div>
                <div class="product-info">
                    <span class="product-category">${escapeHtml(prod.category)}</span>
                    <h3 class="product-name">${escapeHtml(prod.name)}</h3>
                    <p class="product-desc">${escapeHtml(prod.description || 'Sem descrição cadastrada.')}</p>
                    ${dataFormatada ? `<div class="product-meta-date">Cadastrado em: ${dataFormatada}</div>` : ''}
                    <div class="product-bottom">
                        <span class="product-price">${precoFormatado}</span>
                        <div class="product-card-buttons">
                            <button class="btn-action edit-btn" onclick="openEditModal(${prod.id})" title="Editar Produto (PUT)">✏️</button>
                            <button class="btn-action delete-btn" onclick="confirmDeleteProduct(${prod.id}, '${escapeHtml(prod.name)}')" title="Remover Produto (DELETE)">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Associação visual de imagens por nome / categoria
function getProductImage(name, category) {
    const n = (name || '').toLowerCase();
    if (n.includes('furadeira') || n.includes('impacto')) return 'imagens/furadeira.png';
    if (n.includes('chave') || n.includes('allen') || n.includes('fenda')) return 'imagens/chave.png';
    if (n.includes('capacete') || n.includes('segurança') || n.includes('epi')) return 'imagens/capacete.png';
    if (n.includes('serra') || n.includes('esmerilhadeira') || n.includes('disco')) return 'imagens/serra-circular.png';
    return 'imagens/chave.png';
}

/* ==========================================================================
   5. ROTA GET 3: Busca Textual de Produtos (GET /api/produtos/busca)
   ========================================================================== */
function initSearchAndFilters() {
    const searchInput = document.getElementById('searchProduct');
    const btnSearch = document.getElementById('btnSearch');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const btnReload = document.getElementById('btnReloadProducts');
    const chips = document.querySelectorAll('.chip');

    async function executeSearch() {
        const termo = searchInput.value.trim();
        if (!termo) {
            loadProducts();
            return;
        }

        const grid = document.getElementById('productsGrid');
        grid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Buscando por "${escapeHtml(termo)}" na API...</p>
            </div>
        `;

        try {
            const response = await fetch(`${API_BASE_URL}/produtos/busca?nome=${encodeURIComponent(termo)}`);
            if (!response.ok) throw new Error('Falha ao buscar produtos');
            const resultados = await response.json();
            renderProducts(resultados);
            showToast(`Busca concluída: ${resultados.length} produto(s) encontrado(s).`, 'info');
        } catch (error) {
            showToast('Erro ao realizar busca de produtos.', 'error');
            loadProducts();
        }
    }

    if (btnSearch) btnSearch.addEventListener('click', executeSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearch();
            }
        });
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            searchInput.value = '';
            loadProducts();
        });
    }

    if (btnReload) {
        btnReload.addEventListener('click', () => {
            loadProducts();
            showToast('Lista de ferramentas atualizada com sucesso!', 'info');
        });
    }

    // Filtro por categoria (Chips)
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.getAttribute('data-category');
            renderProducts(allProducts);
        });
    });

    window.filterByCategory = function (cat) {
        navigateToSection('produtos');
        activeCategory = cat;
        chips.forEach(c => {
            if (c.getAttribute('data-category') === cat) c.classList.add('active');
            else c.classList.remove('active');
        });
        renderProducts(allProducts);
    };
}

/* ==========================================================================
   6. ROTA POST: Cadastrar Novo Produto (POST /api/produtos)
   ========================================================================== */
function initProductForm() {
    const productForm = document.getElementById('productForm');
    if (!productForm) return;

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('prodName').value.trim();
        const price = parseFloat(document.getElementById('prodPrice').value);
        const category = document.getElementById('prodCategory').value;
        const description = document.getElementById('prodDesc').value.trim();

        if (!name || isNaN(price) || price < 0 || !category) {
            showToast('Preencha os campos obrigatórios com valores válidos.', 'error');
            return;
        }

        const payload = {
            name: name,
            price: price,
            category: category,
            description: description
        };

        const submitBtn = document.getElementById('btnAddProduct');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Gravando na API (POST)...';

        try {
            const response = await fetch(`${API_BASE_URL}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const erroData = await response.json();
                throw new Error(erroData.erro || 'Erro ao cadastrar produto');
            }

            const novoProduto = await response.json();
            showToast(`Produto "${novoProduto.name}" cadastrado com sucesso! (POST 201)`, 'success');
            productForm.reset();

            // Recarrega a lista e leva o usuário para a tela de produtos
            await loadProducts();
            setTimeout(() => {
                navigateToSection('produtos');
            }, 600);

        } catch (error) {
            showToast(`Falha ao cadastrar: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Cadastrar Ferramenta na API (POST)';
        }
    });
}

/* ==========================================================================
   7. ROTA PUT: Atualizar Produto Existente (PUT /api/produtos/:id)
   ========================================================================== */
function initEditModal() {
    const modal = document.getElementById('editModal');
    const editForm = document.getElementById('editProductForm');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    window.openEditModal = function (id) {
        const prod = allProducts.find(p => p.id === id);
        if (!prod) {
            showToast('Produto não encontrado para edição.', 'error');
            return;
        }

        document.getElementById('editProdId').value = prod.id;
        document.getElementById('editProdName').value = prod.name;
        document.getElementById('editProdPrice').value = prod.price;
        document.getElementById('editProdCategory').value = prod.category;
        document.getElementById('editProdDesc').value = prod.description || '';

        modal.classList.remove('hidden');
    };

    function closeModal() {
        modal.classList.add('hidden');
    }

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('editProdId').value;
            const name = document.getElementById('editProdName').value.trim();
            const price = parseFloat(document.getElementById('editProdPrice').value);
            const category = document.getElementById('editProdCategory').value;
            const description = document.getElementById('editProdDesc').value.trim();

            if (!name || isNaN(price) || price < 0 || !category) {
                showToast('Preencha os campos obrigatórios corretamente.', 'error');
                return;
            }

            const payload = {
                name: name,
                price: price,
                category: category,
                description: description
            };

            const saveBtn = document.getElementById('btnSaveEdit');
            saveBtn.disabled = true;
            saveBtn.innerText = 'Atualizando via PUT...';

            try {
                const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const erroData = await response.json();
                    throw new Error(erroData.erro || 'Falha ao atualizar produto');
                }

                const atualizado = await response.json();
                showToast(`Produto #${atualizado.id} atualizado com sucesso! (PUT 200)`, 'success');
                closeModal();
                loadProducts();
            } catch (error) {
                showToast(`Erro na atualização: ${error.message}`, 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Salvar Alterações (PUT /api/produtos/:id)';
            }
        });
    }
}

/* ==========================================================================
   8. ROTA DELETE: Remover Produto (DELETE /api/produtos/:id)
   ========================================================================== */
window.confirmDeleteProduct = async function (id, name) {
    const confirmacao = window.confirm(`Atenção: Tem certeza de que deseja remover a ferramenta "${name}" (ID: ${id})?\n\nEssa ação executará o método DELETE na API.`);
    if (!confirmacao) return;

    try {
        const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const erroData = await response.json();
            throw new Error(erroData.erro || 'Falha ao remover produto');
        }

        showToast(`Ferramenta "${name}" removida com sucesso! (DELETE 200)`, 'success');
        loadProducts();
    } catch (error) {
        showToast(`Erro ao deletar: ${error.message}`, 'error');
    }
};

/* ==========================================================================
   9. API EXTERNA: Cálculo de Frete e Consulta de Endereço (ViaCEP)
   ========================================================================== */
function initFreteViaCep() {
    const freteForm = document.getElementById('freteForm');
    const cepInput = document.getElementById('cepInput');
    const freteResult = document.getElementById('freteResult');
    const btnExemploCep = document.getElementById('btnExemploCep');

    // Máscara automática de CEP (00000-000)
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 5) {
                val = val.substring(0, 5) + '-' + val.substring(5, 8);
            }
            e.target.value = val;
        });
    }

    if (btnExemploCep) {
        btnExemploCep.addEventListener('click', () => {
            cepInput.value = '01001-000'; // Praça da Sé, Centro, São Paulo/SP
            consultarCep('01001000');
        });
    }

    if (freteForm) {
        freteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cepLimpo = cepInput.value.replace(/\D/g, '');
            consultarCep(cepLimpo);
        });
    }

    async function consultarCep(cep) {
        if (!cep || cep.length !== 8) {
            showToast('Informe um CEP válido com 8 dígitos.', 'error');
            return;
        }

        const btnConsultar = document.getElementById('btnConsultarCep');
        btnConsultar.disabled = true;
        btnConsultar.innerText = 'Consultando ViaCEP...';

        freteResult.classList.remove('hidden');
        freteResult.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Consultando serviço externo ViaCEP (GET /ws/${cep}/json/)...</p>
            </div>
        `;

        try {
            // Chamada direta à API pública do ViaCEP
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('Não foi possível consultar o ViaCEP.');

            const data = await response.json();

            if (data.erro) {
                freteResult.innerHTML = `
                    <div class="frete-address-box" style="border-left-color: #e74c3c;">
                        <h4 style="color: #e74c3c;">❌ CEP não localizado</h4>
                        <p>O CEP informado não foi encontrado na base de dados nacional dos Correios/ViaCEP.</p>
                    </div>
                `;
                showToast('CEP não encontrado.', 'error');
                return;
            }

            // Simulação de frete e prazos por região brasileira baseada no estado (UF)
            const simulacaoFrete = calcularPrazosEFrete(data.uf);

            freteResult.innerHTML = `
                <div class="frete-address-box">
                    <h4>📍 Destino da Entrega Confirmado</h4>
                    <p><strong>Logradouro:</strong> ${data.logradouro || 'Centro / Área Central'}</p>
                    <p><strong>Bairro:</strong> ${data.bairro || 'Centro'}</p>
                    <p><strong>Cidade/UF:</strong> ${data.localidade} - ${data.uf} (DDD: ${data.ddd || 'N/D'})</p>
                    <p><strong>CEP:</strong> ${data.cep}</p>
                </div>

                <h4 style="margin-bottom: 10px; color: var(--color-dark);">Modalidades de Envio Disponíveis:</h4>
                <div class="shipping-options-grid">
                    <div class="shipping-option-card ${simulacaoFrete.gratis ? 'featured' : ''}">
                        <div class="shipping-option-header">
                            <strong>📦 Envio Econômico (PAC)</strong>
                            <span class="shipping-badge eco">${simulacaoFrete.prazoEco}</span>
                        </div>
                        <div class="shipping-price">${simulacaoFrete.precoEco}</div>
                        <div class="shipping-deadline">Entrega padrão com rastreamento</div>
                    </div>

                    <div class="shipping-option-card">
                        <div class="shipping-option-header">
                            <strong>⚡ Envio Expresso (Sedex)</strong>
                            <span class="shipping-badge fast">${simulacaoFrete.prazoFast}</span>
                        </div>
                        <div class="shipping-price">${simulacaoFrete.precoFast}</div>
                        <div class="shipping-deadline">Entrega prioritária expressa</div>
                    </div>
                </div>
            `;

            showToast(`Endereço localizado: ${data.localidade}/${data.uf}`, 'success');

        } catch (error) {
            freteResult.innerHTML = `
                <div class="frete-address-box" style="border-left-color: #e74c3c;">
                    <h4 style="color: #e74c3c;">Erro na consulta</h4>
                    <p>Falha ao se comunicar com o serviço ViaCEP: ${error.message}</p>
                </div>
            `;
            showToast('Erro ao consultar o ViaCEP.', 'error');
        } finally {
            btnConsultar.disabled = false;
            btnConsultar.innerText = 'Calcular Frete';
        }
    }
}

// Lógica de cálculo regional de frete
function calcularPrazosEFrete(uf) {
    const regiaoSudeste = ['SP', 'RJ', 'MG', 'ES'];
    const regiaoSul = ['PR', 'SC', 'RS'];

    if (regiaoSudeste.includes(uf)) {
        return {
            precoEco: 'R$ 14,90',
            prazoEco: '2 a 4 dias úteis',
            precoFast: 'R$ 26,50',
            prazoFast: '1 a 2 dias úteis',
            gratis: false
        };
    } else if (regiaoSul.includes(uf)) {
        return {
            precoEco: 'R$ 19,90',
            prazoEco: '3 a 6 dias úteis',
            precoFast: 'R$ 34,90',
            prazoFast: '2 a 3 dias úteis',
            gratis: false
        };
    } else {
        return {
            precoEco: 'R$ 29,90',
            prazoEco: '6 a 10 dias úteis',
            precoFast: 'R$ 49,90',
            prazoFast: '3 a 5 dias úteis',
            gratis: false
        };
    }
}

/* ==========================================================================
   10. SISTEMA DE NOTIFICAÇÕES (Toast Notifications)
   ========================================================================== */
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icons[type] || '🔔'}</span>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Utilitário para sanitização básica de strings HTML
function escapeHtml(text) {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
