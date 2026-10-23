// Variável para armazenar o preço unitário do produto atual
let precoUnitario = 0;

// Função chamada quando o cliente clica em "Pedir"
function abrirModal(nomeProduto, preco) {
    precoUnitario = preco;
    
    // Preenche os dados ocultos e o título
    document.getElementById('produto-nome').value = nomeProduto;
    document.getElementById('modal-titulo-produto').innerText = "Pedido: " + nomeProduto;
    
    // Reseta o formulário e os valores
    document.getElementById('form-pedido').reset();
    document.getElementById('cli-quantidade').value = 1;
    document.getElementById('cli-frete').value = "0.00";
    calcularTotal();
    
    // Mostra a janelinha
    document.getElementById('modal-pedido').style.display = 'flex';
}

// Função para fechar a janelinha
function fecharModal() {
    document.getElementById('modal-pedido').style.display = 'none';
}

// Função que faz o cálculo em tempo real (Quantidade x Preço) + Frete
function calcularTotal() {
    let qtd = parseInt(document.getElementById('cli-quantidade').value) || 1;
    let frete = parseFloat(document.getElementById('cli-frete').value) || 0;
    
    // Cálculo
    let subtotal = precoUnitario * qtd;
    let total = subtotal + frete;
    
    // Formata para o padrão brasileiro (R$ 00,00)
    let subtotalFormatado = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    let totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Atualiza na tela da janelinha
    document.getElementById('mostrar-subtotal').innerText = subtotalFormatado;
    document.getElementById('mostrar-total').innerText = totalFormatado;
}

// Quando o formulário for enviado (botão Enviar clicado)
document.getElementById('form-pedido').addEventListener('submit', function(e) {
    e.preventDefault(); // Impede a página de recarregar
    
    // Pega todos os dados digitados
    let produto = document.getElementById('produto-nome').value;
    let nome = document.getElementById('cli-nome').value;
    let qtd = document.getElementById('cli-quantidade').value;
    let frete = parseFloat(document.getElementById('cli-frete').value) || 0;
    let pagamento = document.getElementById('cli-pagamento').value;
    let endereco = document.getElementById('cli-endereco').value;
    
    // Calcula os valores finais
    let subtotal = precoUnitario * parseInt(qtd);
    let total = subtotal + frete;
    
    let subtotalFormatado = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    let totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    let freteFormatado = frete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Monta a mensagem final para o WhatsApp (com negrito usando asteriscos)
    let mensagem = `Olá! Gostaria de fazer um pedido:%0A%0A` +
                   `*Produto:* ${produto}%0A` +
                   `*Nome do Cliente:* ${nome}%0A` +
                   `*Quantidade:* ${qtd}%0A` +
                   `*Subtotal:* ${subtotalFormatado}%0A` +
                   `*Frete:* ${freteFormatado}%0A` +
                   `*TOTAL A PAGAR:* ${totalFormatado}%0A` +
                   `*Forma de Pagamento:* ${pagamento}%0A%0A` +
                   `*Endereço de Entrega:*%0A${endereco}`;

    // Número do WhatsApp da loja (5518996438262)
    let numeroWhatsApp = "5518996438262";
    
    // Abre o WhatsApp em uma nova aba
    window.open(`https://wa.me/${numeroWhatsApp}?text=${mensagem}`, '_blank');
    
    // Fecha a janelinha após o envio
    fecharModal();
});
