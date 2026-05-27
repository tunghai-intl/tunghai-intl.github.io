        // 資料初始化
        let data = JSON.parse(localStorage.getItem('procurementDataV2')) || JSON.parse(localStorage.getItem('procurementData')) || {
            suppliers: [],
            products: [],
            cart: [], // 採購清單暫存
            orders: [], // 歷史訂單
            clientQuotes: [], // 客戶報價單
            supplierInquiries: [], // 供應商詢價單
            inventory: [], // 庫存主檔
            inventoryMovements: [], // 庫存異動明細
            inventoryBatches: [], // 庫存批次
            lastExportTime: null, // 最近匯出時間
            lastImportTime: null  // 最近匯入時間
        };

        // 舊資料遷移檢查
        if (!data.orders) data.orders = [];
        if (!data.clientQuotes) data.clientQuotes = [];
        if (!data.supplierInquiries) data.supplierInquiries = [];
        if (!data.inventory) data.inventory = [];
        if (!data.inventoryMovements) data.inventoryMovements = [];
        if (!data.inventoryBatches) data.inventoryBatches = [];
        if (!data.lastExportTime) data.lastExportTime = null;
        if (!data.lastImportTime) data.lastImportTime = null;

        // v11.9 新增：確保現有訂單有完整的屬性結構
        data.orders.forEach(order => {
            if (order.inventoryTransferred === undefined) {
                order.inventoryTransferred = false;
            }
            if (order.inventoryTransferAt === undefined) {
                order.inventoryTransferAt = '';
            }
        });

        // 暫存變數
        let tempQuoteItems = [];
        let tempInquiryItems = [];
        let selectedCartItems = new Set(); // 儲存已選採購品項的 productId
        let inventoryModalCurrentId = null; // 庫存 modal 暫存 id

        // v11.5 詢價狀態定義
        const inquiryStatusMap = {
            'waiting': { label: '等回覆', class: 'bg-gray-100 text-gray-600 border-gray-300' },
            'replied': { label: '已回覆', class: 'bg-blue-100 text-blue-700 border-blue-300' },
            'price_high': { label: '價格高', class: 'bg-orange-100 text-orange-700 border-orange-300' },
            'no_stock': { label: '無供貨', class: 'bg-red-100 text-red-700 border-red-300' },
            'converted': { label: '已轉正式產品', class: 'bg-green-100 text-green-700 border-green-300' }
        };
        function exportToExcel(type) {
            let exportData = [];
            let fileName = "";
            let sheetName = "";
            
            if (type === 'suppliers') {
                sheetName = "供應商";
                exportData.push(["系統ID", "供應商名稱", "公司統編", "聯絡人", "電話", "網址", "地址", "備註"]);
                data.suppliers.forEach(s => {
                    exportData.push([s.id, s.name, s.taxId, s.contact, s.phone, s.website, s.address, s.note]);
                });
                fileName = `供應商清單_${getTodayStr()}.xlsx`;
            
            } else if (type === 'products') {
                sheetName = "產品";
                exportData.push(["系統ID", "供應商名稱", "產品名稱", "品牌名稱", "規格", "交期", "單價", "稅務", "參考運費", "產品網址", "產品備註", "建檔時間", "最後異動時間"]);
                data.products.forEach(p => {
                    const supplier = data.suppliers.find(s => s.id === p.supplierId)?.name || '未知';
                    exportData.push([
                        p.id, 
                        supplier, 
                        p.prodName, 
                        p.brandName || '', 
                        p.spec, 
                        p.deliveryTime, 
                        p.price, 
                        p.isTaxIncl, 
                        p.shipping, 
                        p.prodUrl, 
                        p.prodNote,
                        p.createdAt ? new Date(p.createdAt).toLocaleString('zh-TW') : '',
                        p.updatedAt ? new Date(p.updatedAt).toLocaleString('zh-TW') : ''
                    ]);
                });
                fileName = `產品報價單_${getTodayStr()}.xlsx`;
            
            } else if (type === 'orders') {
                sheetName = "訂單明細";
                // 欄位排序已調整為主管檢查優化順序
                exportData.push(["下單日期", "產品名稱", "品牌名稱", "規格", "數量", "成交單價", "成交運費", "總金額", "稅別", "項目備註", "報價單號", "訂單備註", "供應商名稱", "付款狀態", "付款日期", "刷卡認證碼", "發票號碼", "廠商發票日期", "供應商(訂單)單號", "狀態", "系統預計到貨日", "出貨日", "到貨日", "訂單折扣", "是否已轉入庫存", "轉入時間", "訂單編號", "建檔時間", "物流商", "物流單號"]);
                
                data.orders.forEach(order => {
                    // Excel 匯出也需依循新的稅務邏輯計算總額
                    let totalPayable = 0;
                    order.items.forEach(item => {
                        const itemBase = (item.customPrice * item.quantity) + item.customShipping;
                        if(item.taxStatus === '不含稅') {
                            totalPayable += itemBase * 1.05;
                        } else {
                            totalPayable += itemBase;
                        }
                    });
                    const finalTotal = Math.round(totalPayable - (order.discount || 0));

                    // 計算系統預計到貨日
                    const estimatedArrival = calculateEstimatedArrival(order.date, order.items);

                    order.items.forEach(item => {
                        const p = data.products.find(prod => prod.id === item.productId);
                        const supplierName = p ? (data.suppliers.find(s=>s.id === p.supplierId)?.name) : '未知';
                        const prodName = p ? p.prodName : '(已刪除)';
                        const brandName = p ? p.brandName || '' : '';
                        const spec = p ? p.spec : '';
                        
                        exportData.push([
                            order.date,
                            prodName, 
                            brandName,
                            spec,
                            item.quantity,
                            item.customPrice,
                            item.customShipping,
                            finalTotal,
                            item.taxStatus || '含稅',
                            item.customNote,
                            order.quotationNo || '',
                            order.orderNote || '',
                            supplierName,
                            translatePayment(order.paymentStatus),
                            order.paymentDate || '',
                            order.cardAuthCode || '',
                            order.invoiceNumber || '',
                            order.supplierInvoiceDate || '',
                            order.originalOrderNo || '',
                            translateStatus(order.status),
                            estimatedArrival,
                            order.shipDate || '',
                            order.arrivalDate || '',
                            order.discount || 0,
                            order.inventoryTransferred ? '是' : '否',
                            order.inventoryTransferAt || '',
                            order.id,
                            order.createdAt || '',
                            order.logisticsProvider || '',
                            order.trackingNumber || ''
                        ]);
                    });
                });
                fileName = `歷史訂單明細_${getTodayStr()}.xlsx`;
            } else if (type === 'inventory') {
                sheetName = "庫存清單";
                exportData.push(["庫存編號", "產品編號", "產品名稱", "規格", "供應商", "倉別", "單位", "庫存數量", "可用數量", "成本單價", "平均成本", "庫存金額", "狀態", "最後更新", "來源訂單"]);
                data.inventory.forEach(item => {
                    exportData.push([
                        item.id,
                        item.productId,
                        item.productName,
                        item.spec,
                        item.supplierName,
                        item.warehouse,
                        item.unit,
                        item.quantity,
                        item.availableQuantity,
                        item.lastCost,
                        item.averageCost,
                        item.totalCost,
                        item.status,
                        item.lastUpdated || '',
                        (item.relatedOrders || []).join(', ')
                    ]);
                });
                fileName = `庫存清單_${getTodayStr()}.xlsx`;
            } else if (type === 'inventoryMovements') {
                sheetName = "庫存異動記錄";
                exportData.push(["異動編號", "異動日期", "異動類型", "來源訂單", "產品編號", "產品名稱", "規格", "供應商", "倉別", "數量", "單位成本", "總成本", "來源日期", "到貨日期", "備註"]);
                data.inventoryMovements.forEach(move => {
                    exportData.push([
                        move.id,
                        move.createdAt || '',
                        move.type,
                        move.orderId,
                        move.productId,
                        move.productName,
                        move.spec,
                        move.supplierName,
                        move.warehouse,
                        move.quantity,
                        move.unitCost,
                        move.totalCost,
                        move.sourceDate || '',
                        move.arrivalDate || '',
                        move.note || ''
                    ]);
                });
                fileName = `庫存異動記錄_${getTodayStr()}.xlsx`;
            }

            saveAsExcel(exportData, sheetName, fileName);
            showToast('匯出成功', 'bg-green-600');
        }

        function handleCSVImport(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const rows = parseCSV(text);
                if (rows.length < 2) return showToast('CSV 檔案內容為空或格式錯誤', 'bg-red-500');
                
                const headers = rows[0];
                let type = '';
                
                if (headers.includes("公司統編") && headers.includes("供應商名稱")) type = 'suppliers';
                else if (headers.includes("產品名稱") && headers.includes("單價")) type = 'products';
                else if (headers.includes("訂單編號") && headers.includes("下單日期")) type = 'orders';
                
                if (!type) return showToast('無法識別 CSV 類型，請檢查標題欄位', 'bg-red-500');

                let count = 0;
                if (type === 'suppliers') count = importSuppliers(rows);
                else if (type === 'products') count = importProducts(rows);
                else if (type === 'orders') count = importOrders(rows);

                saveData();
                renderSuppliers();
                renderProducts();
                renderOrders();
                showToast(`成功匯入 ${count} 筆${type === 'suppliers'?'供應商':type==='products'?'產品':'訂單'}資料`, 'bg-green-600');
                event.target.value = '';
            };
            reader.readAsText(file);
        }
        function importSuppliers(rows) {
            let count = 0;
            rows.slice(1).forEach(row => {
                if (!row[1]) return;
                const id = row[0] && row[0].startsWith('s_') ? row[0] : 's_' + Date.now() + Math.random().toString(36).substr(2,4);
                
                const supplier = {
                    id: id,
                    name: row[1],
                    taxId: row[2] || '',
                    contact: row[3] || '',
                    phone: row[4] || '',
                    website: row[5] || '',
                    address: row[6] || '',
                    note: row[7] || ''
                };

                const existIdx = data.suppliers.findIndex(s => s.id === supplier.id);
                if (existIdx !== -1) data.suppliers[existIdx] = supplier;
                else data.suppliers.push(supplier);
                count++;
            });
            return count;
        }
        function importProducts(rows) {
            let count = 0;
            rows.slice(1).forEach(row => {
                if (!row[2]) return;
                
                let supplierId = '';
                const supplierName = row[1];
                if (supplierName) {
                    const s = data.suppliers.find(sup => sup.name === supplierName);
                    if (s) supplierId = s.id;
                }

                const csvId = row[0] && row[0].startsWith('p_') ? row[0] : null;
                const prodName = row[2];
                const brandName = row[3] || '';
                const spec = row[4] || '';

                let existingProductIndex = -1;

                if (csvId) {
                    existingProductIndex = data.products.findIndex(p => p.id === csvId);
                }

                if (existingProductIndex === -1) {
                    existingProductIndex = data.products.findIndex(p => 
                        p.prodName === prodName && 
                        p.spec === spec && 
                        p.supplierId === supplierId
                    );
                }

                const finalId = existingProductIndex !== -1 ? data.products[existingProductIndex].id : (csvId || generateProductID());
                
                const product = {
                    id: finalId,
                    supplierId: supplierId,
                    prodName: prodName,
                    brandName: brandName,
                    spec: spec,
                    deliveryTime: row[5] || '',
                    price: parseFloat(row[6]) || 0,
                    isTaxIncl: row[7] || '含稅',
                    shipping: parseFloat(row[8]) || 0,
                    prodUrl: row[9] || '',
                    prodNote: row[10] || '',
                    createdAt: existingProductIndex === -1 ? new Date().toISOString() : (data.products[existingProductIndex].createdAt || new Date().toISOString()),
                    updatedAt: new Date().toISOString()                };

                if (existingProductIndex !== -1) {
                    data.products[existingProductIndex] = product;
                } else {
                    data.products.push(product);
                }
                count++;
            });
            return count;
        }
        function importOrders(rows) {
            let count = 0;
            const tempOrders = {};
            const headers = rows[0]; 
            
            // 欄位索引對應
            const idxCreatedAt = headers.indexOf("建檔時間");
            const idxOriginalNo = headers.indexOf("供應商(訂單)單號");
            const idxOrderDate = headers.indexOf("下單日期");
            const idxStatus = headers.indexOf("狀態");
            const idxPaymentStatus = headers.indexOf("付款狀態");
            const idxInvoiceNum = headers.indexOf("發票號碼");
            const idxInvoiceDate = headers.indexOf("廠商發票日期");
            const idxLogistics = headers.indexOf("物流商");
            const idxTracking = headers.indexOf("物流單號");
            const idxShip = headers.indexOf("出貨日");
            const idxArrival = headers.indexOf("到貨日");
            const idxNote = headers.indexOf("訂單備註");
            const idxDiscount = headers.indexOf("訂單折扣"); 
            const idxTaxStatus = headers.indexOf("稅別"); 
            const idxQuoteNo = headers.indexOf("報價單號"); // v11.0

            let idxProdName = 11;
            if (idxNote > -1) {
                idxProdName = idxNote + 3; 
            } else {
                if(headers.includes("產品名稱")) idxProdName = headers.indexOf("產品名稱");
            }

            rows.slice(1).forEach(row => {
                const orderId = row[0];
                if (!orderId) return;

                if (!tempOrders[orderId]) {
                    tempOrders[orderId] = {
                        id: orderId,
                        createdAt: idxCreatedAt > -1 ? row[idxCreatedAt] : '', 
                        date: idxOrderDate > -1 ? row[idxOrderDate] : row[2], 
                        status: idxStatus > -1 ? reverseStatus(row[idxStatus]) : reverseStatus(row[3]),
                        paymentStatus: idxPaymentStatus > -1 ? reversePayment(row[idxPaymentStatus]) : 'unpaid',
                        invoiceNumber: idxInvoiceNum > -1 ? row[idxInvoiceNum] : row[4],
                        supplierInvoiceDate: idxInvoiceDate > -1 ? row[idxInvoiceDate] : '', 
                        originalOrderNo: idxOriginalNo > -1 ? row[idxOriginalNo] : '',
                        quotationNo: idxQuoteNo > -1 ? row[idxQuoteNo] : '', // v11.0
                        logisticsProvider: idxLogistics > -1 ? row[idxLogistics] : '',
                        trackingNumber: idxTracking > -1 ? row[idxTracking] : '',
                        shipDate: idxShip > -1 ? row[idxShip] : '',
                        arrivalDate: idxArrival > -1 ? row[idxArrival] : '',
                        orderNote: idxNote > -1 ? row[idxNote] : '',
                        discount: idxDiscount > -1 ? (parseFloat(row[idxDiscount]) || 0) : 0,

                        items: [],
                        totalAmount: 0 
                    };
                }
                
                const prodName = row[idxProdName];
                const p = data.products.find(prod => prod.prodName === prodName);
                const productId = p ? p.id : 'unknown_' + Date.now();

                // 使用 indexOf 找到正確的欄位位置（品牌名稱已插入產品名稱之後）
                const idxBrandName = headers.indexOf("品牌名稱");
                const idxSpec = headers.indexOf("規格");
                const idxQty = headers.indexOf("數量");
                const idxPrice = headers.indexOf("成交單價");
                const idxShipping = headers.indexOf("成交運費");
                const itemNoteIdx = headers.indexOf("項目備註");

                tempOrders[orderId].items.push({
                    productId: productId,
                    quantity: idxQty > -1 ? (parseInt(row[idxQty]) || 1) : 1,
                    customPrice: idxPrice > -1 ? (parseFloat(row[idxPrice]) || 0) : 0,
                    customShipping: idxShipping > -1 ? (parseFloat(row[idxShipping]) || 0) : 0,
                    taxStatus: idxTaxStatus > -1 ? row[idxTaxStatus] : '含稅',
                    customNote: itemNoteIdx > -1 ? row[itemNoteIdx] : ''
                });
            });

            for (const oid in tempOrders) {
                const ord = tempOrders[oid];
                let itemSubtotal = 0; 
                let taxTotal = 0;
                let shipTotal = 0;
                
                ord.items.forEach(item => {
                    const sub = item.customPrice * item.quantity;
                    itemSubtotal += sub;
                    shipTotal += item.customShipping;
                    if(item.taxStatus === '不含稅') taxTotal += sub * 0.05;
                });
                
                ord.totalAmount = itemSubtotal + taxTotal + shipTotal - (ord.discount || 0);
                
                const existIdx = data.orders.findIndex(o => o.id === ord.id);
                if (existIdx !== -1) {
                    data.orders[existIdx] = ord;
                } else {
                    data.orders.push(ord);
                }
                count++;
            }
            return count;
        }
        function saveData() {
            localStorage.setItem('procurementDataV2', JSON.stringify(data));
        }
        function exportData() {
            data.lastExportTime = new Date().toISOString();
            saveData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `採購追蹤系統備份_${getTodayStr()}.json`;
            a.click();
            // 更新顯示
            updateTimestampDisplay();
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (imported.suppliers && imported.products) {
                        data = imported;
                        if (!data.cart) data.cart = [];
                        if (!data.orders) data.orders = [];
                        if (!data.clientQuotes) data.clientQuotes = [];
                        if (!data.supplierInquiries) data.supplierInquiries = [];
                        if (!data.inventory) data.inventory = [];
                        if (!data.inventoryMovements) data.inventoryMovements = [];
                        if (!data.inventoryBatches) data.inventoryBatches = [];
                        if (!data.lastExportTime) data.lastExportTime = null;
                        if (!data.lastImportTime) data.lastImportTime = null;
                        
                        data.lastImportTime = new Date().toISOString();
                        saveData();
                        window.location.reload(); 
                    }
                } catch (err) {
                    showToast('導入失敗：檔案格式錯誤', 'bg-red-500');
                }
            };
            reader.readAsText(file);
        }

        function clearData() {
            if (confirm('確定要清除所有資料嗎？此操作無法復原。')) {
                data = {
                    suppliers: [],
                    products: [],
                    cart: [],
                    orders: [],
                    clientQuotes: [],
                    supplierInquiries: [],
                    inventory: [],
                    inventoryMovements: [],
                    inventoryBatches: [],
                    lastExportTime: null,
                    lastImportTime: null
                };
                saveData();
                showToast('資料已清除', 'bg-green-500');
                window.location.reload();
            }
        }

        // 暴露全域函數
        window.exportData = exportData;
        window.importData = importData;
        window.clearData = clearData;
