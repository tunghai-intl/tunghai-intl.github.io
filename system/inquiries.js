        // ================= 供應商詢價單邏輯 (v11.5 狀態升級) =================

        function updateSupplierDatalist() {
            const datalist = document.getElementById('supplierListOptions');
            datalist.innerHTML = '';
            data.suppliers.forEach(s => {
                const option = document.createElement('option');
                option.value = s.name; 
                datalist.appendChild(option);
            });
        }

        function openCreateInquiryModal() {
            tempInquiryItems = [];
            document.getElementById('inquiryId').value = ''; 
            document.getElementById('inquiryModalTitle').innerText = '建立供應商詢價單 (新產品)';
            document.getElementById('inquirySupplierName').value = '';
            document.getElementById('inqItemName').value = '';
            document.getElementById('inqItemSpec').value = '';
            document.getElementById('inquiryNote').value = '';
            // v11.5: 預設狀態
            document.getElementById('inquiryStatus').value = 'waiting';
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('inquiryDate').value = today;

            updateSupplierDatalist();
            renderInquiryTempList();
            document.getElementById('modal-create-inquiry').classList.add('modal-active');
        }

        function openEditInquiry(id) {
            const inq = data.supplierInquiries.find(i => i.id === id);
            if (!inq) return;

            document.getElementById('inquiryId').value = inq.id;
            document.getElementById('inquiryModalTitle').innerText = '修改供應商詢價單';
            document.getElementById('inquirySupplierName').value = inq.supplierName;
            document.getElementById('inquiryDate').value = inq.date;
            document.getElementById('inquiryNote').value = inq.note || '';
            document.getElementById('inqItemName').value = '';
            document.getElementById('inqItemSpec').value = '';
            // v11.5: 載入狀態，舊資料預設 waiting
            document.getElementById('inquiryStatus').value = inq.status || 'waiting';

            tempInquiryItems = JSON.parse(JSON.stringify(inq.items)).map((item, index) => {
                if (inq.convertedItems && inq.convertedItems.includes(index)) {
                    item._converted = true;
                }
                return item;
            });

            updateSupplierDatalist();
            renderInquiryTempList();
            document.getElementById('modal-create-inquiry').classList.add('modal-active');
        }
        
        function openQuickAddSupplier() {
            document.getElementById('quickAddSupplierForm').reset();
            document.getElementById('modal-quick-add-supplier').classList.add('modal-active');
        }

        function addInquiryItemTemp() {
            const name = document.getElementById('inqItemName').value;
            const spec = document.getElementById('inqItemSpec').value;
            if(!name) return showToast('請輸入產品名稱', 'bg-red-500');

            tempInquiryItems.push({ name, spec });
            document.getElementById('inqItemName').value = '';
            document.getElementById('inqItemSpec').value = '';
            document.getElementById('inqItemName').focus();
            renderInquiryTempList();
        }

        function renderInquiryTempList() {
            const container = document.getElementById('inquiryTempList');
            container.innerHTML = '';
            
            tempInquiryItems.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.className = 'border-b';
                
                const statusBadge = item._converted 
                    ? '<span class="text-xs bg-green-100 text-green-700 px-1 rounded ml-1">已轉</span>' 
                    : '';

                tr.innerHTML = `
                    <td class="p-2">${item.name} ${statusBadge}</td>
                    <td class="p-2">${item.spec}</td>
                    <td class="p-2 text-center"><button onclick="removeInquiryTemp(${index})" class="text-red-500 hover:text-red-700">✕</button></td>
                `;
                container.appendChild(tr);
            });
        }

        function removeInquiryTemp(index) {
            tempInquiryItems.splice(index, 1);
            renderInquiryTempList();
        }

        function saveSupplierInquiry() {
            const supplierName = document.getElementById('inquirySupplierName').value;
            const note = document.getElementById('inquiryNote').value;
            const inquiryId = document.getElementById('inquiryId').value;
            const status = document.getElementById('inquiryStatus').value; // v11.5

            if(!supplierName) return showToast('請輸入供應商名稱', 'bg-red-500');
            if(tempInquiryItems.length === 0) return showToast('請至少新增一個項目', 'bg-red-500');

            const cleanItems = [];
            const newConvertedItems = [];

            tempInquiryItems.forEach((item, index) => {
                if (item._converted) {
                    newConvertedItems.push(index);
                }
                cleanItems.push({
                    name: item.name,
                    spec: item.spec
                });
            });

            const inquiryData = {
                id: inquiryId || ('inq_' + Date.now()),
                supplierName: supplierName,
                date: document.getElementById('inquiryDate').value,
                note: note,
                status: status, // v11.5 儲存狀態
                items: cleanItems,
                convertedItems: newConvertedItems 
            };

            if (inquiryId) {
                const index = data.supplierInquiries.findIndex(i => i.id === inquiryId);
                if (index !== -1) {
                    data.supplierInquiries[index] = inquiryData;
                    showToast('詢價單已更新', 'bg-indigo-600');
                }
            } else {
                data.supplierInquiries.unshift(inquiryData);
                showToast('供應商詢價單已建立', 'bg-indigo-600');
            }

            saveData();
            closeModal('modal-create-inquiry');
            renderSupplierInquiries();
        }

        // v11.5: 更新 renderSupplierInquiries 支援搜尋與狀態篩選
        function renderSupplierInquiries() {
            const keyword = document.getElementById('searchInquiryKeyword')?.value.toLowerCase() || '';
            const filterStatus = document.getElementById('filterInquiryStatus')?.value || 'all';
            const container = document.getElementById('supplierInquiryList');
            container.innerHTML = '';

            // 篩選邏輯
            const filtered = data.supplierInquiries.filter(inq => {
                const nameMatch = inq.supplierName.toLowerCase().includes(keyword);
                const noteMatch = (inq.note || '').toLowerCase().includes(keyword);
                const idMatch = inq.id.toLowerCase().includes(keyword);
                const itemMatch = (inq.items || []).some(item => (item.name || '').toLowerCase().includes(keyword));
                
                // v11.5 狀態篩選
                const currentStatus = inq.status || 'waiting'; // 舊資料預設為 waiting
                const statusMatch = filterStatus === 'all' || currentStatus === filterStatus;

                return (nameMatch || noteMatch || idMatch || itemMatch) && statusMatch;
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 py-8">沒有符合的詢價紀錄</div>';
                return;
            }

            filtered.forEach(inq => {
                const div = document.createElement('div');
                div.className = 'card p-4 border-l-4 border-indigo-500';
                
                // v11.5 狀態顯示邏輯
                const statusKey = inq.status || 'waiting';
                const statusInfo = inquiryStatusMap[statusKey] || inquiryStatusMap['waiting'];

                let itemsHtml = '';
                inq.items.forEach((item, idx) => {
                    const isConverted = inq.convertedItems && inq.convertedItems.includes(idx);
                    itemsHtml += `
                        <div class="flex justify-between items-center py-1 border-b last:border-0 border-gray-100 text-sm">
                            <span class="text-gray-700">▪ ${item.name} <span class="text-gray-400 text-xs">(${item.spec})</span></span>
                            ${isConverted ? 
                                '<span class="text-xs bg-green-100 text-green-700 px-2 rounded">已轉產品</span>' : 
                                `<button onclick="convertInquiryToProduct('${inq.id}', ${idx})" class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded hover:bg-indigo-200">轉為正式產品</button>`
                            }
                        </div>
                    `;
                });

                div.innerHTML = `
                    <div class="flex flex-col md:flex-row justify-between md:items-center mb-2 gap-2">
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-lg text-gray-800">${inq.supplierName}</h3>
                             <!-- v11.5 狀態 Badge -->
                            <span class="text-xs px-2 py-0.5 rounded border ${statusInfo.class} font-bold">${statusInfo.label}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="text-xs text-gray-500">日期: ${inq.date}</div>
                            <!-- v11.5 快速狀態切換選單 -->
                            <select onchange="quickUpdateInquiryStatus('${inq.id}', this.value)" class="text-xs border rounded p-1 bg-white ml-2 text-gray-600 focus:text-indigo-600 outline-none">
                                <option value="waiting" ${statusKey === 'waiting'?'selected':''}>等回覆</option>
                                <option value="replied" ${statusKey === 'replied'?'selected':''}>已回覆</option>
                                <option value="price_high" ${statusKey === 'price_high'?'selected':''}>價格高</option>
                                <option value="no_stock" ${statusKey === 'no_stock'?'selected':''}>無供貨</option>
                                <option value="converted" ${statusKey === 'converted'?'selected':''}>已轉產品</option>
                            </select>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 mb-2">備註: ${inq.note || '無'}</div>
                    <div class="bg-gray-50 p-2 rounded mb-3 space-y-1">
                        ${itemsHtml}
                    </div>
                    <div class="flex justify-end gap-2 border-t pt-2">
                         <button onclick="openEditInquiry('${inq.id}')" class="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm">修改</button>
                         <button onclick="deleteInquiry('${inq.id}')" class="px-3 py-1 text-red-500 hover:bg-red-50 rounded text-sm">刪除詢價單</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }
        
        // v11.5 快速更新狀態功能
        function quickUpdateInquiryStatus(id, newStatus) {
            const inq = data.supplierInquiries.find(i => i.id === id);
            if (inq) {
                inq.status = newStatus;
                saveData();
                renderSupplierInquiries(); // 重新渲染以更新顏色
                showToast('詢價單狀態已更新', 'bg-indigo-600');
            }
        }

        function convertInquiryToProduct(inquiryId, itemIndex) {
            const inq = data.supplierInquiries.find(i => i.id === inquiryId);
            if(!inq) return;
            const item = inq.items[itemIndex];

            const form = document.getElementById('addProductDirectForm');
            form.reset();
            
            const existingSupplier = data.suppliers.find(s => s.name === inq.supplierName);
            if (existingSupplier) {
                form.supplierId.value = existingSupplier.id;
                document.getElementById('directSupplierName').value = existingSupplier.name;
            } else {
                alert(`注意：系統中找不到名為「${inq.supplierName}」的供應商資料，請先至供應商管理新增，或於下拉選單選擇現有供應商。`);
                form.supplierId.value = "";
                document.getElementById('directSupplierName').value = `${inq.supplierName} (尚未建立資料)`;
            }

            form.prodName.value = item.name;
            form.spec.value = item.spec;
            form.prodNote.value = `來源: 詢價單 ${inquiryId}`;

            form.dataset.inquiryId = inquiryId;
            form.dataset.inquiryItemIndex = itemIndex;

            document.getElementById('modal-add-product-direct').classList.add('modal-active');
        }

        document.getElementById('addProductDirectForm').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            if (!formData.get('supplierId')) {
                const tempName = document.getElementById('directSupplierName').value.replace(' (尚未建立資料)', '');
                if (tempName) {
                    const newSupId = 's_' + Date.now();
                    const now = new Date().toISOString();
                    data.suppliers.push({ 
                        id: newSupId, 
                        name: tempName, 
                        taxId: '', 
                        contact: '', 
                        phone: '', 
                        address: '', 
                        note: '由詢價單自動建立',
                        createdAt: now,
                        updatedAt: now
                    });
                    formData.set('supplierId', newSupId); 
                    updateSupplierDatalist(); 
                } else {
                    return showToast('供應商資料有誤', 'bg-red-500');
                }
            }

            const newProduct = {
                id: generateProductID(),
                supplierId: formData.get('supplierId'),
                prodName: formData.get('prodName'),
                brandName: formData.get('brandName'),
                deliveryTime: formData.get('deliveryTime'),
                spec: formData.get('spec'),
                prodUrl: formData.get('prodUrl'),
                price: parseFloat(formData.get('price')) || 0,
                isTaxIncl: formData.get('isTaxIncl'),
                shipping: parseFloat(formData.get('shipping')) || 0,
                prodNote: formData.get('prodNote'),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            data.products.push(newProduct);

            const form = e.target;
            if (form.dataset.inquiryId) {
                const inq = data.supplierInquiries.find(i => i.id === form.dataset.inquiryId);
                if (inq) {
                    if (!inq.convertedItems) inq.convertedItems = [];
                    inq.convertedItems.push(parseInt(form.dataset.inquiryItemIndex));
                    delete form.dataset.inquiryId;
                    delete form.dataset.inquiryItemIndex;
                    
                    // v11.5 優化：若轉換成功，提示是否將整張詢價單改為「已轉正式產品」
                    if (confirm('產品已建立！是否將此詢價單狀態更新為「已轉正式產品」？')) {
                        inq.status = 'converted';
                    }
                    
                    renderSupplierInquiries(); 
                }
            }

            saveData();
            e.target.reset();
            closeModal('modal-add-product-direct');
            showToast('產品已成功新增！', 'bg-green-600');
            renderProducts();
            renderSuppliers(); 
        };


        function deleteInquiry(id) {
            if(confirm('確定刪除此詢價單？')) {
                data.supplierInquiries = data.supplierInquiries.filter(i => i.id !== id);
                saveData();
                renderSupplierInquiries();
            }
        }

        // ================= 渲染邏輯 (更新) =================
