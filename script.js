document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LÓGICA DE NAVEGAÇÃO ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.page-section');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    // Função para trocar a seção visível
    function navigateTo(targetId) {
        // Remove active de todas as seções
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Remove active de todos os links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Adiciona active na seção alvo
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Adiciona active no link clicado (ou no link correspondente)
        const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Adiciona evento de clique nos links de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Evita o recarregamento ou salto brusco da âncora padrão
            const targetId = link.getAttribute('data-target');
            navigateTo(targetId);
        });
    });


    // --- 2. INTERAÇÃO VISUAL: Efeito nos Botões de Produto ---
    const productBtns = document.querySelectorAll('.product-btn');

    productBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            const originalText = this.innerText;

            // Efeito visual temporário
            this.innerText = 'Adicionado!';
            this.style.backgroundColor = '#4CAF50';
            this.style.color = '#fff';

            // Pequena animação no botão
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);

            // Restaura o botão após 1.5s
            setTimeout(() => {
                this.innerText = originalText;
                this.style.backgroundColor = '';
                this.style.color = '';
            }, 1500);
        });
    });

    // --- 3. LÓGICA DO FORMULÁRIO DE CADASTRO ---
    const productForm = document.getElementById('productForm');
    const btnAddProduct = document.getElementById('btnAddProduct');

    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Pega os valores
            const name = document.getElementById('prodName').value;
            const price = parseFloat(document.getElementById('prodPrice').value).toFixed(2).replace('.', ',');
            const categorySelect = document.getElementById('prodCategory');
            const category = categorySelect.options[categorySelect.selectedIndex].text;

            // Validação simples
            if (!name || isNaN(parseFloat(document.getElementById('prodPrice').value)) || !categorySelect.value) {
                alert('Por favor, preencha todos os campos obrigatórios corretamente.');
                return;
            }

            // Exibe mensagem de sucesso
            alert('Produto cadastrado com sucesso! (Simulação visual)');
            productForm.reset();
        });
    }

});
