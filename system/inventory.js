        function renderInventory() {
            const container = document.getElementById('inventoryList');
            if (!container) return;
            container.innerHTML = '';

            const keyword = (document.getElementById('searchInventoryKeyword')?.value || '').toLowerCase();
            const statusFilter = document.getElementById('filterInventoryStatus')?.value || 'all';

            const inventoryItems = data.inventory.filter(item => {
                if (statusFilter !== 'all' && item.status !== statusFilter) return false;
                if (!keyword) return true;

                return [item.productId, item.productName, item.spec, item.supplierName, item.warehouse, item.relatedOrders?.join(', ')].some(field =>
                    field && field.toLowerCase().includes(keyword)
                );
            });

            if (inventoryItems.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500 py-10 bg-white rounded">目前沒有庫存資料。</div>';
            } else {
                const inventoryHtml = inventoryItems.map(item => {
                    return `
                        <div class="card p-5 border-l-4 border-teal-500">
                            <div class="flex flex-col md:flex-row justify-between gap-4 mb-3">
                                <div>
                                    <div class="text-sm text-gray-500">庫存編號：${item.id}</div>
                                    <div class="text-lg font-bold text-gray-800">${item.productName || '未知產品'}</div>
                                    <div class="text-sm text-gray-500">產品編號：${item.productId} / 規格：${item.spec || '無'} / 供應商：${item.supplierName || '未知'}</div>
                                    <div class="text-sm text-gray-500">稅別：${item.taxStatus || '含稅'}</div>
                                </div>
                                <div class="flex flex-wrap gap-2 items-center">
                                    <span class="px-3 py-1 rounded-full text-sm border ${item.status === '正常' ? 'border-teal-200 bg-teal-50 text-teal-700' : item.status === '低庫存' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-red-200 bg-red-50 text-red-700'}">${item.status}</span>
                                    <span class="text-sm text-gray-600">最後更新：${item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('zh-TW', { hour12: false }) : '未記錄'}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                                <div class="bg-gray-50 p-3 rounded shadow-sm">
                                    <div class="text-xs text-gray-500">庫存數量</div>
                                    <div class="text-2xl font-bold text-gray-900">${item.quantity}</div>
                                </div>
                                <div class="bg-gray-50 p-3 rounded shadow-sm">
                                    <div class="text-xs text-gray-500">可用數量</div>
                                    <div class="text-2xl font-bold text-gray-900">${item.availableQuantity}</div>
                                </div>
                                <div class="bg-gray-50 p-3 rounded shadow-sm">
                                    <div class="text-xs text-gray-500">成本單價</div>
                                    <div class="text-2xl font-bold text-gray-900">$${item.lastCost.toLocaleString()}</div>
                                </div>
                                <div class="bg-gray-50 p-3 rounded shadow-sm">
                                    <div class="text-xs text-gray-500">庫存金額</div>
                                    <div class="text-2xl font-bold text-gray-900">$${Math.round(item.totalCost).toLocaleString()}</div>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2 items-center mt-3 text-xs text-gray-500">
                                <span>來源訂單：${item.relatedOrders?.join(', ') || '無'}</span>
                                <span class="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">批次：${data.inventoryBatches.filter(b => b.inventoryId === item.id).length}</span>
                            </div>
                        </div>
                    `;
                }).join('');
                container.innerHTML = inventoryHtml;
            }

            const movementSection = document.createElement('div');
            movementSection.className = 'card p-5 border border-gray-200';
            if (!data.inventoryMovements || data.inventoryMovements.length === 0) {
                movementSection.innerHTML = '<div class="text-center text-gray-500 py-8">尚未產生庫存轉入異動。</div>';
            } else {
                const recentMoves = data.inventoryMovements.slice().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
                movementSection.innerHTML = `
                    <div class="mb-3 flex items-center justify-between">
                        <div>
                            <div class="text-lg font-bold text-gray-800">庫存轉入異動</div>
                            <div class="text-sm text-gray-500">最新 20 筆異動記錄</div>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full text-left text-sm text-gray-700">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="px-3 py-2">異動日期</th>
                                    <th class="px-3 py-2">來源訂單</th>
                                    <th class="px-3 py-2">產品</th>
                                    <th class="px-3 py-2">數量</th>
                                    <th class="px-3 py-2">單價</th>
                                    <th class="px-3 py-2">總價</th>
                                    <th class="px-3 py-2">稅別</th>
                                    <th class="px-3 py-2">類別</th>
                                    <th class="px-3 py-2">發票</th>
                                    <th class="px-3 py-2">備註</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentMoves.slice(0, 20).map(move => `
                                    <tr class="border-b border-gray-200">
                                        <td class="px-3 py-2">${move.createdAt ? new Date(move.createdAt).toLocaleString('zh-TW', { hour12: false }) : ''}</td>
                                        <td class="px-3 py-2">${move.orderId}</td>
                                        <td class="px-3 py-2">${move.productName || move.productId} ${move.spec || ''}</td>
                                        <td class="px-3 py-2">${move.quantity}</td>
                                        <td class="px-3 py-2">$${move.unitCost.toLocaleString()}</td>
                                        <td class="px-3 py-2">$${Math.round(move.totalCost).toLocaleString()}</td>
                                        <td class="px-3 py-2">${move.taxStatus || ''}</td>
                                        <td class="px-3 py-2">${move.type === 'outbound' ? '出貨' : '轉入'}</td>
                                        <td class="px-3 py-2">${move.invoiceType || (move.type === 'outbound' ? '無發票' : '')}</td>
                                        <td class="px-3 py-2">${move.note || ''}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            container.appendChild(movementSection);
        }

        function isOrderInventoryTransferable(order) {
            return order && !order.inventoryTransferred && (order.status === 'arrived' || order.status === 'completed' || order.status === 'closed');
        }

        function transferOrderToInventory(orderId) {
            const order = data.orders.find(o => o.id === orderId);
            if (!order) return showToast('找不到指定訂單', 'bg-red-500');
            if (!isOrderInventoryTransferable(order)) {
                return showToast('此訂單尚未完成或已轉入庫存，無法轉入。', 'bg-red-500');
            }

            // v11.9 新增：驗證訂單有項目
            if (!Array.isArray(order.items) || order.items.length === 0) {
                return showToast('訂單無明細項目，無法轉入庫存', 'bg-red-500');
            }

            if (!confirm(`確定要將訂單 ${order.id} 的庫存資料轉入庫存嗎？\n僅限已收貨 / 已驗收完成訂單。`)) return;

            order.items.forEach(item => {
                const product = data.products.find(p => p.id === item.productId);
                const supplierId = product?.supplierId || '';
                const supplierName = data.suppliers.find(s => s.id === supplierId)?.name || order.originalOrderNo || '未知供應商';
                const spec = product?.spec || item.spec || '';
                const unitCost = parseFloat(item.customPrice || 0);
                const quantity = parseInt(item.quantity || 0);
                if (quantity <= 0) return;

                let inventoryItem = data.inventory.find(inv => inv.productId === item.productId && inv.spec === spec && inv.supplierId === supplierId);
                if (inventoryItem) {
                    const existingQty = inventoryItem.quantity || 0;
                    const totalCost = (inventoryItem.averageCost || 0) * existingQty + unitCost * quantity;
                    inventoryItem.quantity = existingQty + quantity;
                    inventoryItem.availableQuantity = (inventoryItem.availableQuantity || 0) + quantity;
                    inventoryItem.lastCost = unitCost;
                    inventoryItem.averageCost = inventoryItem.quantity > 0 ? totalCost / inventoryItem.quantity : unitCost;
                    inventoryItem.totalCost = inventoryItem.quantity * inventoryItem.averageCost;
                    inventoryItem.lastUpdated = new Date().toISOString();
                    inventoryItem.relatedOrders = Array.from(new Set([...(inventoryItem.relatedOrders || []), order.id]));
                } else {
                    const newInventoryId = generateInventoryId();
                    inventoryItem = {
                        id: newInventoryId,
                        productId: item.productId,
                        sku: product?.sku || '',
                        productName: product?.prodName || '未知產品',
                        spec,
                        supplierId,
                        supplierName,
                        warehouse: '總倉',
                        unit: product?.unit || 'pcs',
                        quantity,
                        availableQuantity: quantity,
                        averageCost: unitCost,
                        lastCost: unitCost,
                        totalCost: quantity * unitCost,
                        status: quantity > 0 ? '正常' : '缺貨',
                        lastUpdated: new Date().toISOString(),
                        relatedOrders: [order.id]
                    };
                    data.inventory.push(inventoryItem);
                }

                createInventoryBatch({
                    inventoryId: inventoryItem.id,
                    orderId: order.id,
                    productId: item.productId,
                    productName: inventoryItem.productName,
                    spec,
                    supplierId,
                    supplierName,
                    quantity,
                    unitCost,
                    sourceDate: order.date || '',
                    arrivalDate: order.arrivalDate || '',
                    warehouse: inventoryItem.warehouse
                });

                data.inventoryMovements.push({
                    id: generateBatchId('mov'),
                    type: 'order-inbound',
                    orderId: order.id,
                    orderNo: order.id,
                    productId: item.productId,
                    productName: product?.prodName || '',
                    spec,
                    supplierId,
                    supplierName,
                    warehouse: '總倉',
                    batchNo: order.id,
                    quantity,
                    unitCost,
                    totalCost: unitCost * quantity,
                    sourceDate: order.date || '',
                    arrivalDate: order.arrivalDate || '',
                    note: `由歷史訂單轉入庫存`,
                    createdAt: new Date().toISOString()
                });
            });

            order.inventoryTransferred = true;
            order.inventoryTransferAt = new Date().toISOString();
            saveData();
            renderOrders();
            renderInventory();
            showToast('訂單已成功轉入庫存', 'bg-green-600');
        }

        function undoTransferOrderToInventory(orderId) {
            const order = data.orders.find(o => o.id === orderId);
            if (!order) return showToast('找不到指定訂單', 'bg-red-500');
            if (!order.inventoryTransferred) return showToast('此訂單尚未轉入庫存', 'bg-red-500');
            if (!confirm(`確定要撤銷訂單 ${order.id} 的整張轉入庫存操作嗎？`)) return;

            const inboundMoves = data.inventoryMovements.filter(move => move.type === 'order-inbound' && move.orderId === orderId);
            inboundMoves.forEach(move => {
                const inventoryItem = data.inventory.find(inv => 
                    inv.productId === move.productId &&
                    inv.spec === move.spec &&
                    inv.supplierId === move.supplierId &&
                    inv.warehouse === move.warehouse
                );
                if (!inventoryItem) return;

                inventoryItem.quantity = (inventoryItem.quantity || 0) - (move.quantity || 0);
                inventoryItem.availableQuantity = (inventoryItem.availableQuantity || 0) - (move.quantity || 0);
                if (inventoryItem.quantity <= 0) {
                    inventoryItem.quantity = 0;
                    inventoryItem.availableQuantity = 0;
                }
                inventoryItem.lastUpdated = new Date().toISOString();
                inventoryItem.totalCost = (inventoryItem.quantity || 0) * (inventoryItem.averageCost || 0);
                inventoryItem.relatedOrders = (inventoryItem.relatedOrders || []).filter(id => id !== orderId);
            });

            // 移除剩餘數量為 0 的庫存項目
            data.inventory = data.inventory.filter(inv => inv.quantity > 0);

            // 移除該訂單的轉入批次與異動記錄
            data.inventoryBatches = data.inventoryBatches.filter(batch => batch.orderId !== orderId);
            data.inventoryMovements = data.inventoryMovements.filter(move => !(move.type === 'order-inbound' && move.orderId === orderId));

            order.inventoryTransferred = false;
            order.inventoryTransferAt = '';

            saveData();
            renderOrders();
            renderInventory();
            showToast('已撤銷轉入，此訂單可重新轉入庫存', 'bg-green-600');
        }

        function getRocYearMonth(date = new Date()) {
            const year = date.getFullYear() - 1911;
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}${month}`;
        }

        function generateInventoryId() {
            const prefix = `inv_${getRocYearMonth()}`;
            const sameMonthIds = data.inventory
                .filter(item => item.id && item.id.startsWith(prefix))
                .map(item => parseInt(item.id.slice(prefix.length), 10))
                .filter(num => !isNaN(num));
            const nextSeq = String(Math.max(0, ...sameMonthIds) + 1).padStart(2, '0');
            return `${prefix}${nextSeq}`;
        }

        function generateBatchId(prefix = 'batch') {
            const head = `${prefix}_${getRocYearMonth()}`;
            const sameMonthIds = (prefix === 'mov' ? data.inventoryMovements : data.inventoryBatches)
                .filter(item => item.id && item.id.startsWith(head))
                .map(item => parseInt(item.id.slice(head.length), 10))
                .filter(num => !isNaN(num));
            const nextSeq = String(Math.max(0, ...sameMonthIds) + 1).padStart(2, '0');
            return `${head}${nextSeq}`;
        }

        function createInventoryBatch({inventoryId, orderId, productId, productName, spec, supplierId, supplierName, quantity, unitCost, sourceDate, arrivalDate, warehouse, taxStatus}) {
            const batch = {
                id: generateBatchId('batch'),
                inventoryId,
                batchNo: orderId || '',
                receivedDate: sourceDate || new Date().toISOString().split('T')[0],
                expiryDate: '',
                quantity,
                availableQuantity: quantity,
                cost: unitCost,
                taxStatus: taxStatus || '含稅',
                orderId,
                productId,
                productName,
                spec,
                supplierId,
                supplierName,
                warehouse: warehouse || '總倉',
                createdAt: new Date().toISOString()
            };
            data.inventoryBatches.push(batch);
            return batch;
        }

        function openInventoryBatches(inventoryId) {
            const item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');
            const content = document.getElementById('inventoryBatchModalContent');
            const batches = data.inventoryBatches.filter(batch => batch.inventoryId === inventoryId);
            let html = `<div class="text-sm text-gray-600 mb-4">${item.productName} (${item.id})</div>`;
            if (batches.length === 0) {
                html += '<div class="text-center text-gray-500 py-6">此庫存尚未建立批次資料。</div>';
            } else {
                html += `
                    <div class="overflow-x-auto max-h-64 overflow-y-auto">
                        <table class="min-w-full text-left text-sm text-gray-700">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="px-3 py-2">批次編號</th>
                                    <th class="px-3 py-2">來源訂單</th>
                                    <th class="px-3 py-2">數量</th>
                                    <th class="px-3 py-2">可用數</th>
                                    <th class="px-3 py-2">成本</th>
                                    <th class="px-3 py-2">到貨日</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${batches.map(batch => `
                                    <tr class="border-b border-gray-200">
                                        <td class="px-3 py-2">${batch.id}</td>
                                        <td class="px-3 py-2">${batch.orderId || '-'}</td>
                                        <td class="px-3 py-2">${batch.quantity}</td>
                                        <td class="px-3 py-2">${batch.availableQuantity}</td>
                                        <td class="px-3 py-2">$${batch.cost.toLocaleString()}</td>
                                        <td class="px-3 py-2">${batch.arrivalDate || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            content.innerHTML = html;
            document.getElementById('modal-inventory-batches').classList.add('modal-active');
        }

        function getInventoryActionId() {
            const input = document.getElementById('inventoryActionId');
            return input ? input.value.trim() : '';
        }

        function openInventoryBatchesByInput() {
            const inventoryId = getInventoryActionId();
            if (!inventoryId) return showToast('請先輸入庫存編號', 'bg-red-500');
            openInventoryBatches(inventoryId);
        }

        function openInventoryShippingModalByInput() {
            const inventoryId = getInventoryActionId();
            if (!inventoryId) return showToast('請先輸入庫存編號', 'bg-red-500');
            openInventoryShippingModal(inventoryId);
        }

        function openInventoryAdjustModalByInput() {
            const inventoryId = getInventoryActionId();
            if (!inventoryId) return showToast('請先輸入庫存編號', 'bg-red-500');
            openInventoryAdjustModal(inventoryId);
        }

        function openInventorySplitModalByInput() {
            const inventoryId = getInventoryActionId();
            if (!inventoryId) return showToast('請先輸入庫存編號', 'bg-red-500');
            openInventorySplitModal(inventoryId);
        }

        function openDeleteInventoryConfirmModalByInput() {
            const inventoryId = getInventoryActionId();
            if (!inventoryId) return showToast('請先輸入庫存編號', 'bg-red-500');
            openDeleteInventoryConfirmModal(inventoryId);
        }

        function openInventoryAdjustModal(inventoryId) {
            const item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');
            inventoryModalCurrentId = inventoryId;
            const form = document.getElementById('inventoryAdjustForm');
            if (form) form.inventoryId.value = inventoryId;
            document.getElementById('inventoryAdjustLabel').textContent = `${item.productName} (${item.id}) 現有庫存 ${item.quantity}`;
            document.getElementById('inventoryAdjustmentQty').value = '';
            document.getElementById('inventoryAdjustmentNote').value = '';
            document.getElementById('modal-inventory-adjust').classList.add('modal-active');
        }

        function applyInventoryAdjustment(event) {
            event.preventDefault();
            const form = event.target;
            const inventoryId = inventoryModalCurrentId || form.inventoryId.value;
            const delta = parseInt(form.adjustmentDelta.value, 10);
            const note = form.adjustmentNote.value.trim();
            if (!inventoryId) return showToast('缺少庫存編號', 'bg-red-500');
            if (isNaN(delta) || delta === 0) return showToast('請輸入非零調整數量', 'bg-red-500');
            const item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');
            const newQty = item.quantity + delta;
            const newAvailable = item.availableQuantity + delta;
            if (newQty < 0 || newAvailable < 0) return showToast('調整後庫存不可為負數', 'bg-red-500');
            item.quantity = newQty;
            item.availableQuantity = newAvailable;
            item.totalCost = item.quantity * item.averageCost;
            item.status = item.quantity > 0 ? item.status : '缺貨';
            item.lastUpdated = new Date().toISOString();
            data.inventoryMovements.push({
                id: generateBatchId('mov'),
                type: 'adjustment',
                orderId: '',
                orderNo: '',
                productId: item.productId,
                productName: item.productName,
                spec: item.spec,
                supplierId: item.supplierId,
                supplierName: item.supplierName,
                warehouse: item.warehouse,
                batchNo: '',
                quantity: delta,
                unitCost: item.lastCost,
                totalCost: item.lastCost * delta,
                sourceDate: '',
                arrivalDate: '',
                note: note || '盤點調整',
                createdAt: new Date().toISOString()
            });
            saveData();
            closeModal('modal-inventory-adjust');
            renderInventory();
            showToast('庫存調整已完成', 'bg-green-600');
        }

        function openInventorySplitModal(inventoryId) {
            const item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');
            inventoryModalCurrentId = inventoryId;
            const form = document.getElementById('inventorySplitForm');
            if (form) form.inventoryId.value = inventoryId;
            document.getElementById('inventorySplitLabel').textContent = `${item.productName} (${item.id}) 現有庫存 ${item.quantity}`;
            document.getElementById('inventorySplitFromQty').value = '';
            document.getElementById('inventorySplitToQty').value = '';
            document.getElementById('inventorySplitSpec').value = `${item.spec} 單件`;
            document.getElementById('inventorySplitTaxStatus').value = item.taxStatus || '含稅';
            document.getElementById('inventorySplitNote').value = '';
            document.getElementById('modal-inventory-split').classList.add('modal-active');
        }

        function applyInventorySplit(event) {
            event.preventDefault();
            const form = event.target;
            const inventoryId = inventoryModalCurrentId || form.inventoryId.value;
            const fromQty = parseInt(form.splitFromQty.value, 10);
            const toQty = parseInt(form.splitToQty.value, 10);
            const newSpec = form.splitNewSpec.value.trim();
            const note = form.splitNote.value.trim() || '拆分包裝';
            if (!inventoryId) return showToast('缺少庫存編號', 'bg-red-500');
            if (isNaN(fromQty) || fromQty <= 0 || isNaN(toQty) || toQty <= 0) return showToast('請輸入正確拆分數量', 'bg-red-500');
            const item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');
            if (fromQty > item.quantity) return showToast('拆分數量不得大於現有庫存', 'bg-red-500');
            const splitUnitCost = (item.averageCost * fromQty) / toQty;
            item.quantity -= fromQty;
            item.availableQuantity = Math.max(0, item.availableQuantity - fromQty);
            item.totalCost = item.quantity * item.averageCost;
            item.status = item.quantity > 0 ? item.status : '缺貨';
            item.lastUpdated = new Date().toISOString();

            const selectedTaxStatus = form.splitTaxStatus.value || item.taxStatus || '含稅';
            if (!item.taxStatus) item.taxStatus = selectedTaxStatus;
            const newInventoryId = generateInventoryId();
            const splitItem = {
                id: newInventoryId,
                productId: item.productId,
                sku: item.sku,
                productName: item.productName,
                spec: newSpec || `${item.spec} 單件`,
                supplierId: item.supplierId,
                supplierName: item.supplierName,
                warehouse: item.warehouse,
                unit: item.unit,
                quantity: toQty,
                availableQuantity: toQty,
                averageCost: splitUnitCost,
                lastCost: splitUnitCost,
                totalCost: splitUnitCost * toQty,
                taxStatus: selectedTaxStatus,
                status: toQty > 0 ? '正常' : '缺貨',
                lastUpdated: new Date().toISOString(),
                relatedOrders: [...(item.relatedOrders || [])]
            };
            data.inventory.push(splitItem);
            createInventoryBatch({
                inventoryId: splitItem.id,
                orderId: '',
                productId: splitItem.productId,
                productName: splitItem.productName,
                spec: splitItem.spec,
                supplierId: splitItem.supplierId,
                supplierName: splitItem.supplierName,
                quantity: splitItem.quantity,
                unitCost: splitItem.lastCost,
                taxStatus: splitItem.taxStatus,
                sourceDate: '',
                arrivalDate: '',
                warehouse: splitItem.warehouse
            });
            data.inventoryMovements.push({
                id: generateBatchId('mov'),
                type: 'split',
                orderId: '',
                orderNo: '',
                productId: splitItem.productId,
                productName: splitItem.productName,
                spec: splitItem.spec,
                supplierId: splitItem.supplierId,
                supplierName: splitItem.supplierName,
                warehouse: splitItem.warehouse,
                batchNo: splitItem.id,
                quantity: toQty,
                unitCost: splitItem.lastCost,
                totalCost: splitItem.lastCost * toQty,
                taxStatus: splitItem.taxStatus,
                sourceDate: '',
                arrivalDate: '',
                note: `${note}：${item.id} 拆分為 ${splitItem.id}`,
                createdAt: new Date().toISOString()
            });
            saveData();
            closeModal('modal-inventory-split');
            renderInventory();
            showToast('拆分包裝已完成', 'bg-green-600');
        }

        // 打開刪除庫存確認 Modal
        function openDeleteInventoryConfirmModal(inventoryId) {
            const item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');
            
            document.getElementById('deleteInventoryConfirmId').value = inventoryId;
            document.getElementById('deleteInventoryConfirmLabel').textContent = `刪除庫存：${item.productName} (${item.spec || '無規格'})`;
            document.getElementById('deleteInventoryConfirmInput').value = '';
            document.getElementById('deleteInventoryConfirmExpectedId').textContent = item.id;
            document.getElementById('modal-delete-inventory-confirm').classList.add('modal-active');
        }

        function confirmDeleteInventoryItem() {
            const inventoryId = document.getElementById('deleteInventoryConfirmId').value;
            const inputValue = document.getElementById('deleteInventoryConfirmInput').value.trim();
            const expectedId = document.getElementById('deleteInventoryConfirmExpectedId').textContent;
            
            if (inputValue !== expectedId) {
                return showToast(`庫存編號不符。請輸入：${expectedId}`, 'bg-red-500');
            }
            
            closeModal('modal-delete-inventory-confirm');
            deleteInventoryItem(inventoryId);
        }

        // 刪除庫存項目
        function deleteInventoryItem(inventoryId) {
            const item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');

            // 刪除庫存項目
            data.inventory = data.inventory.filter(inv => inv.id !== inventoryId);

            // 刪除相關批次記錄
            data.inventoryBatches = data.inventoryBatches.filter(batch => batch.inventoryId !== inventoryId);

            // 找出此庫存刪除時影響的歷史訂單
            const affectedOrderIds = new Set();
            data.inventoryMovements.forEach(mov => {
                if (mov.type === 'order-inbound' && mov.orderId) {
                    if (
                        mov.batchNo === inventoryId ||
                        (mov.note && mov.note.includes(inventoryId)) ||
                        (mov.productId === item.productId && item.relatedOrders && item.relatedOrders.includes(mov.orderId))
                    ) {
                        affectedOrderIds.add(mov.orderId);
                    }
                }
            });

            // 刪除相關異動記錄
            data.inventoryMovements = data.inventoryMovements.filter(mov => 
                mov.batchNo === inventoryId || 
                (mov.note && mov.note.includes(inventoryId)) ||
                (mov.productId === item.productId && mov.type === 'order-inbound' && item.relatedOrders && item.relatedOrders.includes(mov.orderId))
            );

            // 若該訂單已無剩餘轉入記錄，恢復可轉入狀態
            affectedOrderIds.forEach(orderId => {
                const order = data.orders.find(o => o.id === orderId);
                if (!order) return;
                const hasRemainingInbound = data.inventoryMovements.some(mov => mov.type === 'order-inbound' && mov.orderId === orderId);
                if (!hasRemainingInbound) {
                    order.inventoryTransferred = false;
                    order.inventoryTransferAt = '';
                }
            });

            saveData();
            renderInventory();
            renderOrders();
            showToast(`庫存項目「${item.productName}」已刪除`, 'bg-green-600');
        }

        function getRocYearMonthDay(date = new Date()) {
            const year = date.getFullYear() - 1911;
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}${month}${day}`;
        }

        function generateOutboundId() {
            const prefix = `out_${getRocYearMonthDay()}`;
            const sameDayIds = data.inventoryMovements
                .filter(item => item.id && item.id.startsWith(prefix))
                .map(item => parseInt(item.id.slice(prefix.length), 10))
                .filter(num => !isNaN(num));
            const nextSeq = String(Math.max(0, ...sameDayIds) + 1).padStart(2, '0');
            return `${prefix}${nextSeq}`;
        }

        function openInventoryShippingModal(inventoryId) {
            const item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');
            document.querySelector('#inventoryShipmentForm input[name="inventoryId"]').value = item.id;
            document.querySelector('#inventoryShipmentForm input[name="outboundId"]').value = '';
            document.getElementById('inventoryShipmentLabel').textContent = `出貨：${item.productName || item.productId} (${item.spec || '無規格'})`;
            document.getElementById('inventoryShipmentAvailable').value = item.availableQuantity || 0;
            document.getElementById('inventoryShipmentQty').value = 1;
            document.getElementById('inventoryShipmentPrice').value = item.lastCost || 0;
            document.getElementById('inventoryShipmentInvoice').value = '無發票';
            document.getElementById('inventoryShipmentInvoiceNo').value = '';
            document.getElementById('inventoryShipmentInvoiceDate').value = '';
            document.getElementById('inventoryShipmentNote').value = '';
            document.getElementById('modal-inventory-shipment').classList.add('modal-active');
        }

        function restoreOutboundQuantity(move) {
            if (!move || !move.inventoryId) return;
            let item = data.inventory.find(inv => inv.id === move.inventoryId);
            if (!item) {
                item = {
                    id: move.inventoryId,
                    productId: move.productId,
                    sku: move.sku || '',
                    productName: move.productName || '',
                    spec: move.spec || '',
                    supplierId: move.supplierId || '',
                    supplierName: move.supplierName || '',
                    warehouse: move.warehouse || '總倉',
                    unit: move.unit || 'pcs',
                    quantity: 0,
                    availableQuantity: 0,
                    averageCost: move.unitCost || 0,
                    lastCost: move.unitCost || 0,
                    totalCost: 0,
                    status: '缺貨',
                    lastUpdated: new Date().toISOString(),
                    relatedOrders: []
                };
                data.inventory.push(item);
            }
            item.quantity = (item.quantity || 0) + (move.quantity || 0);
            item.availableQuantity = (item.availableQuantity || 0) + (move.quantity || 0);
            item.status = item.quantity > 0 ? '正常' : '缺貨';
            item.totalCost = item.quantity * (item.averageCost || 0);
            item.lastUpdated = new Date().toISOString();
        }

        function openEditShippingModal(shippingId) {
            const move = data.inventoryMovements.find(m => m.id === shippingId && m.type === 'outbound');
            if (!move) return showToast('找不到出貨記錄', 'bg-red-500');
            const item = data.inventory.find(inv => inv.id === move.inventoryId);
            if (!item) return showToast('找不到對應庫存項目', 'bg-red-500');
            document.querySelector('#inventoryShipmentForm input[name="inventoryId"]').value = item.id;
            document.querySelector('#inventoryShipmentForm input[name="outboundId"]').value = move.id;
            document.getElementById('inventoryShipmentLabel').textContent = `修改出貨：${item.productName || item.productId} (${item.spec || '無規格'})`;
            document.getElementById('inventoryShipmentAvailable').value = (item.availableQuantity || 0) + move.quantity;
            document.getElementById('inventoryShipmentQty').value = move.quantity;
            document.getElementById('inventoryShipmentPrice').value = move.unitCost || 0;
            document.getElementById('inventoryShipmentInvoice').value = move.invoiceType || '無發票';
            document.getElementById('inventoryShipmentInvoiceNo').value = move.invoiceNo || '';
            document.getElementById('inventoryShipmentInvoiceDate').value = move.invoiceDate || '';
            document.getElementById('inventoryShipmentNote').value = move.note || '';
            document.getElementById('modal-inventory-shipment').classList.add('modal-active');
        }

        function applyInventoryShipment(event) {
            event.preventDefault();
            const inventoryId = document.querySelector('#inventoryShipmentForm input[name="inventoryId"]').value;
            const qty = parseInt(document.getElementById('inventoryShipmentQty').value, 10) || 0;
            const price = parseFloat(document.getElementById('inventoryShipmentPrice').value) || 0;
            const invoiceType = document.getElementById('inventoryShipmentInvoice').value || '無發票';
            const invoiceNo = document.getElementById('inventoryShipmentInvoiceNo').value || '';
            const invoiceDate = document.getElementById('inventoryShipmentInvoiceDate').value || '';
            const note = document.getElementById('inventoryShipmentNote').value || '';

            const outboundId = document.querySelector('#inventoryShipmentForm input[name="outboundId"]').value;
            let item = data.inventory.find(inv => inv.id === inventoryId);
            if (!item) return showToast('找不到庫存項目', 'bg-red-500');
            if (qty <= 0) return showToast('出貨數量須大於 0', 'bg-red-500');

            if (outboundId) {
                const move = data.inventoryMovements.find(m => m.id === outboundId && m.type === 'outbound');
                if (!move) return showToast('找不到出貨記錄', 'bg-red-500');
                restoreOutboundQuantity(move);
                item = data.inventory.find(inv => inv.id === inventoryId);
                const availableAfterRestore = item ? item.availableQuantity || 0 : 0;
                if (qty > availableAfterRestore) return showToast('出貨數量超過可用庫存', 'bg-red-500');
                item.quantity = (item.quantity || 0) - qty;
                item.availableQuantity = availableAfterRestore - qty;
                if (item.quantity <= 0) {
                    item.quantity = 0;
                    item.availableQuantity = 0;
                    item.status = '缺貨';
                }
                item.totalCost = item.quantity * (item.averageCost || 0);
                item.lastUpdated = new Date().toISOString();
                move.inventoryId = item.id;
                move.productId = item.productId;
                move.productName = item.productName;
                move.spec = item.spec;
                move.supplierId = item.supplierId;
                move.supplierName = item.supplierName;
                move.warehouse = item.warehouse;
                move.quantity = qty;
                move.unitCost = price;
                move.totalCost = price * qty;
                move.invoiceType = invoiceType;
                move.invoiceNo = invoiceNo;
                move.invoiceDate = invoiceDate;
                move.note = note;
                move.createdAt = move.createdAt || new Date().toISOString();
                saveData();
                closeModal('modal-inventory-shipment');
                renderInventory();
                renderShipping();
                showToast('出貨記錄已修改', 'bg-green-600');
                return;
            }

            const available = item.availableQuantity || 0;
            if (qty > available) return showToast('出貨數量超過可用庫存', 'bg-red-500');

            item.quantity = (item.quantity || 0) - qty;
            item.availableQuantity = available - qty;
            if (item.quantity <= 0) {
                item.quantity = 0;
                item.availableQuantity = 0;
                item.status = '缺貨';
            }
            item.totalCost = item.quantity * (item.averageCost || 0);
            item.lastUpdated = new Date().toISOString();

            data.inventoryMovements.push({
                id: generateOutboundId(),
                type: 'outbound',
                inventoryId: item.id,
                orderId: '',
                orderNo: '',
                productId: item.productId,
                productName: item.productName,
                spec: item.spec,
                supplierId: item.supplierId,
                supplierName: item.supplierName,
                warehouse: item.warehouse,
                batchNo: '',
                quantity: qty,
                unitCost: price,
                totalCost: price * qty,
                sourceDate: new Date().toISOString().split('T')[0],
                arrivalDate: '',
                invoiceType,
                invoiceNo,
                invoiceDate,
                note,
                createdAt: new Date().toISOString()
            });

            saveData();
            closeModal('modal-inventory-shipment');
            renderInventory();
            renderShipping();
            showToast('出貨紀錄已保存，庫存已扣減', 'bg-green-600');
        }

        function deleteShippingRecord(shippingId) {
            const moveIndex = data.inventoryMovements.findIndex(m => m.id === shippingId && m.type === 'outbound');
            if (moveIndex === -1) return showToast('找不到出貨記錄', 'bg-red-500');
            if (!confirm('確定要刪除此出貨紀錄嗎？刪除後會回補對應庫存。')) return;
            const move = data.inventoryMovements[moveIndex];
            const item = data.inventory.find(inv => inv.id === move.inventoryId);
            if (item) {
                item.quantity = (item.quantity || 0) + move.quantity;
                item.availableQuantity = (item.availableQuantity || 0) + move.quantity;
                item.status = item.quantity > 0 ? '正常' : item.status;
                item.totalCost = item.quantity * (item.averageCost || 0);
                item.lastUpdated = new Date().toISOString();
            } else {
                data.inventory.push({
                    id: move.inventoryId,
                    productId: move.productId,
                    sku: move.sku || '',
                    productName: move.productName || '',
                    spec: move.spec || '',
                    supplierId: move.supplierId || '',
                    supplierName: move.supplierName || '',
                    warehouse: move.warehouse || '總倉',
                    unit: 'pcs',
                    quantity: move.quantity,
                    availableQuantity: move.quantity,
                    averageCost: move.unitCost || 0,
                    lastCost: move.unitCost || 0,
                    totalCost: (move.quantity || 0) * (move.unitCost || 0),
                    status: move.quantity > 0 ? '正常' : '缺貨',
                    lastUpdated: new Date().toISOString(),
                    relatedOrders: []
                });
            }
            data.inventoryMovements.splice(moveIndex, 1);
            saveData();
            renderInventory();
            renderShipping();
            showToast('出貨紀錄已刪除，庫存已回補', 'bg-green-600');
        }

        function renderShipping() {
            const container = document.getElementById('shippingList');
            if (!container) return;
            const keyword = (document.getElementById('searchShippingKeyword')?.value || '').toLowerCase();
            const startDateStr = document.getElementById('filterShippingStartDate')?.value || '';
            const endDateStr = document.getElementById('filterShippingEndDate')?.value || '';
            
            const startDate = startDateStr ? new Date(startDateStr) : null;
            const endDate = endDateStr ? new Date(endDateStr) : null;

            const shippingItems = data.inventoryMovements.filter(move => move.type === 'outbound');
            const filtered = shippingItems.filter(move => {
                // 關鍵字篩選
                if (keyword && ![move.inventoryId, move.orderId, move.productId, move.productName, move.spec, move.note]
                    .some(field => field && field.toLowerCase().includes(keyword))) {
                    return false;
                }
                
                // 日期範圍篩選
                if (startDate || endDate) {
                    const moveDate = new Date(move.createdAt);
                    if (startDate && moveDate < startDate) return false;
                    if (endDate) {
                        const endDayEnd = new Date(endDate);
                        endDayEnd.setHours(23, 59, 59, 999);
                        if (moveDate > endDayEnd) return false;
                    }
                }
                
                return true;
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500 py-10 bg-white rounded">目前沒有出貨記錄。</div>';
                return;
            }

            const html = filtered.map(move => `
                <div class="card p-5 border-l-4 border-red-500">
                    <div class="flex flex-col md:flex-row justify-between gap-4 mb-3">
                        <div>
                            <div class="text-sm text-gray-500">出貨編號：${move.id}</div>
                            <div class="text-lg font-bold text-gray-800">${move.productName || move.productId}</div>
                            <div class="text-sm text-gray-500">庫存編號：${move.inventoryId || '-'} / 規格：${move.spec || '無'} / 供應商：${move.supplierName || '未知'}</div>
                        </div>
                        <div class="text-right text-sm text-gray-600">
                            <div>出貨日期：${move.createdAt ? new Date(move.createdAt).toLocaleString('zh-TW', { hour12: false }) : '-'}</div>
                            <div>發票：${move.invoiceType || '無發票'}</div>
                            ${move.invoiceNo ? `<div class="text-blue-600 font-semibold">發票號碼：${move.invoiceNo}</div>` : ''}
                            ${move.invoiceDate ? `<div class="text-blue-600">發票日期：${move.invoiceDate}</div>` : ''}
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                        <div class="bg-gray-50 p-3 rounded shadow-sm">
                            <div class="text-xs text-gray-500">出貨數量</div>
                            <div class="text-2xl font-bold text-gray-900">${move.quantity}</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded shadow-sm">
                            <div class="text-xs text-gray-500">售出單價</div>
                            <div class="text-2xl font-bold text-gray-900">$${move.unitCost.toLocaleString()}</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded shadow-sm">
                            <div class="text-xs text-gray-500">總售價</div>
                            <div class="text-2xl font-bold text-gray-900">$${Math.round(move.totalCost).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-gray-500">備註：${move.note || '無'}</div>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <button type="button" onclick="openEditShippingModal('${move.id}')" class="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">修改</button>
                        <button type="button" onclick="deleteShippingRecord('${move.id}')" class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">刪除</button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = html;
        }

        function exportOutboundRecords() {
            const outboundRecords = data.inventoryMovements.filter(move => move.type === 'outbound');
            const exportData = [];
            const sheetName = '出貨記錄';
            exportData.push(["出貨編號", "出貨日期", "庫存編號", "來源訂單", "產品編號", "產品名稱", "規格", "供應商", "數量", "售出單價", "總售價", "發票狀態", "發票號碼", "發票日期", "備註"]);
            outboundRecords.forEach(move => {
                exportData.push([
                    move.id,
                    move.createdAt || '',
                    move.inventoryId || '',
                    move.orderId || '',
                    move.productId || '',
                    move.productName || '',
                    move.spec || '',
                    move.supplierName || '',
                    move.quantity,
                    move.unitCost,
                    move.totalCost,
                    move.invoiceType || '無發票',
                    move.invoiceNo || '',
                    move.invoiceDate || '',
                    move.note || ''
                ]);
            });
            const fileName = `出貨記錄_${getTodayStr()}.xlsx`;
            saveAsExcel(exportData, sheetName, fileName);
            showToast('匯出成功', 'bg-green-600');
        }
