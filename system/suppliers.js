        // 供應商表單處理 (新增) - v11.4: 加入建檔日
        document.getElementById('supplierForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const now = new Date().toISOString();
            const newSupplier = {
                id: generateSupplierID(),
                name: formData.get('name'),
                taxId: formData.get('taxId'),
                phone: formData.get('phone'),
                contact: formData.get('contact'),
                companyPhone: formData.get('companyPhone'),
                website: formData.get('website'),
                address: formData.get('address'),
                paymentType: formData.get('paymentType'),
                monthlyDays: formData.get('monthlyDays'),
                remittanceAccount: formData.get('remittanceAccount'),
                note: formData.get('note'),
                createdAt: now, // v11.4 新增
                updatedAt: now  // v11.4 新增
            };
            data.suppliers.push(newSupplier);
            saveData();
            e.target.reset();
            // 重置 paymentType 顯示
            toggleMonthlyDays(document.querySelector('select[name="paymentType"]'), 'monthlyDaysWrapper');
            
            updateSupplierDatalist(); 
            showToast('供應商已儲存！', 'bg-blue-500');
            renderSuppliers();
        });

        // 快速新增供應商表單處理 (Nested Modal) - v11.4: 加入建檔日
        document.getElementById('quickAddSupplierForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const name = formData.get('quickName');
            const now = new Date().toISOString();
            
            const newSupplier = {
                id: generateSupplierID(),
                name: name,
                taxId: '',
                phone: formData.get('quickPhone'),
                contact: formData.get('quickContact'),
                website: '',
                address: '',
                paymentType: '現金',
                monthlyDays: '',
                note: '快速建立',
                createdAt: now,
                updatedAt: now
            };
            data.suppliers.push(newSupplier);
            saveData();
            updateSupplierDatalist();
            renderSuppliers();
            
            // 自動帶入詢價單欄位
            document.getElementById('inquirySupplierName').value = name;
            
            closeModal('modal-quick-add-supplier');
            e.target.reset();
            showToast('供應商已建立！', 'bg-green-600');
        });

        // 供應商表單處理 (修改) - v11.4: 更新修改日
        document.getElementById('editSupplierForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const id = formData.get('id');
            const index = data.suppliers.findIndex(s => s.id === id);
            if (index !== -1) {
                data.suppliers[index] = {
                    ...data.suppliers[index],
                    name: formData.get('name'),
                    taxId: formData.get('taxId'),
                    phone: formData.get('phone'),
                    contact: formData.get('contact'),
                    companyPhone: formData.get('companyPhone'),
                    website: formData.get('website'),
                    address: formData.get('address'),
                    paymentType: formData.get('paymentType'),
                    monthlyDays: formData.get('monthlyDays'),
                    remittanceAccount: formData.get('remittanceAccount'),
                    note: formData.get('note'),
                    updatedAt: new Date().toISOString() // v11.4 更新修改時間
                };
                saveData();
                updateSupplierDatalist();
                renderSuppliers();
                renderProducts(); // 更新產品列表中的供應商名稱
                closeModal('modal-edit-supplier');
                showToast('供應商資料已更新！', 'bg-blue-600');
            }
        });

        // 供應商搜尋相關事件監聽器
        // 新增產品表單的供應商搜尋
        const supplierSearchInput = document.getElementById('supplierSearchInput');
        const supplierIdField = document.getElementById('supplierId');
        if (supplierSearchInput) {
            supplierSearchInput.addEventListener('change', (e) => {
                const selectedName = e.target.value;
                const selectedSupplier = data.suppliers.find(s => s.name === selectedName);
                if (selectedSupplier) {
                    supplierIdField.value = selectedSupplier.id;
                } else {
                    supplierIdField.value = '';
                    e.target.value = '';
                }
            });
            supplierSearchInput.addEventListener('input', (e) => {
                const inputVal = e.target.value;
                const supplierIdHidden = document.getElementById('supplierId');
                // 如果输入值不在下拉选项中，清空hidden字段
                const matchedSupplier = data.suppliers.find(s => s.name === inputVal);
                if (!matchedSupplier && inputVal.length > 0) {
                    supplierIdHidden.value = '';
                }
            });
        }

        // 編輯產品表單的供應商搜尋
        const editSupplierSearchInput = document.getElementById('editSupplierSearchInput');
        const editSupplierIdField = document.getElementById('editSupplierId');
        if (editSupplierSearchInput) {
            editSupplierSearchInput.addEventListener('change', (e) => {
                const selectedName = e.target.value;
                const selectedSupplier = data.suppliers.find(s => s.name === selectedName);
                if (selectedSupplier) {
                    editSupplierIdField.value = selectedSupplier.id;
                } else {
                    editSupplierIdField.value = '';
                    e.target.value = '';
                }
            });
            editSupplierSearchInput.addEventListener('input', (e) => {
                const inputVal = e.target.value;
                const supplierIdHidden = document.getElementById('editSupplierId');
                // 如果输入值不在下拉选项中，清空hidden字段
                const matchedSupplier = data.suppliers.find(s => s.name === inputVal);
                if (!matchedSupplier && inputVal.length > 0) {
                    supplierIdHidden.value = '';
                }
            });
        }
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
        }
        // 供應商渲染 - v11.4: 顯示建檔日與修改日
        function renderSuppliers() {
            const keyword = getInputValue('searchSupplier').toLowerCase();

            const filtered = filterSafe(data.suppliers, s => 
                (s.name || '').toLowerCase().includes(keyword) || 
                (s.taxId || '').toLowerCase().includes(keyword) ||
                (s.contact || '').toLowerCase().includes(keyword)
            );

            renderList('supplierList', filtered, (fragment, s) => {
                const item = document.createElement('div');
                item.className = 'bg-white border rounded shadow-sm overflow-hidden';
                const paymentInfo = s.paymentType ? `${s.paymentType} ${s.paymentType === '月結' ? (s.monthlyDays + '天') : ''}` : '未設定';

                const createdDate = formatDateTime(s.createdAt);
                const updatedDate = formatDateTime(s.updatedAt);

                item.innerHTML = `
                    <div class="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition" onclick="toggleSupplierDetails('${s.id}')">
                        <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                             <div class="font-bold text-gray-800 text-lg">${s.name}</div>
                             ${s.taxId ? `<span class="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded w-fit">統編: ${s.taxId}</span>` : ''}
                        </div>
                        <div class="text-gray-400">
                            <svg id="icon-${s.id}" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <div id="details-${s.id}" class="hidden border-t bg-gray-50 p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                            <p><strong>聯絡人:</strong> ${s.contact || '-'}</p>
                            <p><strong>聯絡人電話:</strong> ${s.phone || '-'}</p>
                            <p><strong>公司電話:</strong> ${s.companyPhone || '-'}</p>
                            <p><strong>公司統編:</strong> ${s.taxId || '-'}</p>
                            <p><strong>匯款帳號:</strong> ${s.remittanceAccount || '-'}</p>
                            <p><strong>地址:</strong> ${s.address || '-'}</p>
                            <p><strong>網址:</strong> ${s.website ? `<a href="${s.website}" target="_blank" class="text-blue-600 hover:underline">連結</a>` : '-'}</p>
                            <p><strong>付款條件:</strong> <span class="font-bold text-blue-700">${paymentInfo}</span></p>
                            <p class="text-gray-500 text-xs mt-1"><strong>建檔時間:</strong> ${createdDate}</p>
                            <p class="text-gray-500 text-xs mt-1"><strong>最後修改:</strong> ${updatedDate}</p>
                            <div class="col-span-1 md:col-span-2">
                                <strong>備註:</strong> ${s.note || '無'}
                            </div>
                        </div>
                        <div class="flex gap-2 justify-end">
                             <button onclick="openAddProductModal('${s.id}')" class="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold flex items-center gap-1">
                                + 新增產品
                            </button>
                            <button onclick="openEditSupplier('${s.id}')" class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium">修改</button>
                            <button onclick="deleteSupplier('${s.id}')" class="px-3 py-1.5 bg-red-100 text-red-500 rounded hover:bg-red-200 text-sm font-medium">刪除</button>
                        </div>
                    </div>
                `;

                fragment.appendChild(item);
            }, '<div class="text-center text-gray-400 py-8">沒有符合搜尋條件的供應商</div>');
        }
function toggleSupplierDetails(id) {
            const details = document.getElementById(`details-${id}`);
            const icon = document.getElementById(`icon-${id}`);
            if (details.classList.contains('hidden')) {
                details.classList.remove('hidden');
                icon.classList.add('rotate-180');
            } else {
                details.classList.add('hidden');
                icon.classList.remove('rotate-180');
            }
        }

        function updateSupplierSelect() {
            // 更新新增產品表單的datalist
            const newProductDatalist = document.getElementById('supplierListForProduct');
            if (newProductDatalist) {
                newProductDatalist.innerHTML = '';
                data.suppliers.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.name;
                    opt.dataset.id = s.id;
                    newProductDatalist.appendChild(opt);
                });
            }
            
            // 更新編輯產品表單的datalist
            const editProductDatalist = document.getElementById('editSupplierListForProduct');
            if (editProductDatalist) {
                editProductDatalist.innerHTML = '';
                data.suppliers.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.name;
                    opt.dataset.id = s.id;
                    editProductDatalist.appendChild(opt);
                });
            }
        }
        function openEditSupplier(id) {
            const s = data.suppliers.find(item => item.id === id);
            if (!s) return;
            const form = document.getElementById('editSupplierForm');
            form.id.value = s.id;
            form.name.value = s.name;
            document.getElementById('editSupplierCode').value = s.id || '';
            form.taxId.value = s.taxId || '';
            form.phone.value = s.phone || '';
            form.contact.value = s.contact || '';
            form.website.value = s.website || '';
            form.address.value = s.address || '';
            form.paymentType.value = s.paymentType || '現金';
            form.monthlyDays.value = s.monthlyDays || '';
            form.remittanceAccount.value = s.remittanceAccount || '';
            form.note.value = s.note || '';
            
            // 觸發顯示切換
            toggleMonthlyDays(form.paymentType, 'editMonthlyDaysWrapper');
            
            document.getElementById('modal-edit-supplier').classList.add('modal-active');
        }

        function deleteSupplier(id) {
            if (confirm('確定刪除此供應商？相關產品與訂單可能無法正確顯示。')) {
                data.suppliers = data.suppliers.filter(s => s.id !== id);
                saveData();
                renderSuppliers();
                renderProducts();
            }
        }
