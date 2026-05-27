        // ================= 購物車與訂單邏輯 (v10.0 核心修改) =================

        function addToCart(productId) {
            if (!Array.isArray(data.products)) data.products = [];
            const product = data.products.find(p => p.id === productId);
            if (!product) {
                showToast('找不到該產品，請重新整理後再試。', 'bg-red-500');
                return;
            }
            
            if (!Array.isArray(data.cart)) data.cart = [];
            
            const existing = data.cart.find(item => item.productId === productId);
            if (existing) {
                existing.quantity += 1;
            } else {
                data.cart.push({
                    productId: productId,
                    quantity: 1,
                    customPrice: product.price, 
                    customShipping: product.shipping,
                    customNote: '',
                    taxStatus: product.isTaxIncl || '含稅' 
                });
            }
            saveData();
            updateCartCount();
            showToast('已加入採購單', 'bg-blue-500');
            // 如果目前已在採購頁面，立即更新列表
            if (document.getElementById('page-purchase') && !document.getElementById('page-purchase').classList.contains('hidden')) {
                renderCart();
            }
        }

        function updateCartCount() {
            const badge = document.getElementById('cartCount');
            const count = data.cart?.length || 0;
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        }

        function renderCart() {
            const container = document.getElementById('cartList');
            container.innerHTML = '';
            
            selectedCartItems = new Set([...selectedCartItems].filter(pid => data.cart.some(item => item.productId === pid)));

            if (!data.cart || data.cart.length === 0) {
                container.innerHTML = '<tr><td colspan="9" class="p-8 text-center text-gray-400">清單目前為空</td></tr>';
                recalcCartSummary();
                updateCartCount();
                return;
            }

            data.cart.forEach((item, index) => {
                const p = data.products.find(prod => prod.id === item.productId);
                if (!p) { return; }
                const supplier = data.suppliers.find(s => s.id === p.supplierId);
                
                const unitPrice = item.customPrice !== undefined ? item.customPrice : p.price;
                const shipFee = item.customShipping !== undefined ? item.customShipping : p.shipping;
                const qty = item.quantity || 1;
                const taxStatus = item.taxStatus || '含稅'; 

                // 單行小計顯示 (僅供參考)
                // v11.3 預覽邏輯：若為「不含稅」，運費與產品總和後再加5%
                let rowBase = (unitPrice * qty) + shipFee;
                let rowTotal = rowBase;
                if (taxStatus === '不含稅') rowTotal = rowBase * 1.05;

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-blue-50 transition-colors';
                const isChecked = selectedCartItems.has(item.productId) ? 'checked' : '';

                tr.innerHTML = `
                    <td class="p-3 text-center">
                        <input type="checkbox" class="cart-checkbox w-4 h-4" value="${item.productId}" ${isChecked} onchange="toggleCartItemSelection(this)">
                    </td>
                    <td class="p-3">
                        <div class="font-bold text-gray-800">${p.prodName}</div>
                        <div class="text-xs text-gray-500">${supplier?.name || '未知'}</div>
                        <div class="text-xs bg-gray-200 inline-block px-1 rounded mt-1">交期: ${p.deliveryTime || '未定'}</div>
                        ${p.spec ? `<div class="text-xs text-gray-600 bg-blue-50 inline-block px-2 py-1 rounded mt-1 ml-1"><strong>規格:</strong> ${p.spec}</div>` : ''}
                    </td>
                    <td class="p-3">
                        <div class="flex items-center">
                            <span class="text-gray-400 mr-1">$</span>
                            <input type="number" step="0.01" value="${unitPrice}" 
                                class="w-24 p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-right font-mono"
                                onchange="updateCartItem(${index}, 'price', this.value)">
                        </div>
                        <div class="text-xs text-gray-400 mt-1">原價: $${p.price}</div>
                    </td>
                    <td class="p-3">
                        <input type="number" value="${qty}" min="1" 
                            class="w-16 p-1 border border-gray-300 rounded text-center"
                            onchange="updateCartItem(${index}, 'qty', this.value)">
                    </td>
                    <td class="p-3">
                        <select class="p-1 border border-gray-300 rounded text-xs w-full" 
                                onchange="updateCartItem(${index}, 'taxStatus', this.value)">
                            <option value="含稅" ${taxStatus === '含稅' ? 'selected' : ''}>含稅</option>
                            <option value="不含稅" ${taxStatus === '不含稅' ? 'selected' : ''}>未稅 (+5%)</option>
                            <option value="不計稅" ${taxStatus === '不計稅' ? 'selected' : ''}>不計稅 (收據)</option>
                        </select>
                    </td>
                    <td class="p-3">
                         <div class="flex items-center">
                            <span class="text-gray-400 mr-1">$</span>
                            <input type="number" step="0.01" value="${shipFee}" 
                                class="w-20 p-1 border border-gray-300 rounded text-right"
                                onchange="updateCartItem(${index}, 'shipping', this.value)">
                        </div>
                    </td>
                    <td class="p-3">
                        <input type="text" value="${item.customNote || ''}" placeholder="填寫備註..."
                            class="w-full p-1 border border-gray-300 rounded text-sm"
                            onchange="updateCartItem(${index}, 'note', this.value)">
                    </td>
                    <td class="p-3 font-mono text-blue-700 font-bold text-right">
                        $${Math.round(rowTotal).toLocaleString()}
                        ${taxStatus === '不含稅' ? '<div class="text-[10px] text-red-500">(含稅額)</div>' : ''}
                        ${taxStatus === '不計稅' ? '<div class="text-[10px] text-gray-400">(無稅額)</div>' : ''}
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex flex-col gap-2 items-center">
                            <button onclick="confirmOrder(${index})" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 w-full font-bold">單獨下單</button>
                            <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition text-xs flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg> 移除
                            </button>
                        </div>
                    </td>
                `;
                container.appendChild(tr);
            });

            recalcCartSummary();
            updateCartCount();
        }

        // v11.3 更新: 採購清單稅務計算邏輯同步更新
        function recalcCartSummary() {
            let totalNet = 0; // 暫不嚴格區分，但總額需正確
            let totalTax = 0;
            let grandTotal = 0;
            let shippingTotal = 0;

            selectedCartItems.forEach(productId => {
                const item = data.cart.find(cartItem => cartItem.productId === productId);
                if (!item) return;

                const price = parseFloat(item.customPrice) || 0;
                const qty = parseInt(item.quantity) || 1;
                const shipping = parseFloat(item.customShipping) || 0;
                const taxStatus = item.taxStatus || '含稅';

                const itemSubtotal = price * qty;
                const itemAndShip = itemSubtotal + shipping;
                
                shippingTotal += shipping;

                let itemTax = 0;
                if (taxStatus === '不含稅') {
                    // 外加稅 (產品+運費)*5%
                    itemTax = itemAndShip * 0.05;
                    totalTax += itemTax;
                    grandTotal += (itemAndShip + itemTax);
                } else if (taxStatus === '含稅') {
                    // 內含稅
                    itemTax = itemAndShip - (itemAndShip / 1.05);
                    totalTax += itemTax;
                    grandTotal += itemAndShip;
                } else {
                    // 不計稅
                    grandTotal += itemAndShip;
                }
            });

            // 這裡的 Subtotal 顯示已勾選品項基本金額 (淨額)
            document.getElementById('selectedCount').textContent = selectedCartItems.size;

            // 計算小計（扣掉外加稅）
            let subtotal = 0;
            selectedCartItems.forEach(productId => {
                const item = data.cart.find(cartItem => cartItem.productId === productId);
                if (!item) return;
                const price = parseFloat(item.customPrice) || 0;
                const qty = parseInt(item.quantity) || 1;
                const shipping = parseFloat(item.customShipping) || 0;
                const taxStatus = item.taxStatus || '含稅';

                const itemBase = price * qty + shipping;
                if (taxStatus === '含稅') {
                    subtotal += itemBase / 1.05;
                } else {
                    subtotal += itemBase;
                }
            });

            document.getElementById('cartSubtotal').textContent = Math.round(subtotal).toLocaleString();
            document.getElementById('cartTax').textContent = Math.round(totalTax).toLocaleString();
            document.getElementById('cartShipping').textContent = Math.round(shippingTotal).toLocaleString();
            document.getElementById('cartTotal').textContent = Math.round(grandTotal).toLocaleString();
        }

        function toggleSelectAllCart(source) {
            const checkboxes = document.querySelectorAll('.cart-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = source.checked;
                toggleCartItemSelection(cb, false); // false = 不要每次都重繪，最後再一次
            });
            recalcCartSummary();
        }

        function toggleCartItemSelection(checkbox, triggerRecalc = true) {
            const productId = checkbox.value;
            if (checkbox.checked) {
                selectedCartItems.add(productId);
            } else {
                selectedCartItems.delete(productId);
            }
            if (triggerRecalc) recalcCartSummary();
        }

        function updateCartItem(index, type, value) {
            if (type === 'price') {
                data.cart[index].customPrice = parseFloat(value) || 0;
            } else if (type === 'qty') {
                data.cart[index].quantity = parseInt(value) || 1;
            } else if (type === 'shipping') {
                data.cart[index].customShipping = parseFloat(value) || 0;
            } else if (type === 'note') {
                data.cart[index].customNote = value;
            } else if (type === 'taxStatus') {
                data.cart[index].taxStatus = value; 
            }
            saveData();
            renderCart(); 
        }

        function removeFromCart(index) {
            data.cart.splice(index, 1);
            selectedCartItems.clear();
            document.getElementById('selectAllCart').checked = false;
            saveData();
            renderCart();
        }

        function clearCart() {
            if (confirm('確定要清空採購清單嗎？')) {
                data.cart = [];
                selectedCartItems.clear();
                saveData();
                renderCart();
            }
        }

        function confirmOrder(specificIndex = null) {
            let itemsToOrder = [];
            let indicesToRemove = [];

            if (specificIndex !== null) {
                if (!confirm('確定要針對此單一品項建立訂單嗎？')) return;
                itemsToOrder.push(data.cart[specificIndex]);
                indicesToRemove.push(specificIndex);
            } else {
                if (selectedCartItems.size === 0) {
                    return showToast('請先勾選要下單的項目，或使用「單獨下單」按鈕', 'bg-red-500');
                }
                
                if (!confirm(`確定要將已選取的 ${selectedCartItems.size} 筆項目建立為正式訂單嗎？`)) return;

                const selectedProductIds = Array.from(selectedCartItems);
                selectedProductIds.forEach(productId => {
                    const idx = data.cart.findIndex(item => item.productId === productId);
                    if (idx !== -1) {
                        itemsToOrder.push(data.cart[idx]);
                        indicesToRemove.push(idx);
                    }
                });
            }

            // v11.1: 初始化訂單 status 改為 'ordered' (原 pending)
            // v11.3: 新增 paymentDate
            // v11.9: 新增 inventoryTransferred 和 inventoryTransferAt 屬性
            const newOrder = {
                id: generateOrderID(),
                createdAt: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
                status: 'ordered', // v11.1 default
                paymentStatus: 'unpaid', 
                paymentDate: '', // v11.3 新增
                invoiceNumber: '',
                supplierInvoiceDate: '',
                originalOrderNo: '',
                quotationNo: '', // v11.0 新增
                logisticsProvider: '',
                trackingNumber: '',
                shipDate: '',
                arrivalDate: '',
                orderNote: '',
                discount: 0,
                inventoryTransferred: false, // v11.9 新增：庫存轉入標記
                inventoryTransferAt: '', // v11.9 新增：轉入時間
                items: JSON.parse(JSON.stringify(itemsToOrder))
            };

            if (!data.orders) data.orders = [];
            data.orders.unshift(newOrder);

            indicesToRemove.sort((a, b) => b - a);
            indicesToRemove.forEach(idx => {
                data.cart.splice(idx, 1);
            });
            
            selectedCartItems.clear();
            document.getElementById('selectAllCart').checked = false;

            saveData();
            // 確保 UI 的購物車計數與小計會被即時更新
            updateCartCount();
            recalcCartSummary();
            renderCart();
            switchTab('orders');
            showToast('訂單建立成功！', 'bg-green-600');
        }

        // ================= 計算預計到貨日 =================
        function populateOrderDateFilters() {
            const yearSelect = document.getElementById('filterOrderYear');
            if (!yearSelect) return;
            const currentYear = yearSelect.value || 'all';
            const years = Array.from(new Set((data.orders || []).map(order => {
                if (!order.date) return null;
                return order.date.split('-')[0];
            }).filter(Boolean))).sort((a, b) => parseInt(b) - parseInt(a));

            yearSelect.innerHTML = '<option value="all">全部年份</option>' + years.map(year => `
                <option value="${year}">${year}</option>`).join('');
            if (years.includes(currentYear)) {
                yearSelect.value = currentYear;
            }
        }

        function renderOrders() {
            if (!Array.isArray(data.orders)) data.orders = [];
            const container = document.getElementById('orderList');
            if (!container) return;
            container.innerHTML = '';

            populateOrderDateFilters();
            const keyword = (document.getElementById('searchOrderKeyword')?.value || '').toLowerCase();
            const statusFilter = document.getElementById('filterOrderStatus')?.value || 'all';
            const paymentFilter = document.getElementById('filterPaymentStatus')?.value || 'all';
            const yearFilter = document.getElementById('filterOrderYear')?.value || 'all';
            const monthFilter = document.getElementById('filterOrderMonth')?.value || 'all';

            if (!data.orders || data.orders.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500 py-10 bg-white rounded">目前沒有歷史訂單。</div>';
                return;
            }

            const filteredOrders = data.orders.filter(order => {
                // v11.1 兼容舊資料: 將舊 pending 對應到 ordered
                let currentStatus = order.status;
                if(currentStatus === 'pending') currentStatus = 'ordered';
                if(!currentStatus) currentStatus = 'ordered'; // 舊資料沒有 status 預設為 ordered

                if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;
                
                // 付款狀態篩選邏輯 (v11.10 修正: 支持 purchaseSnapshot 中的舊資料付款狀態)
                let payStatus = order.paymentStatus;
                
                // 優先檢查 purchaseSnapshot 中的付款狀態
                if (!payStatus && order.purchaseSnapshot) {
                    try {
                        const snapshot = order.purchaseSnapshot;
                        if (typeof snapshot === 'object' && snapshot.paymentStatus) {
                            // 映射舊資料的付款狀態到新系統
                            const oldPaymentStatus = snapshot.paymentStatus;
                            if (oldPaymentStatus === '已付款') {
                                payStatus = 'paid'; // 映射到新系統的 'paid'
                            } else if (oldPaymentStatus === '未付款') {
                                payStatus = 'unpaid';
                            } else if (oldPaymentStatus === '月結') {
                                payStatus = 'monthly';
                            } else {
                                payStatus = oldPaymentStatus;
                            }
                        }
                    } catch (e) {
                        // purchaseSnapshot 解析失敗，繼續
                    }
                }
                
                // 舊資料識別: 有 supplier 和 productName 欄位表示是舊格式訂單
                if (!payStatus && order.supplier && order.productName) {
                    payStatus = 'unpaid'; // 無付款記錄的舊訂單預設為未付款
                }
                payStatus = payStatus || 'unpaid'; // 最終預設值
                if (paymentFilter !== 'all' && payStatus !== paymentFilter) return false;

                if (yearFilter !== 'all' || monthFilter !== 'all') {
                    if (!order.date) {
                        // 舊資料沒有 date，跳過篩選
                        if (yearFilter !== 'all' || monthFilter !== 'all') return false;
                    } else {
                        const [orderYear, orderMonth] = order.date.split('-');
                        if (yearFilter !== 'all' && orderYear !== yearFilter) return false;
                        if (monthFilter !== 'all' && orderMonth !== monthFilter) return false;
                    }
                }

                if (keyword) {
                    const idMatch = order.id.toLowerCase().includes(keyword);
                    const invoiceMatch = (order.invoiceNumber || '').toLowerCase().includes(keyword);
                    const originalOrderMatch = (order.originalOrderNo || '').toLowerCase().includes(keyword);
                    // v11.0: 增加搜尋報價單號
                    const quoteMatch = (order.quotationNo || '').toLowerCase().includes(keyword);
                    
                    // v11.9 修正: 兼容舊資料格式 (無 items 陣列)
                    let itemsMatch = false;
                    if (Array.isArray(order.items)) {
                        itemsMatch = order.items.some(item => {
                            const p = data.products.find(prod => prod.id === item.productId);
                            const prodName = p ? p.prodName.toLowerCase() : '';
                            const supplier = p ? (data.suppliers.find(s => s.id === p.supplierId)?.name || '') : '';
                            return prodName.includes(keyword) || supplier.toLowerCase().includes(keyword);
                        });
                    } else if (order.supplier && order.productName) {
                        // 舊資料格式搜尋
                        itemsMatch = order.supplier.toLowerCase().includes(keyword) || 
                                   order.productName.toLowerCase().includes(keyword);
                    }
                    return idMatch || invoiceMatch || originalOrderMatch || quoteMatch || itemsMatch;
                }
                return true;
            });

            if (filteredOrders.length === 0) {
                container.innerHTML = `<div class="text-center text-gray-500 py-10 bg-white rounded">
                    沒有符合篩選條件的訂單。<br>
                    <small>關鍵字: "${keyword}", 狀態: "${statusFilter}", 付款: "${paymentFilter}", 年: "${yearFilter}", 月: "${monthFilter}"</small>
                </div>`;
                return;
            }

            filteredOrders.forEach(order => {
                // 資料補全 - 提取或映射付款狀態
                if (!order.paymentStatus) {
                    // 嘗試從 purchaseSnapshot 提取
                    if (order.purchaseSnapshot && typeof order.purchaseSnapshot === 'object' && order.purchaseSnapshot.paymentStatus) {
                        const oldPaymentStatus = order.purchaseSnapshot.paymentStatus;
                        if (oldPaymentStatus === '已付款') {
                            order.paymentStatus = 'paid';
                        } else if (oldPaymentStatus === '未付款') {
                            order.paymentStatus = 'unpaid';
                        } else if (oldPaymentStatus === '月結') {
                            order.paymentStatus = 'monthly';
                        } else {
                            order.paymentStatus = oldPaymentStatus;
                        }
                    } else {
                        order.paymentStatus = 'unpaid'; // 預設未付款
                    }
                }
                if(order.status === 'pending') order.status = 'ordered'; // Migration on render

                // v11.9 修正: 舊資料兼容 - 無 items 陣列時直接使用舊資料格式渲染
                let totalNetSales = 0; // 未稅銷售額 (含運費)
                let totalTaxAmount = 0; // 總稅額
                let totalPayable = 0;   // 應付總額
                let estimatedDate = "--";

                if (Array.isArray(order.items) && order.items.length > 0) {
                    // v11.3: 稅務邏輯核心修正 (新格式訂單)
                    order.items.forEach(item => {
                        const price = item.customPrice || 0;
                        const qty = item.quantity || 1;
                        const shipping = item.customShipping || 0;
                        const taxStatus = item.taxStatus || '含稅'; 
                        
                        // 基礎金額：產品總價 + 運費
                        const itemBase = (price * qty) + shipping;
                        
                        if (taxStatus === '含稅') {
                            // 內含：倒扣計算
                            // 總金額 = itemBase
                            // 未稅 = itemBase / 1.05
                            // 稅額 = itemBase - 未稅
                            const net = itemBase / 1.05;
                            const tax = itemBase - net;
                            
                            totalNetSales += net;
                            totalTaxAmount += tax;
                            totalPayable += itemBase;

                        } else if (taxStatus === '不含稅') {
                            // 外加：直接乘 5%
                            // 未稅 = itemBase
                            // 稅額 = itemBase * 0.05
                            // 總金額 = itemBase + 稅額
                            const tax = itemBase * 0.05;
                            
                            totalNetSales += itemBase;
                            totalTaxAmount += tax;
                            totalPayable += (itemBase + tax);

                        } else {
                            // 不計稅
                            totalNetSales += itemBase;
                            // 稅額 0
                            totalPayable += itemBase;
                        }
                    });
                    estimatedDate = calculateEstimatedArrival(order.date, order.items);
                } else if (order.supplier && order.productName) {
                    // 舊資料格式: 直接計算 (簡化版)
                    const qty = order.qty || 1;
                    const unitCost = order.unitCost || 0;
                    const shipping = order.shipping || 0;
                    const itemBase = (unitCost * qty) + shipping;
                    
                    if (order.taxType === '不計稅') {
                        totalNetSales += itemBase;
                        totalPayable += itemBase;
                    } else {
                        // 預設含稅處理
                        const net = itemBase / 1.05;
                        const tax = itemBase - net;
                        totalNetSales += net;
                        totalTaxAmount += tax;
                        totalPayable += itemBase;
                    }
                    estimatedDate = "--"; // 舊資料未有此資訊
                }

                const discount = parseFloat(order.discount) || 0;
                totalPayable -= discount; 
                // 若有折扣，通常折扣是扣在總額，這裡簡單處理，未稅額顯示可能會稍微不準確(若未等比扣除)，但應付總額是準確的

                const createdDateDisplay = order.createdAt 
                    ? new Date(order.createdAt).toLocaleString('zh-TW', { hour12: false }) 
                    : `${order.date} (歷史單)`;
                
                const todayStr = new Date().toISOString().split('T')[0];
                const isOverdue = estimatedDate !== "--" && estimatedDate < todayStr && order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'arrived';
                const estimatedDateClass = isOverdue ? 'text-red-600 font-bold' : 'text-gray-400 font-normal';

                const inventoryTransferred = order.inventoryTransferred === true;
                const inventoryCanTransfer = !inventoryTransferred && (order.status === 'arrived' || order.status === 'completed' || order.status === 'closed');
                const transferButtonLabel = inventoryTransferred ? '已轉入' : inventoryCanTransfer ? '轉入庫存' : '不可轉入';
                const transferButtonClasses = inventoryCanTransfer ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed';
                const undoTransferButtonHtml = inventoryTransferred ? `<button onclick="undoTransferOrderToInventory('${order.id}')" class="px-3 py-1 rounded text-sm font-bold bg-yellow-500 text-white hover:bg-yellow-600 ml-2">撤銷轉入</button>` : '';

                // v11.1: 物流狀態 Badge 與 顏色
                let statusBadge = '';
                let statusColor = '';
                let borderColor = 'border-l-4 border-gray-400';

                switch(order.status) {
                    case 'ordered': 
                        statusBadge = '已下單'; 
                        statusColor = 'bg-gray-100 text-gray-800 border-gray-300'; 
                        borderColor = 'border-l-4 border-gray-400';
                        break;
                    case 'partial_shipped': 
                        statusBadge = '部分出貨'; 
                        statusColor = 'bg-orange-100 text-orange-800 border-orange-200'; 
                        borderColor = 'border-l-4 border-orange-400';
                        break;
                    case 'shipped': 
                        statusBadge = '全部出貨'; 
                        statusColor = 'bg-blue-100 text-blue-800 border-blue-200'; 
                        borderColor = 'border-l-4 border-blue-400';
                        break;
                    case 'arrived': 
                        statusBadge = '已收貨'; 
                        statusColor = 'bg-indigo-100 text-indigo-800 border-indigo-200'; 
                        borderColor = 'border-l-4 border-indigo-400';
                        break;
                    case 'completed': 
                        statusBadge = '已驗收完成'; 
                        statusColor = 'bg-green-100 text-green-800 border-green-200'; 
                        borderColor = 'border-l-4 border-green-500 opacity-75';
                        break;
                    case 'cancelled': 
                        statusBadge = '已取消(退)'; 
                        statusColor = 'bg-red-100 text-red-800 border-red-200 line-through'; 
                        borderColor = 'border-l-4 border-red-500 opacity-60';
                        break;
                    default: 
                        statusBadge = '未知狀態'; 
                        statusColor = 'bg-gray-100';
                }

                // 付款狀態樣式
                let payClass = '';
                if(order.paymentStatus === 'paid') payClass = 'bg-green-50 border-green-300 text-green-700';
                else if(order.paymentStatus === 'monthly') payClass = 'bg-purple-50 border-purple-300 text-purple-700';
                else if(order.paymentStatus === '刷卡') payClass = 'bg-blue-50 border-blue-300 text-blue-700';
                else if(order.paymentStatus === '匯款') payClass = 'bg-orange-50 border-orange-300 text-orange-700';
                else if(order.paymentStatus === '現金') payClass = 'bg-teal-50 border-teal-300 text-teal-700';
                else payClass = 'bg-red-50 border-red-300 text-red-700';

                // v11.0: 訂單項目改為可編輯輸入框
                let itemsHtml = '';
                
                // v11.9 修正: 舊資料兼容 - 無 items 陣列時顯示簡化版
                if (Array.isArray(order.items) && order.items.length > 0) {
                    order.items.forEach((item, idx) => {
                        const p = data.products.find(prod => prod.id === item.productId);
                        const prodName = p ? p.prodName : '(已刪除產品)';
                        const deliveryTime = p ? p.deliveryTime : '未知';
                        const supplierName = p ? (data.suppliers.find(s=>s.id === p.supplierId)?.name) : '';
                        const taxStatus = item.taxStatus || '含稅';

                        // 計算該行的小計顯示 (僅供參考)
                    let lineBase = (item.customPrice * item.quantity) + item.customShipping;
                    let lineTotal = lineBase;
                    if (taxStatus === '不含稅') lineTotal = lineBase * 1.05;

                    itemsHtml += `
                        <div class="flex flex-col md:flex-row gap-2 items-start md:items-center py-2 border-b last:border-0 border-gray-100 bg-gray-50/50 p-2 rounded mb-1">
                            <div class="flex-1">
                                <div class="font-bold text-gray-700">${prodName}</div>
                                <div class="text-xs text-gray-400">
                                    ${supplierName} | 交期: ${deliveryTime}
                                </div>
                                ${p?.spec ? `<div class="text-xs text-gray-600 bg-blue-50 inline-block px-2 py-1 rounded mt-1"><strong>規格:</strong> ${p.spec}</div>` : ''}
                                <div class="flex gap-2 mt-1">
                                    <input type="text" value="${item.customNote || ''}" placeholder="備註..." 
                                        class="text-xs p-1 border rounded w-full md:w-48 bg-white"
                                        onchange="updateOrderItem('${order.id}', ${idx}, 'customNote', this.value)">
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2 items-center">
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-gray-500">單價</span>
                                    <input type="number" step="0.01" value="${item.customPrice}" 
                                        class="w-20 p-1 text-sm border rounded text-right"
                                        onchange="updateOrderItem('${order.id}', ${idx}, 'customPrice', this.value)">
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-gray-500">數量</span>
                                    <input type="number" min="1" value="${item.quantity}" 
                                        class="w-16 p-1 text-sm border rounded text-center"
                                        onchange="updateOrderItem('${order.id}', ${idx}, 'quantity', this.value)">
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-gray-500">稅別</span>
                                    <select class="p-1 text-xs border rounded w-20"
                                            onchange="updateOrderItem('${order.id}', ${idx}, 'taxStatus', this.value)">
                                        <option value="含稅" ${taxStatus==='含稅'?'selected':''}>含稅</option>
                                        <option value="不含稅" ${taxStatus==='不含稅'?'selected':''}>未稅</option>
                                        <option value="不計稅" ${taxStatus==='不計稅'?'selected':''}>不計稅</option>
                                    </select>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-gray-500">運費</span>
                                    <input type="number" min="0" value="${item.customShipping}" 
                                        class="w-16 p-1 text-sm border rounded text-right"
                                        onchange="updateOrderItem('${order.id}', ${idx}, 'customShipping', this.value)">
                                </div>
                            </div>
                            <div class="text-right min-w-[80px]">
                                <div class="font-mono text-sm font-bold text-blue-700">$${Math.round(lineTotal).toLocaleString()}</div>
                                ${taxStatus==='不含稅' ? '<span class="text-[10px] text-red-500">(含稅)</span>' : ''}
                            </div>
                            <button onclick="deleteOrderItem('${order.id}', ${idx})" class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded" title="刪除此項目${lineTotal === 0 ? ' (金額為0)' : ''}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    `;
                    });
                } else if (order.supplier && order.productName) {
                    // 舊資料格式簡化顯示
                    itemsHtml = `
                        <div class="flex flex-col md:flex-row gap-2 items-start md:items-center py-2 border-b border-gray-100 bg-gray-50/50 p-2 rounded">
                            <div class="flex-1">
                                <div class="font-bold text-gray-700">${order.productName}</div>
                                <div class="text-xs text-gray-400">${order.supplier}</div>
                                ${order.spec ? `<div class="text-xs text-gray-600 bg-blue-50 inline-block px-2 py-1 rounded mt-1">規格: ${order.spec}</div>` : ''}
                            </div>
                            <div class="flex flex-wrap gap-2 items-center">
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-gray-500">單價</span>
                                    <span class="w-20 p-1 text-sm font-mono">$${order.unitCost}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-gray-500">數量</span>
                                    <span class="w-16 p-1 text-sm font-mono text-center">${order.qty}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-gray-500">稅別</span>
                                    <span class="p-1 text-xs">${order.taxType || '不計稅'}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-gray-500">運費</span>
                                    <span class="w-16 p-1 text-sm font-mono text-right">$${order.shipping || 0}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                const div = document.createElement('div');
                div.className = `card p-5 ${borderColor}`;
                
                div.innerHTML = `
                    <div class="flex flex-col md:flex-row justify-between md:items-center mb-2 pb-3 border-b border-gray-100">
                        <div class="mb-2 md:mb-0">
                            <div class="flex flex-col gap-1">
                                <div class="text-xs text-gray-400 font-mono">
                                    訂單編號: ${order.id} | 建檔時間: ${createdDateDisplay}
                                </div>
                                <div class="flex items-center gap-2 mt-1">
                                    <label class="text-sm font-bold text-gray-700">下單日:</label>
                                    <input type="date" value="${order.date}" 
                                        class="text-sm border rounded px-2 py-0.5 focus:ring-2 focus:ring-blue-500 bg-white"
                                        onchange="updateOrderMeta('${order.id}', 'date', this.value)">
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-3 justify-end mt-2 md:mt-0">
                            <!-- v10.0: 付款狀態選單 -->
                            <div class="flex items-center gap-1">
                                <span class="text-xs font-bold text-gray-500">付款:</span>
                                <select onchange="updateOrderMeta('${order.id}', 'paymentStatus', this.value)" 
                                        class="text-sm border rounded p-1 font-bold cursor-pointer outline-none ${payClass}">
                                    <option value="paid" ${order.paymentStatus === 'paid'?'selected':''}>已付款</option>
                                    <option value="unpaid" ${order.paymentStatus === 'unpaid'?'selected':''}>未付款</option>
                                    <option value="monthly" ${order.paymentStatus === 'monthly'?'selected':''}>月結</option>
                                    <option value="刷卡" ${order.paymentStatus === '刷卡'?'selected':''}>刷卡</option>
                                    <option value="匯款" ${order.paymentStatus === '匯款'?'selected':''}>匯款</option>
                                    <option value="現金" ${order.paymentStatus === '現金'?'selected':''}>現金</option>
                                </select>
                                <!-- v11.3 新增付款日 -->
                                <input type="date" title="付款日期" value="${order.paymentDate || ''}" 
                                    class="text-sm border rounded p-1 w-32" 
                                    onchange="updateOrderMeta('${order.id}', 'paymentDate', this.value)">
                                <!-- 新增刷卡認證碼 -->
                                    <input type="text" title="刷卡認證碼" value="${order.cardAuthCode || ''}" placeholder="刷卡認證碼"
                                        class="text-sm p-1 w-32 ${order.paymentStatus === '刷卡' ? 'border-2 border-red-600 rounded' : 'border rounded'}" 
                                        onchange="updateOrderMeta('${order.id}', 'cardAuthCode', this.value)">
                            </div>

                            <span class="px-3 py-1 rounded-full text-sm font-bold border ${statusColor}">${statusBadge}</span>
                            
                            <!-- v11.1 升級後的狀態選單 -->
                            <select onchange="updateOrderStatus('${order.id}', this.value)" class="text-sm border rounded p-1 bg-white">
                                <option value="ordered" ${order.status === 'ordered'?'selected':''}>變更: 已下單</option>
                                <option value="partial_shipped" ${order.status === 'partial_shipped'?'selected':''}>變更: 部分出貨</option>
                                <option value="shipped" ${order.status === 'shipped'?'selected':''}>變更: 全部出貨</option>
                                <option value="arrived" ${order.status === 'arrived'?'selected':''}>變更: 已收貨</option>
                                <option value="completed" ${order.status === 'completed'?'selected':''}>變更: 已驗收完成</option>
                                <option value="cancelled" ${order.status === 'cancelled'?'selected':''}>變更: 已取消(退)</option>
                            </select>

                            <button onclick="transferOrderToInventory('${order.id}')" class="px-3 py-1 rounded text-sm font-bold ${transferButtonClasses} ml-2" ${inventoryCanTransfer ? '' : 'disabled'}>
                                ${transferButtonLabel}
                            </button>
                            ${undoTransferButtonHtml}

                            <button onclick="deleteOrder('${order.id}')" class="text-gray-400 hover:text-red-500 ml-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- 訂單資訊編輯區塊 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 bg-gray-50 p-3 rounded">
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">供應商(訂單)單號</label>
                             <input type="text" value="${order.originalOrderNo || ''}" placeholder="輸入供應商單號..."
                                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:bg-white"
                                onchange="updateOrderMeta('${order.id}', 'originalOrderNo', this.value)">
                        </div>
                        <!-- v11.0 新增: 報價單號 -->
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">報價單號</label>
                             <input type="text" value="${order.quotationNo || ''}" placeholder="輸入報價單號..."
                                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:bg-white"
                                onchange="updateOrderMeta('${order.id}', 'quotationNo', this.value)">
                        </div>
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">供應商發票號碼</label>
                             <input type="text" value="${order.invoiceNumber || ''}" placeholder="輸入發票號..."
                            class="w-full px-2 py-1 text-sm ${ (Array.isArray(order.items) && order.items.some(it=> (it.taxStatus||'含稅')==='含稅' || (it.taxStatus||'含稅')==='不含稅')) ? 'border-2 border-red-600 rounded' : 'border border-gray-300 rounded focus:bg-white' }"
                            onchange="updateOrderMeta('${order.id}', 'invoiceNumber', this.value)">
                        </div>
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">發票日期</label>
                             <input type="date" value="${order.supplierInvoiceDate || ''}"
                            class="w-full px-2 py-1 text-sm ${ (Array.isArray(order.items) && order.items.some(it=> (it.taxStatus||'含稅')==='含稅' || (it.taxStatus||'含稅')==='不含稅')) ? 'border-2 border-red-600 rounded' : 'border border-gray-300 rounded focus:bg-white' }"
                            onchange="updateOrderMeta('${order.id}', 'supplierInvoiceDate', this.value)">
                        </div>
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">物流商</label>
                             <input type="text" value="${order.logisticsProvider || ''}" placeholder="例如: 黑貓/順豐"
                                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:bg-white"
                                onchange="updateOrderMeta('${order.id}', 'logisticsProvider', this.value)">
                        </div>
                         <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">物流單號</label>
                             <input type="text" value="${order.trackingNumber || ''}" placeholder="輸入追蹤碼..."
                                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:bg-white"
                                onchange="updateOrderMeta('${order.id}', 'trackingNumber', this.value)">
                        </div>
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">出貨日</label>
                             <input type="date" value="${order.shipDate || ''}"
                                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:bg-white"
                                onchange="updateOrderMeta('${order.id}', 'shipDate', this.value)">
                        </div>
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">
                                到貨日 <span class="${estimatedDateClass} text-[10px] ml-1" title="根據交期自動推算">(系統預估: ${estimatedDate})</span>
                             </label>
                             <input type="date" value="${order.arrivalDate || ''}"
                                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:bg-white"
                                onchange="updateOrderMeta('${order.id}', 'arrivalDate', this.value)">
                        </div>
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">訂單備註 (溝通紀錄)</label>
                             <input type="text" value="${order.orderNote || ''}" placeholder="紀錄廠商溝通細節..."
                                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:bg-white"
                                onchange="updateOrderMeta('${order.id}', 'orderNote', this.value)">
                        </div>
                        <div>
                             <label class="block text-xs font-bold text-gray-500 mb-1">訂單折扣 (折抵總額)</label>
                             <input type="number" value="${order.discount || 0}" placeholder="0"
                                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:bg-white text-red-600 font-bold"
                                onchange="updateOrderMeta('${order.id}', 'discount', this.value)">
                        </div>
                    </div>

                    <div class="px-2 mb-3">
                        <div class="text-xs font-bold text-gray-500 mb-2">訂單明細 (修改數值後自動更新金額)</div>
                        ${itemsHtml}
                    </div>
                    
                    <div class="flex justify-end items-center pt-2 border-t text-sm">
                        <div class="text-right space-y-1">
                            <div class="text-gray-500 flex justify-end gap-4">
                                <span>銷售額(未稅+運費): $${Math.round(totalNetSales).toLocaleString()}</span>
                                <span>稅額 (5%): $${Math.round(totalTaxAmount).toLocaleString()}</span>
                            </div>
                            ${discount > 0 ? `<div class="text-red-500">折扣: -$${Math.round(discount).toLocaleString()}</div>` : ''}
                            <div class="text-xl font-bold text-blue-800 border-t pt-1 mt-1">應付總額: $${Math.round(totalPayable).toLocaleString()}</div>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function updateOrderItem(orderId, itemIndex, field, value) {
            const order = data.orders.find(o => o.id === orderId);
            if (!order || !order.items[itemIndex]) return;

            // 深拷貝一份訂單以計算新金額
            const tempOrder = JSON.parse(JSON.stringify(order));
            const item = tempOrder.items[itemIndex];

            // 數值轉換
            let newVal = value;
            if (field === 'customPrice' || field === 'customShipping') newVal = parseFloat(value) || 0;
            if (field === 'quantity') newVal = parseInt(value) || 1;
            
            // 更新暫存值
            item[field] = newVal;

            // 計算原總額
            const oldTotal = calculateOrderTotal(order);
            // 計算新總額
            const newTotal = calculateOrderTotal(tempOrder);

            // 如果金額有變動，跳出確認框
            if (oldTotal !== newTotal) {
                if (confirm(`修改此項目將導致訂單總金額由 $${Math.round(oldTotal)} 變更為 $${Math.round(newTotal)}。\n\n確定要更新嗎？`)) {
                     // 使用者確認，寫入真實資料
                     order.items[itemIndex][field] = newVal;
                     saveData();
                     renderOrders();
                     showToast('訂單明細與金額已更新', 'bg-blue-600');
                } else {
                    // 使用者取消，重繪介面以還原數值
                    renderOrders();
                }
            } else {
                // 金額無變動 (例如只改備註)，直接存檔
                order.items[itemIndex][field] = newVal;
                saveData();
                // 只有備註不一定要重繪整個列表，但為了保險起見還是重繪
                if (field !== 'customNote') renderOrders(); 
            }
        }

        // v11.3 更新 Helper: 符合新稅務邏輯
        function calculateOrderTotal(order) {
            let totalPayable = 0;
            order.items.forEach(item => {
                const price = item.customPrice || 0;
                const qty = item.quantity || 1;
                const shipping = item.customShipping || 0;
                const taxStatus = item.taxStatus || '含稅'; 
                
                const itemBase = (price * qty) + shipping;
                
                if (taxStatus === '不含稅') {
                    totalPayable += itemBase * 1.05;
                } else {
                    // 含稅 或 不計稅，itemBase 即為該項總額
                    totalPayable += itemBase;
                }
            });
            return totalPayable - (order.discount || 0);
        }

        function updateOrderStatus(orderId, status) {
            const order = data.orders.find(o => o.id === orderId);
            if (order) {
                order.status = status;
                saveData();
                renderOrders();
                showToast('訂單狀態已更新', 'bg-blue-500');
            }
        }

        function updateOrderMeta(orderId, field, value) {
            const order = data.orders.find(o => o.id === orderId);
            if (order) {
                if (field === 'discount') {
                    const oldTotal = calculateOrderTotal(order);
                    const tempOrder = JSON.parse(JSON.stringify(order));
                    tempOrder.discount = parseFloat(value) || 0;
                    const newTotal = calculateOrderTotal(tempOrder);

                    if (confirm(`修改折扣將導致訂單總金額由 $${Math.round(oldTotal)} 變更為 $${Math.round(newTotal)}。\n確定要更新嗎？`)) {
                         order[field] = parseFloat(value) || 0;
                         saveData();
                         renderOrders();
                         return;
                    } else {
                        renderOrders();
                        return;
                    }
                }
                order[field] = value;
                saveData();
                if (field === 'date' || field === 'paymentStatus') { // 更新渲染
                    renderOrders();
                }
            }
        }

        // v11.8: 新增訂單項目刪除功能 (金額為0的品項可刪除)
        function deleteOrderItem(orderId, itemIndex) {
            const order = data.orders.find(o => o.id === orderId);
            if (!order || !order.items[itemIndex]) return;

            const item = order.items[itemIndex];
            const price = item.customPrice || 0;
            const qty = item.quantity || 1;
            const shipping = item.customShipping || 0;
            const taxStatus = item.taxStatus || '含稅';
            
            // 計算該項目的金額
            const itemBase = (price * qty) + shipping;
            let itemTotal = itemBase;
            if (taxStatus === '不含稅') {
                itemTotal = itemBase * 1.05;
            }

            // 構建提示消息
            let message = '';
            const p = data.products.find(prod => prod.id === item.productId);
            const prodName = p ? p.prodName : '(已刪除產品)';
            
            if (itemTotal === 0) {
                message = `確定要刪除此品項嗎？\n\n產品: ${prodName}\n金額: $0 (金額為零)\n\n此操作無法復原。`;
            } else {
                message = `確定要刪除此品項嗎？\n\n產品: ${prodName}\n金額: $${Math.round(itemTotal).toLocaleString()}\n\n此操作無法復原。`;
            }

            if (confirm(message)) {
                // 移除該項目
                order.items.splice(itemIndex, 1);
                
                // 如果訂單已無項目，詢問是否刪除整個訂單
                if (order.items.length === 0) {
                    showToast('訂單明細已全部刪除，該訂單將自動移除', 'bg-orange-500');
                    data.orders = data.orders.filter(o => o.id !== orderId);
                } else {
                    showToast(`已刪除品項: ${prodName}`, 'bg-green-600');
                }
                
                saveData();
                renderOrders();
            }
        }

        function deleteOrder(orderId) {            if (confirm('確定要刪除這筆訂單記錄嗎？')) {
                data.orders = data.orders.filter(o => o.id !== orderId);
                saveData();
                renderOrders();
            }
        }
        function exportCartToExcel() {
            if (!data.cart || data.cart.length === 0) return showToast('清單為空，無法匯出', 'bg-red-500');
            
            const exportData = [];
            const headers = ["供應商", "產品名稱", "規格", "交期", "數量", "單價", "稅別", "運費", "備註", "小計(含稅)"];
            exportData.push(headers);
            
            data.cart.forEach(item => {
                const p = data.products.find(prod => prod.id === item.productId);
                if (!p) return;
                const supplier = data.suppliers.find(s => s.id === p.supplierId)?.name || '未知';
                
                const price = parseFloat(item.customPrice);
                const qty = parseInt(item.quantity);
                const taxStatus = item.taxStatus || '含稅';
                let subtotal = price * qty;
                if(taxStatus === '不含稅') subtotal *= 1.05;
                subtotal += item.customShipping;

                exportData.push([
                    supplier,
                    p.prodName,
                    p.spec || '',
                    p.deliveryTime || '',
                    qty,
                    price,
                    taxStatus,
                    item.customShipping,
                    item.customNote || '',
                    Math.round(subtotal)
                ]);
            });

            saveAsExcel(exportData, "採購清單", `採購清單匯出_${getTodayStr()}.xlsx`);
            showToast('已下載採購清單 Excel', 'bg-green-600');
        }

        function exportInvoiceExcel() {
            if (!data.orders || data.orders.length === 0) return showToast('無訂單資料可匯出', 'bg-red-500');

            const exportData = [];
            const headers = ["訂單編號", "出貨日", "到貨日", "產品名稱", "品牌名稱", "規格", "數量", "單價", "發票日期", "發票號碼", "供應商"];
            exportData.push(headers);

            data.orders.forEach(order => {
                order.items.forEach(item => {
                    const p = data.products.find(prod => prod.id === item.productId);
                    const prodName = p ? p.prodName : '(已刪除)';
                    const brandName = p ? p.brandName || '' : '';
                    const spec = p ? p.spec : '';
                    const supplierName = p ? (data.suppliers.find(s => s.id === p.supplierId)?.name) : '未知';

                    exportData.push([
                        order.id,
                        order.shipDate || '',
                        order.arrivalDate || '',
                        prodName,
                        brandName,
                        spec,
                        item.quantity,
                        item.customPrice,
                        order.supplierInvoiceDate || '',
                        order.invoiceNumber || '',
                        supplierName
                    ]);
                });
            });

            saveAsExcel(exportData, "發票明細", `發票明細匯出_${getTodayStr()}.xlsx`);
            showToast('已下載發票明細 Excel', 'bg-green-600');
        }

