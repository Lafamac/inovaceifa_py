import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { 
  WalletCards, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Package, 
  User, 
  Trash2, 
  TrendingUp,
  Tag,
  Boxes,
  FileCheck,
  ShoppingBag,
  ListOrdered,
  Pencil
} from 'lucide-react';
import { relatorioService } from '../services/api';

const money = (value) => Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const Financeiro = ({ defaultSubTab = 'compras' }) => {
  const { safraAtiva, fazendaAtiva } = useTenant();
  const { user } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);
  
  // Data State
  const [pedidosCompra, setPedidosCompra] = useState([]);
  const [contasAPagar, setContasAPagar] = useState([]);
  const [pedidosVenda, setPedidosVenda] = useState([]);
  const [contasAReceber, setContasAReceber] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  
  // Modals & UI States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showNewCompraModal, setShowNewCompraModal] = useState(false);
  const [showNewVendaModal, setShowNewVendaModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false);
  const [showNewPagarModal, setShowNewPagarModal] = useState(false);
  const [showNewReceberModal, setShowNewReceberModal] = useState(false);
  
  // Selected entities for actions
  const [selectedConta, setSelectedConta] = useState(null);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [pagamentoDate, setPagamentoDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [editingCompraId, setEditingCompraId] = useState(null);
  const [editingPagarId, setEditingPagarId] = useState(null);
  const [editingReceberId, setEditingReceberId] = useState(null);
  const [editingVendaId, setEditingVendaId] = useState(null);

  // New States for Custom Installments on Recebimento
  const [showReceberFormModal, setShowReceberFormModal] = useState(false);
  const [compraToReceive, setCompraToReceive] = useState(null);
  const [receberBaseDate, setReceberBaseDate] = useState('');
  const [receberQtdParcelas, setReceberQtdParcelas] = useState(1);
  const [receberParcelas, setReceberParcelas] = useState([]);

  // New States for Custom Installments on Confirmar Venda
  const [showConfirmarVendaModal, setShowConfirmarVendaModal] = useState(false);
  const [vendaToConfirm, setVendaToConfirm] = useState(null);
  const [confirmarVendaBaseDate, setConfirmarVendaBaseDate] = useState('');
  const [confirmarVendaQtdParcelas, setConfirmarVendaQtdParcelas] = useState(1);
  const [confirmarVendaParcelas, setConfirmarVendaParcelas] = useState([]);

  // Forms State
  const [newCompra, setNewCompra] = useState({
    fornecedor: '',
    data_pedido: new Date().toISOString().slice(0, 10),
    status: 'RASCUNHO',
    itens: []
  });
  
  const [newVenda, setNewVenda] = useState({
    cliente: '',
    data_venda: new Date().toISOString().slice(0, 10),
    tipo_produto: 'CAFE',
    quantidade_sacas: '',
    preco_unitario: ''
  });

  const [newPagar, setNewPagar] = useState({
    descricao: '',
    valor: '',
    data_vencimento: new Date().toISOString().slice(0, 10),
    status: 'PENDENTE',
    data_pagamento: ''
  });

  const [newReceber, setNewReceber] = useState({
    descricao: '',
    categoria_receita: 'OUTROS',
    valor: '',
    data_vencimento: new Date().toISOString().slice(0, 10),
    status: 'PENDENTE',
    data_recebimento: ''
  });
  
  // Temporary Item state for purchase order details
  const [tempItem, setTempItem] = useState({
    produto: '',
    quantidade: '',
    valor_unitario: ''
  });

  // Sync default tab prop changes
  useEffect(() => {
    setActiveSubTab(defaultSubTab);
  }, [defaultSubTab]);

  const loadAllData = async () => {
    if (!fazendaAtiva) return;
    setLoading(true);
    setError('');
    try {
      // Fetch Products for the purchase form dropdown
      try {
        const prodData = await relatorioService.getProdutos();
        setProdutos(prodData || []);
      } catch (err) {
        console.error("Erro ao carregar produtos da API:", err);
        try {
          const dbStr = localStorage.getItem('inovaceifa_db');
          if (dbStr) {
            const db = JSON.parse(dbStr);
            setProdutos(db.produtos || []);
          }
        } catch (localErr) {
          console.error("Erro ao carregar produtos do localStorage:", localErr);
        }
      }

      const [comprasData, pagarData, vendasData, receberData, fornecedoresData] = await Promise.all([
        relatorioService.getPedidosCompra(),
        relatorioService.getContasAPagar(),
        relatorioService.getPedidosVenda(),
        relatorioService.getContasAReceber(),
        relatorioService.getFornecedores()
      ]);

      // Filter by farm and active crop
      const filterByTenant = (items) => {
        return (items || []).filter(item => 
          String(item.fazenda_id || item.fazenda) === String(fazendaAtiva.id) &&
          (!safraAtiva || String(item.safra_id || item.safra) === String(safraAtiva.id))
        );
      };

      // Filter suppliers by farm only
      const filterSuppliersByFarm = (items) => {
        return (items || []).filter(item => 
          String(item.fazenda_id || item.fazenda) === String(fazendaAtiva.id)
        );
      };

      setPedidosCompra(filterByTenant(comprasData));
      setContasAPagar(filterByTenant(pagarData));
      setPedidosVenda(filterByTenant(vendasData));
      setContasAReceber(filterByTenant(receberData));
      setFornecedores(filterSuppliersByFarm(fornecedoresData));
    } catch (err) {
      console.error(err);
      setError('Falha ao carregar dados financeiros da API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [fazendaAtiva, safraAtiva]);

  const showAlert = (type, msg) => {
    if (type === 'error') {
      setError(msg);
      setSuccess('');
    } else {
      setSuccess(msg);
      setError('');
    }
    window.setTimeout(() => {
      setError('');
      setSuccess('');
    }, 4000);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      const tagName = event.target.tagName;
      const type = event.target.type;
      if (type === 'submit' || event.target.id === 'btn-add-item' || event.target.tagName === 'BUTTON') {
        return;
      }
      event.preventDefault();
      const form = event.target.form;
      if (form) {
        const index = Array.prototype.indexOf.call(form, event.target);
        if (index > -1) {
          let nextIndex = index + 1;
          while (nextIndex < form.elements.length) {
            const nextEl = form.elements[nextIndex];
            if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
              if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName)) {
                nextEl.focus();
                if (nextEl.select) nextEl.select();
                break;
              }
            }
            nextIndex++;
          }
        }
      }
    }
  };

  const handleAprovarCompra = async (p) => {
    setSaving(true);
    try {
      const payload = {
        fazenda: p.fazenda_id || p.fazenda,
        safra: p.safra_id || p.safra,
        fornecedor: p.fornecedor,
        data_pedido: p.data_pedido,
        status: 'APROVADO',
        itens: (p.itens || []).map(i => ({
          produto: i.produto_id || i.produto,
          quantidade: Number(i.quantidade),
          valor_unitario: Number(i.valor_unitario)
        }))
      };
      await relatorioService.updatePedidoCompra(p.id, payload);
      showAlert('success', 'Pedido de Compra aprovado com sucesso!');
      loadAllData();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Falha ao aprovar o Pedido de Compra.');
    } finally {
      setSaving(false);
    }
  };

  // Pedidos de Compra handlers
  const handleAddItemToCompra = () => {
    if (!tempItem.produto || !tempItem.quantidade || !tempItem.valor_unitario) {
      showAlert('error', 'Preencha todos os campos do item (produto, quantidade, valor unitário).');
      return;
    }
    
    const prodObj = produtos.find(p => String(p.id) === String(tempItem.produto));
    const newItem = {
      produto: Number(tempItem.produto),
      produto_nome: prodObj ? prodObj.nome_comercial : 'Produto',
      quantidade: Number(tempItem.quantidade),
      valor_unitario: Number(tempItem.valor_unitario),
      valor_total: Number(tempItem.quantidade) * Number(tempItem.valor_unitario)
    };

    setNewCompra(prev => ({
      ...prev,
      itens: [...prev.itens, newItem]
    }));

    setTempItem({
      produto: '',
      quantidade: '',
      valor_unitario: ''
    });
  };

  const handleRemoveItemFromCompra = (index) => {
    setNewCompra(prev => ({
      ...prev,
      itens: prev.itens.filter((_, idx) => idx !== index)
    }));
  };

  const handleStartEditCompra = (p) => {
    setEditingCompraId(p.id);
    setNewCompra({
      fornecedor: p.fornecedor_id || p.fornecedor,
      data_pedido: p.data_pedido,
      status: p.status,
      itens: (p.itens || []).map(i => ({
        produto: i.produto_id || i.produto,
        produto_nome: i.produto_nome || (produtos.find(prod => prod.id === (i.produto_id || i.produto))?.nome_comercial) || 'Produto',
        quantidade: Number(i.quantidade),
        valor_unitario: Number(i.valor_unitario),
        valor_total: Number(i.valor_total)
      }))
    });
    setShowNewCompraModal(true);
  };

  const handleCloseNewCompraModal = () => {
    setShowNewCompraModal(false);
    setEditingCompraId(null);
    setNewCompra({
      fornecedor: '',
      data_pedido: new Date().toISOString().slice(0, 10),
      status: 'RASCUNHO',
      itens: []
    });
  };

  const handleCreateCompra = async (e) => {
    e.preventDefault();
    if (!newCompra.fornecedor) {
      showAlert('error', 'Por favor, informe o fornecedor.');
      return;
    }
    if (newCompra.itens.length === 0) {
      showAlert('error', 'Adicione pelo menos um item ao pedido de compra.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fazenda: fazendaAtiva.id,
        safra: safraAtiva?.id,
        fornecedor: newCompra.fornecedor,
        data_pedido: newCompra.data_pedido,
        status: newCompra.status || 'RASCUNHO',
        itens: newCompra.itens
      };

      if (editingCompraId) {
        await relatorioService.updatePedidoCompra(editingCompraId, payload);
        showAlert('success', 'Pedido de Compra atualizado com sucesso!');
      } else {
        await relatorioService.createPedidoCompra(payload);
        showAlert('success', 'Pedido de Compra registrado com sucesso!');
      }
      
      handleCloseNewCompraModal();
      loadAllData();
    } catch (err) {
      showAlert('error', editingCompraId ? 'Erro ao atualizar o Pedido de Compra.' : 'Erro ao salvar o Pedido de Compra.');
    } finally {
      setSaving(false);
    }
  };

  const handleReceberCompra = async (id) => {
    try {
      await relatorioService.receberPedidoCompra(id);
      showAlert('success', 'Compra recebida! Contas a pagar e movimentos de estoque gerados automaticamente.');
      loadAllData();
    } catch (err) {
      showAlert('error', err.message || 'Falha ao processar recebimento da compra.');
    }
  };

  const handleOpenReceberCompraModal = (pedido) => {
    setCompraToReceive(pedido);
    const today = new Date().toISOString().slice(0, 10);
    setReceberBaseDate(pedido.data_pedido || today);
    setReceberQtdParcelas(1);
    setReceberParcelas([{
      data_vencimento: pedido.data_pedido || today,
      valor: Number(pedido.valor_total)
    }]);
    setShowReceberFormModal(true);
  };

  const recalculateParcelas = (qtd, baseDate, totalVal) => {
    const numInstallments = Number(qtd) || 1;
    const base = new Date(baseDate + 'T00:00:00');
    const totalValNum = Number(totalVal) || 0;
    
    const baseValue = Math.floor((totalValNum / numInstallments) * 100) / 100;
    const remainder = Math.round((totalValNum - (baseValue * numInstallments)) * 100) / 100;
    
    const newParcelas = [];
    for (let i = 0; i < numInstallments; i++) {
      const pDate = new Date(base.getTime());
      pDate.setMonth(base.getMonth() + i);
      const dateStr = pDate.toISOString().slice(0, 10);
      const pVal = i === numInstallments - 1 ? (baseValue + remainder) : baseValue;
      
      newParcelas.push({
        data_vencimento: dateStr,
        valor: Number(pVal.toFixed(2))
      });
    }
    setReceberParcelas(newParcelas);
  };

  const handleUpdateParcela = (idx, field, value) => {
    setReceberParcelas(prev => prev.map((p, i) => {
      if (i === idx) {
        return {
          ...p,
          [field]: field === 'valor' ? Number(value) : value
        };
      }
      return p;
    }));
  };

  const handleConfirmarRecebimentoCompra = async (e) => {
    e.preventDefault();
    if (!compraToReceive) return;
    
    const sumParcelas = receberParcelas.reduce((sum, curr) => sum + Number(curr.valor || 0), 0);
    if (Math.abs(sumParcelas - compraToReceive.valor_total) > 0.05) {
      showAlert('error', `A soma das parcelas (R$ ${sumParcelas.toFixed(2)}) deve ser igual ao valor total do pedido (R$ ${Number(compraToReceive.valor_total).toFixed(2)}).`);
      return;
    }
    
    setSaving(true);
    try {
      await relatorioService.receberPedidoCompra(compraToReceive.id, {
        parcelas: receberParcelas
      });
      showAlert('success', 'Pedido recebido com sucesso! Contas a pagar e estoque gerados.');
      setShowReceberFormModal(false);
      setCompraToReceive(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      showAlert('error', err.message || 'Falha ao processar recebimento da compra.');
    } finally {
      setSaving(false);
    }
  };

  // Contas a Pagar handlers
  const handleOpenPagamento = (conta) => {
    setSelectedConta(conta);
    setPagamentoDate(new Date().toISOString().slice(0, 10));
    setShowPagamentoModal(true);
  };

  const handleConfirmarPagamento = async () => {
    if (!selectedConta) return;
    setSaving(true);
    try {
      await relatorioService.pagarConta(selectedConta.id, pagamentoDate);
      showAlert('success', 'Pagamento registrado com sucesso!');
      setShowPagamentoModal(false);
      setSelectedConta(null);
      loadAllData();
    } catch (err) {
      showAlert('error', 'Erro ao liquidar contas a pagar.');
    } finally {
      setSaving(false);
    }
  };

  // Pedidos de Venda handlers
  const handleStartEditVenda = (venda) => {
    setEditingVendaId(venda.id);
    setNewVenda({
      cliente: venda.cliente,
      data_venda: venda.data_venda,
      tipo_produto: venda.tipo_produto,
      quantidade_sacas: venda.quantidade_sacas,
      preco_unitario: venda.preco_unitario,
      status: venda.status || 'RASCUNHO'
    });
    setShowNewVendaModal(true);
  };

  const handleOpenConfirmarVendaModal = (pedido) => {
    setVendaToConfirm(pedido);
    const today = new Date().toISOString().slice(0, 10);
    setConfirmarVendaBaseDate(pedido.data_venda || today);
    setConfirmarVendaQtdParcelas(1);
    setConfirmarVendaParcelas([{
      data_vencimento: pedido.data_venda || today,
      valor: Number(pedido.valor_total)
    }]);
    setShowConfirmarVendaModal(true);
  };

  const recalculateConfirmarVendaParcelas = (qtd, baseDate, totalVal) => {
    const numInstallments = Number(qtd) || 1;
    const base = new Date(baseDate + 'T00:00:00');
    const totalValNum = Number(totalVal) || 0;
    
    const baseValue = Math.floor((totalValNum / numInstallments) * 100) / 100;
    const remainder = Math.round((totalValNum - (baseValue * numInstallments)) * 100) / 100;
    
    const newParcelas = [];
    for (let i = 0; i < numInstallments; i++) {
      const pDate = new Date(base.getTime());
      pDate.setMonth(base.getMonth() + i);
      const dateStr = pDate.toISOString().slice(0, 10);
      const pVal = i === numInstallments - 1 ? (baseValue + remainder) : baseValue;
      
      newParcelas.push({
        data_vencimento: dateStr,
        valor: Number(pVal.toFixed(2))
      });
    }
    setConfirmarVendaParcelas(newParcelas);
  };

  const handleUpdateConfirmarVendaParcela = (idx, field, value) => {
    setConfirmarVendaParcelas(prev => prev.map((p, i) => {
      if (i === idx) {
        return {
          ...p,
          [field]: field === 'valor' ? Number(value) : value
        };
      }
      return p;
    }));
  };

  const handleConfirmarRecebimentoVenda = async (e) => {
    e.preventDefault();
    if (!vendaToConfirm) return;
    
    const sumParcelas = confirmarVendaParcelas.reduce((sum, curr) => sum + Number(curr.valor || 0), 0);
    if (Math.abs(sumParcelas - vendaToConfirm.valor_total) > 0.05) {
      showAlert('error', `A soma das parcelas (R$ ${sumParcelas.toFixed(2)}) deve ser igual ao valor total da venda (R$ ${Number(vendaToConfirm.valor_total).toFixed(2)}).`);
      return;
    }
    
    setSaving(true);
    try {
      await relatorioService.confirmarPedidoVenda(vendaToConfirm.id, {
        parcelas: confirmarVendaParcelas
      });
      showAlert('success', 'Pedido de Venda confirmado! Contas a receber gerada no financeiro.');
      setShowConfirmarVendaModal(false);
      setVendaToConfirm(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      showAlert('error', err.message || 'Falha ao processar confirmação de venda.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVenda = async (e) => {
    e.preventDefault();
    if (!newVenda.cliente || !newVenda.quantidade_sacas || !newVenda.preco_unitario) {
      showAlert('error', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fazenda: fazendaAtiva.id,
        safra: safraAtiva?.id,
        cliente: newVenda.cliente.toUpperCase(),
        data_venda: newVenda.data_venda,
        tipo_produto: newVenda.tipo_produto,
        quantidade_sacas: Number(newVenda.quantidade_sacas),
        preco_unitario: Number(newVenda.preco_unitario),
        status: newVenda.status || 'RASCUNHO'
      };

      if (editingVendaId) {
        await relatorioService.updatePedidoVenda(editingVendaId, payload);
        showAlert('success', 'Pedido de Venda atualizado com sucesso!');
      } else {
        await relatorioService.createPedidoVenda(payload);
        showAlert('success', 'Pedido de Venda criado como Rascunho com sucesso!');
      }

      setShowNewVendaModal(false);
      setEditingVendaId(null);
      setNewVenda({
        cliente: '',
        data_venda: new Date().toISOString().slice(0, 10),
        tipo_produto: 'CAFE',
        quantidade_sacas: '',
        preco_unitario: '',
        status: 'RASCUNHO'
      });
      loadAllData();
    } catch (err) {
      showAlert('error', 'Erro ao salvar o Pedido de Venda.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmarVenda = async (id) => {
    try {
      await relatorioService.confirmarPedidoVenda(id);
      showAlert('success', 'Pedido de Venda confirmado! Contas a receber gerada no financeiro.');
      loadAllData();
    } catch (err) {
      showAlert('error', err.message || 'Falha ao processar confirmação de venda.');
    }
  };

  // Contas a Receber handlers
  const handleOpenRecebimento = (conta) => {
    setSelectedConta(conta);
    setPagamentoDate(new Date().toISOString().slice(0, 10));
    setShowRecebimentoModal(true);
  };

  const handleConfirmarRecebimento = async () => {
    if (!selectedConta) return;
    setSaving(true);
    try {
      await relatorioService.receberConta(selectedConta.id, pagamentoDate);
      showAlert('success', 'Recebimento financeiro registrado com sucesso!');
      setShowRecebimentoModal(false);
      setSelectedConta(null);
      loadAllData();
    } catch (err) {
      showAlert('error', 'Erro ao liquidar contas a receber.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditPagar = (conta) => {
    setEditingPagarId(conta.id);
    setNewPagar({
      descricao: conta.descricao,
      valor: conta.valor,
      data_vencimento: conta.data_vencimento,
      status: conta.status,
      data_pagamento: conta.data_pagamento || ''
    });
    setShowNewPagarModal(true);
  };

  const handleStartEditReceber = (conta) => {
    setEditingReceberId(conta.id);
    setNewReceber({
      descricao: conta.descricao,
      categoria_receita: conta.categoria_receita || 'OUTROS',
      valor: conta.valor,
      data_vencimento: conta.data_vencimento,
      status: conta.status,
      data_recebimento: conta.data_recebimento || ''
    });
    setShowNewReceberModal(true);
  };

  const handleCreatePagar = async (e) => {
    e.preventDefault();
    if (!newPagar.descricao || !newPagar.valor || !newPagar.data_vencimento) {
      showAlert('error', 'Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fazenda: fazendaAtiva.id,
        safra: safraAtiva?.id,
        descricao: newPagar.descricao.toUpperCase(),
        valor: Number(newPagar.valor),
        data_vencimento: newPagar.data_vencimento,
        status: newPagar.status,
        data_pagamento: newPagar.status === 'PAGO' ? (newPagar.data_pagamento || newPagar.data_vencimento) : null
      };
      if (editingPagarId) {
        await relatorioService.updateContasAPagar(editingPagarId, payload);
        showAlert('success', 'Lançamento de Contas a Pagar atualizado com sucesso!');
      } else {
        await relatorioService.createContasAPagar(payload);
        showAlert('success', 'Lançamento de Contas a Pagar realizado com sucesso!');
      }
      setShowNewPagarModal(false);
      setEditingPagarId(null);
      loadAllData();
    } catch (err) {
      showAlert('error', 'Erro ao salvar o Lançamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateReceber = async (e) => {
    e.preventDefault();
    if (!newReceber.descricao || !newReceber.valor || !newReceber.data_vencimento) {
      showAlert('error', 'Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fazenda: fazendaAtiva.id,
        safra: safraAtiva?.id,
        descricao: newReceber.descricao.toUpperCase(),
        categoria_receita: newReceber.categoria_receita,
        valor: Number(newReceber.valor),
        data_vencimento: newReceber.data_vencimento,
        status: newReceber.status,
        data_recebimento: newReceber.status === 'RECEBIDO' ? (newReceber.data_recebimento || newReceber.data_vencimento) : null
      };
      if (editingReceberId) {
        await relatorioService.updateContasAReceber(editingReceberId, payload);
        showAlert('success', 'Lançamento de Contas a Receber atualizado com sucesso!');
      } else {
        await relatorioService.createContasAReceber(payload);
        showAlert('success', 'Lançamento de Contas a Receber realizado com sucesso!');
      }
      setShowNewReceberModal(false);
      setEditingReceberId(null);
      loadAllData();
    } catch (err) {
      showAlert('error', 'Erro ao salvar o Lançamento.');
    } finally {
      setSaving(false);
    }
  };

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const totalPagarPendente = contasAPagar
      .filter(c => c.status === 'PENDENTE')
      .reduce((sum, curr) => sum + Number(curr.valor), 0);
      
    const totalReceberPendente = contasAReceber
      .filter(c => c.status === 'PENDENTE')
      .reduce((sum, curr) => sum + Number(curr.valor), 0);

    const totalPagarPago = contasAPagar
      .filter(c => c.status === 'PAGO')
      .reduce((sum, curr) => sum + Number(curr.valor), 0);

    const totalReceberPago = contasAReceber
      .filter(c => c.status === 'RECEBIDO')
      .reduce((sum, curr) => sum + Number(curr.valor), 0);

    return {
      pagarPendente: totalPagarPendente,
      receberPendente: totalReceberPendente,
      pagarPago: totalPagarPago,
      receberPago: totalReceberPago,
      caixaProjetado: totalReceberPendente - totalPagarPendente,
      caixaRealizado: totalReceberPago - totalPagarPago
    };
  }, [contasAPagar, contasAReceber]);

  // Combined lists based on status filter
  const filteredCompras = useMemo(() => {
    if (statusFilter === 'TODOS') return pedidosCompra;
    return pedidosCompra.filter(p => p.status === statusFilter);
  }, [pedidosCompra, statusFilter]);

  const filteredVendas = useMemo(() => {
    if (statusFilter === 'TODOS') return pedidosVenda;
    return pedidosVenda.filter(p => p.status === statusFilter);
  }, [pedidosVenda, statusFilter]);

  const filteredPagar = useMemo(() => {
    if (statusFilter === 'TODOS') return contasAPagar;
    return contasAPagar.filter(c => c.status === statusFilter);
  }, [contasAPagar, statusFilter]);

  const filteredReceber = useMemo(() => {
    if (statusFilter === 'TODOS') return contasAReceber;
    return contasAReceber.filter(c => c.status === statusFilter);
  }, [contasAReceber, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Alertas */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-950/20 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-950/20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Top Banner & Context Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight font-display flex items-center gap-3">
            <WalletCards className="w-8 h-8 text-emerald-500" />
            <span>Módulo Financeiro & Comercial</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
            Gestão estruturada de compras de insumos, vendas de safras, contas a pagar e contas a receber sob o contexto de multi-tenancy.
          </p>
        </div>
        
        {/* Farm & Crop context pills */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-3 py-1">
            Fazenda: {fazendaAtiva?.nome || 'Carregando...'}
          </span>
          {safraAtiva && (
            <span className="rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase px-3 py-1">
              Safra: {safraAtiva.nome}
            </span>
          )}
        </div>
      </div>

      {/* 4 Cards Financeiros de Alta Definição */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/60 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contas a Pagar Pendentes</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">R$ {money(metrics.pagarPendente)}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/60 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contas a Receber Pendentes</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">R$ {money(metrics.receberPendente)}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/60 shadow-xl flex items-center gap-4">
          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${metrics.caixaRealizado >= 0 ? 'bg-teal-500/10 text-teal-500' : 'bg-rose-500/10 text-rose-500'}`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fluxo de Caixa Realizado</p>
            <p className={`text-xl font-black mt-1 ${metrics.caixaRealizado >= 0 ? 'text-teal-500' : 'text-rose-500'}`}>R$ {money(metrics.caixaRealizado)}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/60 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Saldo Caixa Projetado</p>
            <p className="text-xl font-black text-indigo-400 mt-1">R$ {money(metrics.caixaProjetado)}</p>
          </div>
        </div>

      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-3">
        
        {/* Navigation tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
          <button
            onClick={() => { setActiveSubTab('compras'); setStatusFilter('TODOS'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'compras'
                ? 'financial-tab-active bg-white dark:bg-slate-800 text-slate-800 shadow-md'
                : 'financial-tab-inactive text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span>Pedidos de Compra</span>
          </button>
          
          <button
            onClick={() => { setActiveSubTab('pagar'); setStatusFilter('TODOS'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'pagar'
                ? 'financial-tab-active bg-white dark:bg-slate-800 text-slate-800 shadow-md'
                : 'financial-tab-inactive text-slate-500 hover:text-slate-800'
            }`}
          >
            <WalletCards className="w-4.5 h-4.5 text-amber-500" />
            <span>Contas a Pagar</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('vendas'); setStatusFilter('TODOS'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'vendas'
                ? 'financial-tab-active bg-white dark:bg-slate-800 text-slate-800 shadow-md'
                : 'financial-tab-inactive text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListOrdered className="w-4.5 h-4.5" />
            <span>Pedidos de Venda</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('receber'); setStatusFilter('TODOS'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'receber'
                ? 'financial-tab-active bg-white dark:bg-slate-800 text-slate-800 shadow-md'
                : 'financial-tab-inactive text-slate-500 hover:text-slate-800'
            }`}
          >
            <WalletCards className="w-4.5 h-4.5 text-emerald-500" />
            <span>Contas a Receber</span>
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
          >
            <option value="TODOS">Todos os Status</option>
            {activeSubTab === 'compras' && (
              <>
                <option value="RASCUNHO">Rascunho</option>
                <option value="APROVADO">Aprovado</option>
                <option value="RECEBIDO">Recebido</option>
                <option value="CANCELADO">Cancelado</option>
              </>
            )}
            {activeSubTab === 'pagar' && (
              <>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </>
            )}
            {activeSubTab === 'vendas' && (
              <>
                <option value="RASCUNHO">Rascunho</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="CANCELADO">Cancelado</option>
              </>
            )}
            {activeSubTab === 'receber' && (
              <>
                <option value="PENDENTE">Pendente</option>
                <option value="RECEBIDO">Recebido</option>
                <option value="CANCELADO">Cancelado</option>
              </>
            )}
          </select>

          {/* Action trigger button */}
          {activeSubTab === 'compras' && (
            <button
              onClick={() => setShowNewCompraModal(true)}
              className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Compra</span>
            </button>
          )}

          {activeSubTab === 'vendas' && (
            <button
              onClick={() => {
                setEditingVendaId(null);
                setNewVenda({
                  cliente: '',
                  data_venda: new Date().toISOString().slice(0, 10),
                  tipo_produto: 'CAFE',
                  quantidade_sacas: '',
                  preco_unitario: '',
                  status: 'RASCUNHO'
                });
                setShowNewVendaModal(true);
              }}
              className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Venda</span>
            </button>
          )}

          {activeSubTab === 'pagar' && (
            <button
              onClick={() => {
                setEditingPagarId(null);
                setNewPagar({
                  descricao: '',
                  valor: '',
                  data_vencimento: new Date().toISOString().slice(0, 10),
                  status: 'PENDENTE',
                  data_pagamento: ''
                });
                setShowNewPagarModal(true);
              }}
              className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/10 shadow-indigo-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Pagar</span>
            </button>
          )}

          {activeSubTab === 'receber' && (
            <button
              onClick={() => {
                setEditingReceberId(null);
                setNewReceber({
                  descricao: '',
                  categoria_receita: 'OUTROS',
                  valor: '',
                  data_vencimento: new Date().toISOString().slice(0, 10),
                  status: 'PENDENTE',
                  data_recebimento: ''
                });
                setShowNewReceberModal(true);
              }}
              className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/10 shadow-teal-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Receber</span>
            </button>
          )}

        </div>

      </div>

      {/* Main Lists Render */}
      <div className="glass-panel border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/40 rounded-2xl overflow-x-auto shadow-xl">
        
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Carregando dados financeiros...</p>
          </div>
        ) : (
          <table className="w-full min-w-[768px] text-left border-collapse">
            
            {/* 1. Pedidos de Compra View */}
            {activeSubTab === 'compras' && (
              <>
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <th className="py-4.5 px-6">ID / Fornecedor</th>
                    <th className="py-4.5 px-6">Data / Safra</th>
                    <th className="py-4.5 px-6">Itens e Quantidades</th>
                    <th className="py-4.5 px-6 text-right">Valor Total</th>
                    <th className="py-4.5 px-6 text-center">Status</th>
                    <th className="py-4.5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                  {filteredCompras.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">Nenhum Pedido de Compra localizado para o filtro.</td>
                    </tr>
                  ) : (
                    filteredCompras.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-6 font-bold">
                          <span className="block text-[10px] text-slate-400">Pedido #{p.id}</span>
                          <span className="text-slate-800 dark:text-slate-200">{p.fornecedor_nome || p.fornecedor}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          <span className="block">{p.data_pedido}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">Safra ID {p.safra}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                          {p.itens && p.itens.length > 0 ? (
                            <div className="space-y-1">
                              {p.itens.map((item, idx) => (
                                <div key={idx} className="flex gap-1 items-center text-[10.5px]">
                                  <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{item.produto_nome || `Produto #${item.produto}`}:</span>
                                  <span>{Number(item.quantidade)} un. (R$ {money(item.valor_unitario)}/un)</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="italic text-slate-400">Sem itens registrados</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-slate-800 dark:text-white text-sm">
                          R$ {money(p.valor_total)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                            p.status === 'APROVADO' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' :
                            p.status === 'RECEBIDO' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            p.status === 'CANCELADO' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {p.status === 'RASCUNHO' && (
                              <>
                                <button
                                  onClick={() => handleStartEditCompra(p)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 cursor-pointer inline-flex items-center gap-1 text-[10px] font-black uppercase transition-all"
                                  title="Editar Pedido"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleAprovarCompra(p)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 cursor-pointer inline-flex items-center gap-1 text-[10px] font-black uppercase transition-all"
                                  title="Aprovar Pedido"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span>Aprovar</span>
                                </button>
                              </>
                            )}
                            {p.status === 'APROVADO' && (
                              <button
                                onClick={() => handleOpenReceberCompraModal(p)}
                                className="px-3.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Receber Compra
                              </button>
                            )}
                            {p.status === 'RECEBIDO' && (
                              <span className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
                                <FileCheck className="w-4 h-4 text-emerald-500" />
                                <span>Recebido</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {/* 2. Contas a Pagar View */}
            {activeSubTab === 'pagar' && (
              <>
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <th className="py-4.5 px-6">Lançamento / Vínculo</th>
                    <th className="py-4.5 px-6">Descrição / Motivo</th>
                    <th className="py-4.5 px-6">Data Vencimento</th>
                    <th className="py-4.5 px-6">Data Pagamento</th>
                    <th className="py-4.5 px-6 text-right">Valor</th>
                    <th className="py-4.5 px-6 text-center">Status</th>
                    <th className="py-4.5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                  {filteredPagar.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">Nenhuma despesa pendente ou paga.</td>
                    </tr>
                  ) : (
                    filteredPagar.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-6 font-bold">
                          <span className="block text-[10px] text-slate-400">ID #{c.id}</span>
                          {c.pedido_compra || c.pedido_compra_id ? (
                            <span className="text-amber-500 text-[10.5px] font-semibold">Ref. Pedido #{c.pedido_compra || c.pedido_compra_id}</span>
                          ) : (
                            <span className="text-slate-500">Lançamento Avulso</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-800 dark:text-slate-200 font-semibold">{c.descricao}</td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.data_vencimento}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          {c.data_pagamento ? (
                            <div className="flex items-center gap-1.5 text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{c.data_pagamento}</span>
                            </div>
                          ) : (
                            <span className="italic text-slate-400">Não pago</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-rose-500 text-sm">
                          R$ {money(c.valor)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                            c.status === 'PAGO' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            c.status === 'CANCELADO' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {c.status === 'PENDENTE' && (
                              <>
                                <button
                                  onClick={() => handleStartEditPagar(c)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 cursor-pointer inline-flex items-center gap-1 text-[10px] font-black uppercase transition-all"
                                  title="Editar Conta"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleOpenPagamento(c)}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Pagar Conta
                                </button>
                              </>
                            )}
                            {c.status === 'PAGO' && (
                              <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Quitado</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {/* 3. Pedidos de Venda View */}
            {activeSubTab === 'vendas' && (
              <>
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <th className="py-4.5 px-6">Venda / Cliente</th>
                    <th className="py-4.5 px-6">Data Negociada</th>
                    <th className="py-4.5 px-6">Produto / Sacas</th>
                    <th className="py-4.5 px-6 text-right">Preço Unitário</th>
                    <th className="py-4.5 px-6 text-right">Valor Negociado</th>
                    <th className="py-4.5 px-6 text-center">Status</th>
                    <th className="py-4.5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                  {filteredVendas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">Nenhum Pedido de Venda localizado.</td>
                    </tr>
                  ) : (
                    filteredVendas.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-6 font-bold">
                          <span className="block text-[10px] text-slate-400">Contrato #{v.id}</span>
                          <span className="text-slate-800 dark:text-slate-200">{v.cliente}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{v.data_venda}</td>
                        <td className="py-4 px-6 font-semibold text-slate-750 dark:text-slate-300">
                          <span className="inline-block rounded bg-teal-500/10 text-teal-400 text-[10px] px-2 py-0.5 mr-2">{v.tipo_produto}</span>
                          <span>{money(v.quantidade_sacas)} Sacas</span>
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-slate-600 dark:text-slate-400">
                          R$ {money(v.preco_unitario)}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-emerald-500 text-sm">
                          R$ {money(v.valor_total)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                            v.status === 'CONFIRMADO' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' :
                            v.status === 'ENTREGUE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            v.status === 'CANCELADO' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {v.status === 'RASCUNHO' && (
                              <>
                                <button
                                  onClick={() => handleStartEditVenda(v)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 cursor-pointer inline-flex items-center gap-1 text-[10px] font-black uppercase transition-all"
                                  title="Editar Venda"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleOpenConfirmarVendaModal(v)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-teal-500/30 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 cursor-pointer inline-flex items-center gap-1 text-[10px] font-black uppercase transition-all"
                                  title="Confirmar Venda"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span>Confirmar</span>
                                </button>
                              </>
                            )}
                            {v.status === 'CONFIRMADO' && (
                              <span className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4 text-teal-500" />
                                <span>Confirmado</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {/* 4. Contas a Receber View */}
            {activeSubTab === 'receber' && (
              <>
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <th className="py-4.5 px-6">Lançamento / Venda</th>
                    <th className="py-4.5 px-6">Descrição / Origem</th>
                    <th className="py-4.5 px-6">Categoria</th>
                    <th className="py-4.5 px-6">Vencimento</th>
                    <th className="py-4.5 px-6">Data Recebimento</th>
                    <th className="py-4.5 px-6 text-right">Valor</th>
                    <th className="py-4.5 px-6 text-center">Status</th>
                    <th className="py-4.5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                  {filteredReceber.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">Nenhuma receita pendente ou registrada.</td>
                    </tr>
                  ) : (
                    filteredReceber.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-6 font-bold">
                          <span className="block text-[10px] text-slate-400">ID #{c.id}</span>
                          {c.pedido_venda || c.pedido_venda_id ? (
                            <span className="text-teal-500 text-[10.5px] font-semibold">Ref. Pedido #{c.pedido_venda || c.pedido_venda_id}</span>
                          ) : (
                            <span className="text-slate-500">Avulso</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-800 dark:text-slate-200 font-semibold">{c.descricao}</td>
                        <td className="py-4 px-6">
                          <span className="inline-block rounded bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 font-bold">
                            {c.categoria_receita}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.data_vencimento}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          {c.data_recebimento ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{c.data_recebimento}</span>
                            </div>
                          ) : (
                            <span className="italic text-slate-400">Não recebido</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-teal-400 text-sm">
                          R$ {money(c.valor)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                            c.status === 'RECEBIDO' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            c.status === 'CANCELADO' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                            'bg-teal-500/10 text-teal-500 border border-teal-500/20'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {c.status === 'PENDENTE' && (
                              <>
                                <button
                                  onClick={() => handleStartEditReceber(c)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 cursor-pointer inline-flex items-center gap-1 text-[10px] font-black uppercase transition-all"
                                  title="Editar Receita"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleOpenRecebimento(c)}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Receber
                                </button>
                              </>
                            )}
                            {c.status === 'RECEBIDO' && (
                              <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Recebido</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

          </table>
        )}

      </div>

      {/* --- MODAL: NOVA COMPRA (MESTRE-DETALHE) --- */}
      {showNewCompraModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <span>{editingCompraId ? 'Editar Pedido de Compra' : 'Registrar Novo Pedido de Compra'}</span>
              </h3>
              <button type="button" onClick={handleCloseNewCompraModal} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>
            
            <form onSubmit={handleCreateCompra} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Fornecedor / Parceiro *</label>
                  <select
                    required
                    value={newCompra.fornecedor}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewCompra(prev => ({ ...prev, fornecedor: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  >
                    <option value="">Selecione um fornecedor...</option>
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.id} className="bg-slate-900 text-white">{f.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Data do Pedido *</label>
                  <input
                    type="date"
                    required
                    value={newCompra.data_pedido}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewCompra(prev => ({ ...prev, data_pedido: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Status *</label>
                  <select
                    required
                    value={newCompra.status || 'RASCUNHO'}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewCompra(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  >
                    <option value="RASCUNHO" className="bg-slate-900 text-white">RASCUNHO</option>
                    <option value="APROVADO" className="bg-slate-900 text-white">APROVADO</option>
                    <option value="RECEBIDO" className="bg-slate-900 text-white">RECEBIDO</option>
                    <option value="CANCELADO" className="bg-slate-900 text-white">CANCELADO</option>
                  </select>
                </div>
              </div>

              {/* Mestre-Detalhe: Adição de Itens */}
              <div className="border-t border-white/[0.04] pt-4">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                  <Boxes className="w-4 h-4" />
                  <span>Produtos do Pedido</span>
                </h4>
                
                {/* Form temporário de adição */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-950/40 border border-white/[0.04] p-4.5 rounded-xl mb-4">
                  <div className="sm:col-span-5">
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">Insumo / Produto</label>
                    <select
                      value={tempItem.produto}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setTempItem(prev => ({ ...prev, produto: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                    >
                      <option value="">Selecione um insumo...</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>{p.nome_comercial} ({p.codigo})</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">Quantidade</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 500"
                      value={tempItem.quantidade}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setTempItem(prev => ({ ...prev, quantidade: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">Preço Unitário (R$)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 4.50"
                      value={tempItem.valor_unitario}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setTempItem(prev => ({ ...prev, valor_unitario: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItemToCompra}
                      className="w-full h-9 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer transition-all font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Lista de itens inseridos */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {newCompra.itens.length === 0 ? (
                    <p className="text-[11px] text-slate-500 text-center italic py-2">Nenhum produto adicionado ainda.</p>
                  ) : (
                    newCompra.itens.map((item, index) => (
                      <div key={index} className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-slate-950 border border-white/[0.03] text-[11px]">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-white">{item.produto_nome}</span>
                          <span className="text-slate-300">| {money(item.quantidade)} un x R$ {money(item.valor_unitario)}/un</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-white">R$ {money(item.valor_total)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromCompra(index)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal */}
                {newCompra.itens.length > 0 && (
                  <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-white/[0.04] mt-4">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total do Pedido:</span>
                    <span className="text-sm font-black text-emerald-400">R$ {money(newCompra.itens.reduce((sum, curr) => sum + curr.valor_total, 0))}</span>
                  </div>
                )}

              </div>

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={handleCloseNewCompraModal}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Salvando...' : (editingCompraId ? 'Atualizar Pedido' : 'Salvar Pedido')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CONDIÇÕES DE RECEBIMENTO (PARCELAS) --- */}
      {showReceberFormModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <span>Condições de Pagamento e Recebimento</span>
              </h3>
              <button type="button" onClick={() => { setShowReceberFormModal(false); setCompraToReceive(null); }} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>
            
            <form onSubmit={handleConfirmarRecebimentoCompra} className="p-6 space-y-6">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-white/[0.04] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fornecedor:</span>
                  <span className="font-bold text-white">{compraToReceive?.fornecedor_nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total do Pedido:</span>
                  <span className="font-black text-emerald-400">R$ {money(compraToReceive?.valor_total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Data Vencimento Inicial / Base *</label>
                  <input
                    type="date"
                    required
                    value={receberBaseDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setReceberBaseDate(newDate);
                      recalculateParcelas(receberQtdParcelas, newDate, compraToReceive?.valor_total);
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Número de Parcelas *</label>
                  <select
                    value={receberQtdParcelas}
                    onChange={(e) => {
                      const newQtd = Number(e.target.value);
                      setReceberQtdParcelas(newQtd);
                      recalculateParcelas(newQtd, receberBaseDate, compraToReceive?.valor_total);
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <option key={n} value={n} className="bg-slate-900 text-white">{n}x</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Listagem Dinâmica de Parcelas */}
              <div className="space-y-3">
                <span className="block text-[10px] font-black uppercase text-slate-400">Detalhamento das Parcelas</span>
                <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                  {receberParcelas.map((parc, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/[0.04]">
                      <span className="text-[10px] font-black text-slate-500 shrink-0 w-8">#{idx+1}</span>
                      <div className="flex-1">
                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Vencimento</label>
                        <input
                          type="date"
                          required
                          value={parc.data_vencimento}
                          onChange={(e) => handleUpdateParcela(idx, 'data_vencimento', e.target.value)}
                          className="w-full bg-slate-950 border border-white/[0.06] rounded-lg py-1.5 px-2 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={parc.valor}
                          onChange={(e) => handleUpdateParcela(idx, 'valor', e.target.value)}
                          className="w-full bg-slate-950 border border-white/[0.06] rounded-lg py-1.5 px-2 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Check */}
              <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-white/[0.04] mt-4">
                <div className="text-[10px] font-black uppercase text-slate-400">
                  <span>Soma das Parcelas:</span>
                  <span className="block text-[8px] font-bold mt-0.5 text-slate-500">Diferença: R$ {Math.abs(receberParcelas.reduce((s, c) => s + Number(c.valor || 0), 0) - (compraToReceive?.valor_total || 0)).toFixed(2)}</span>
                </div>
                <span className={`text-sm font-black ${
                  Math.abs(receberParcelas.reduce((s, c) => s + Number(c.valor || 0), 0) - (compraToReceive?.valor_total || 0)) <= 0.05
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  R$ {receberParcelas.reduce((s, c) => s + Number(c.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => { setShowReceberFormModal(false); setCompraToReceive(null); }}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Processando...' : 'Confirmar Recebimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CONDIÇÕES DE RECEBIMENTO DO PEDIDO DE VENDA (PARCELAS) --- */}
      {showConfirmarVendaModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <span>Condições de Recebimento da Venda</span>
              </h3>
              <button type="button" onClick={() => { setShowConfirmarVendaModal(false); setVendaToConfirm(null); }} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>
            
            <form onSubmit={handleConfirmarRecebimentoVenda} className="p-6 space-y-6">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-white/[0.04] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="font-bold text-white">{vendaToConfirm?.cliente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Negociado:</span>
                  <span className="font-black text-emerald-400">R$ {money(vendaToConfirm?.valor_total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Data Vencimento Inicial / Base *</label>
                  <input
                    type="date"
                    required
                    value={confirmarVendaBaseDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setConfirmarVendaBaseDate(newDate);
                      recalculateConfirmarVendaParcelas(confirmarVendaQtdParcelas, newDate, vendaToConfirm?.valor_total);
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Número de Parcelas *</label>
                  <select
                    value={confirmarVendaQtdParcelas}
                    onChange={(e) => {
                      const newQtd = Number(e.target.value);
                      setConfirmarVendaQtdParcelas(newQtd);
                      recalculateConfirmarVendaParcelas(newQtd, confirmarVendaBaseDate, vendaToConfirm?.valor_total);
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <option key={n} value={n} className="bg-slate-900 text-white">{n}x</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Listagem Dinâmica de Parcelas */}
              <div className="space-y-3">
                <span className="block text-[10px] font-black uppercase text-slate-400">Detalhamento das Parcelas</span>
                <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                  {confirmarVendaParcelas.map((parc, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/[0.04]">
                      <span className="text-[10px] font-black text-slate-500 shrink-0 w-8">#{idx+1}</span>
                      <div className="flex-1">
                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Vencimento</label>
                        <input
                          type="date"
                          required
                          value={parc.data_vencimento}
                          onChange={(e) => handleUpdateConfirmarVendaParcela(idx, 'data_vencimento', e.target.value)}
                          className="w-full bg-slate-950 border border-white/[0.06] rounded-lg py-1.5 px-2 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={parc.valor}
                          onChange={(e) => handleUpdateConfirmarVendaParcela(idx, 'valor', e.target.value)}
                          className="w-full bg-slate-950 border border-white/[0.06] rounded-lg py-1.5 px-2 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Check */}
              <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-white/[0.04] mt-4">
                <div className="text-[10px] font-black uppercase text-slate-400">
                  <span>Soma das Parcelas:</span>
                  <span className="block text-[8px] font-bold mt-0.5 text-slate-500">Diferença: R$ {Math.abs(confirmarVendaParcelas.reduce((s, c) => s + Number(c.valor || 0), 0) - (vendaToConfirm?.valor_total || 0)).toFixed(2)}</span>
                </div>
                <span className={`text-sm font-black ${
                  Math.abs(confirmarVendaParcelas.reduce((s, c) => s + Number(c.valor || 0), 0) - (vendaToConfirm?.valor_total || 0)) <= 0.05
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  R$ {confirmarVendaParcelas.reduce((s, c) => s + Number(c.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => { setShowConfirmarVendaModal(false); setVendaToConfirm(null); }}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Processando...' : 'Confirmar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NOVA VENDA --- */}
      {showNewVendaModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-emerald-500" />
                <span>{editingVendaId ? 'Editar Pedido de Venda' : 'Registrar Novo Pedido de Venda'}</span>
              </h3>
              <button onClick={() => { setShowNewVendaModal(false); setEditingVendaId(null); }} className="text-slate-400 hover:text-white transition-all text-xs font-mono font-bold">X</button>
            </div>
            
            <form onSubmit={handleCreateVenda} className="p-6 space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Cliente / Comprador *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cooxupé Cooperativa"
                  value={newVenda.cliente}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setNewVenda(prev => ({ ...prev, cliente: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Data da Venda *</label>
                  <input
                    type="date"
                    required
                    value={newVenda.data_venda}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewVenda(prev => ({ ...prev, data_venda: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Tipo de Produto *</label>
                  <select
                    value={newVenda.tipo_produto}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewVenda(prev => ({ ...prev, tipo_produto: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-semibold font-semibold"
                  >
                    <option value="CAFE">Café</option>
                    <option value="CEREAIS">Cereais</option>
                    <option value="SUCATA">Sucata</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Status *</label>
                  <select
                    value={newVenda.status || 'RASCUNHO'}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewVenda(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-semibold"
                  >
                    <option value="RASCUNHO">RASCUNHO</option>
                    <option value="CONFIRMADO">CONFIRMADO</option>
                    <option value="ENTREGUE">ENTREGUE</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/[0.04] pt-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Quant. Sacas *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ex: 120"
                    value={newVenda.quantidade_sacas}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewVenda(prev => ({ ...prev, quantidade_sacas: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Preço Unitário (R$ / Saca) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ex: 950.00"
                    value={newVenda.preco_unitario}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewVenda(prev => ({ ...prev, preco_unitario: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
              </div>

              {newVenda.quantidade_sacas && newVenda.preco_unitario && (
                <div className="bg-slate-950/80 border border-white/[0.04] p-3 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-500">Valor Total Estimado:</span>
                  <span className="font-black text-emerald-400">R$ {money(Number(newVenda.quantidade_sacas) * Number(newVenda.preco_unitario))}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => { setShowNewVendaModal(false); setEditingVendaId(null); }}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Gravando...' : (editingVendaId ? 'Atualizar Venda' : 'Salvar Venda')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: REGISTRAR PAGAMENTO (CONTAS A PAGAR) --- */}
      {showPagamentoModal && selectedConta && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Quitar Conta a Pagar</h3>
              <button onClick={() => setShowPagamentoModal(false)} className="text-slate-400 hover:text-white transition-all text-xs font-mono font-bold">X</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400">Descrição / Motivo:</p>
                <p className="text-xs font-bold text-white leading-relaxed">{selectedConta.descricao}</p>
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/[0.04]">
                <span className="text-[10px] font-black uppercase text-slate-500">Valor da Liquidação:</span>
                <span className="text-sm font-black text-rose-500">R$ {money(selectedConta.valor)}</span>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Data do Pagamento *</label>
                <input
                  type="date"
                  required
                  value={pagamentoDate}
                  onChange={(e) => setPagamentoDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-semibold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowPagamentoModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarPagamento}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Efetuando...' : 'Confirmar Pagamento'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: REGISTRAR RECEBIMENTO (CONTAS A RECEBER) --- */}
      {showRecebimentoModal && selectedConta && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Quitar Conta a Receber</h3>
              <button onClick={() => setShowRecebimentoModal(false)} className="text-slate-400 hover:text-white transition-all text-xs font-mono font-bold">X</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400">Descrição / Origem:</p>
                <p className="text-xs font-bold text-white leading-relaxed">{selectedConta.descricao}</p>
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/[0.04]">
                <span className="text-[10px] font-black uppercase text-slate-500">Valor a Receber:</span>
                <span className="text-sm font-black text-emerald-400">R$ {money(selectedConta.valor)}</span>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Data de Recebimento *</label>
                <input
                  type="date"
                  required
                  value={pagamentoDate}
                  onChange={(e) => setPagamentoDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-semibold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowRecebimentoModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarRecebimento}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Registrando...' : 'Confirmar Recebimento'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: LANÇAR CONTAS A PAGAR MANUAL --- */}
      {showNewPagarModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <WalletCards className="w-5 h-5 text-emerald-500" />
                <span>{editingPagarId ? 'Editar Contas a Pagar' : 'Lançar Contas a Pagar Manual'}</span>
              </h3>
              <button onClick={() => { setShowNewPagarModal(false); setEditingPagarId(null); }} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>
            
            <form onSubmit={handleCreatePagar} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Descrição / Motivo *</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: PAGAMENTO ENERGIA ELÉTRICA SUMATRA"
                    value={newPagar.descricao}
                    onChange={(e) => setNewPagar(prev => ({ ...prev, descricao: e.target.value.toUpperCase() }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 1500.00"
                    value={newPagar.valor}
                    onChange={(e) => setNewPagar(prev => ({ ...prev, valor: e.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={newPagar.data_vencimento}
                    onChange={(e) => setNewPagar(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Status *</label>
                  <select
                    value={newPagar.status}
                    onChange={(e) => setNewPagar(prev => ({ ...prev, status: e.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-semibold animate-in fade-in"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                  </select>
                </div>
                {newPagar.status === 'PAGO' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Data de Pagamento *</label>
                    <input
                      type="date"
                      required
                      value={newPagar.data_pagamento || newPagar.data_vencimento}
                      onChange={(e) => setNewPagar(prev => ({ ...prev, data_pagamento: e.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          const form = event.target.form;
                          if (form) {
                            const index = Array.prototype.indexOf.call(form, event.target);
                            if (index > -1) {
                              let nextIndex = index + 1;
                              while (nextIndex < form.elements.length) {
                                const nextEl = form.elements[nextIndex];
                                if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                    nextEl.focus();
                                    break;
                                  }
                                }
                                nextIndex++;
                              }
                            }
                          }
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowNewPagarModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Salvando...' : (editingPagarId ? 'Atualizar Lançamento' : 'Confirmar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: LANÇAR CONTAS A RECEBER MANUAL --- */}
      {showNewReceberModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <WalletCards className="w-5 h-5 text-emerald-500" />
                <span>{editingReceberId ? 'Editar Contas a Receber' : 'Lançar Contas a Receber Manual'}</span>
              </h3>
              <button onClick={() => { setShowNewReceberModal(false); setEditingReceberId(null); }} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>
            
            <form onSubmit={handleCreateReceber} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Descrição / Origem *</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: RECEBIMENTO VENDA CAFÉ LOTE 42"
                    value={newReceber.descricao}
                    onChange={(e) => setNewReceber(prev => ({ ...prev, descricao: e.target.value.toUpperCase() }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Categoria de Receita *</label>
                  <select
                    value={newReceber.categoria_receita}
                    onChange={(e) => setNewReceber(prev => ({ ...prev, categoria_receita: e.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-semibold"
                  >
                    <option value="VENDA_CAFE">Venda Café</option>
                    <option value="CEREAIS">Cereais</option>
                    <option value="SUCATA">Sucata</option>
                    <option value="CUSTEIO_AGRICOLA">Custeio Agrícola</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 50000.00"
                    value={newReceber.valor}
                    onChange={(e) => setNewReceber(prev => ({ ...prev, valor: e.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={newReceber.data_vencimento}
                    onChange={(e) => setNewReceber(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Status *</label>
                  <select
                    value={newReceber.status}
                    onChange={(e) => setNewReceber(prev => ({ ...prev, status: e.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const form = event.target.form;
                        if (form) {
                          const index = Array.prototype.indexOf.call(form, event.target);
                          if (index > -1) {
                            let nextIndex = index + 1;
                            while (nextIndex < form.elements.length) {
                              const nextEl = form.elements[nextIndex];
                              if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                  nextEl.focus();
                                  break;
                                }
                              }
                              nextIndex++;
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-semibold"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="RECEBIDO">Recebido</option>
                  </select>
                </div>
                {newReceber.status === 'RECEBIDO' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-bold">Data de Recebimento *</label>
                    <input
                      type="date"
                      required
                      value={newReceber.data_recebimento || newReceber.data_vencimento}
                      onChange={(e) => setNewReceber(prev => ({ ...prev, data_recebimento: e.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          const form = event.target.form;
                          if (form) {
                            const index = Array.prototype.indexOf.call(form, event.target);
                            if (index > -1) {
                              let nextIndex = index + 1;
                              while (nextIndex < form.elements.length) {
                                const nextEl = form.elements[nextIndex];
                                if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
                                  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                                    nextEl.focus();
                                    break;
                                  }
                                }
                                nextIndex++;
                              }
                            }
                          }
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowNewReceberModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Salvando...' : (editingReceberId ? 'Atualizar Lançamento' : 'Confirmar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
