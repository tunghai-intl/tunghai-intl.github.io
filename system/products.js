        // 產品表單處理 (新增 - 原始頁籤)
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
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
            saveData();
            e.target.reset();
            showToast('產品報價已儲存！', 'bg-orange-500');
            renderProducts();
        });

        // 表單驗證輔助函數
        function validateField(field) {
            const value = field.value.trim();
            const isRequired = field.hasAttribute('required');
            
            if (isRequired && !value) {
                showFieldError(field, '此欄位為必填');
                return false;
            }
            
            clearFieldError(field);
            return true;
        }
        
        function showFieldError(field, message) {
            clearFieldError(field);
            field.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'text-red-500 text-xs mt-1 error-message';
            errorDiv.textContent = message;
            
            field.parentNode.appendChild(errorDiv);
        }
        
        function clearFieldError(field) {
            field.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
            
            const errorMessage = field.parentNode.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        }
        const editProductForm = document.getElementById('editProductForm');
        if (editProductForm) {
            const requiredFields = ['supplierId', 'prodName'];
            requiredFields.forEach(fieldName => {
                const field = editProductForm[fieldName];
                if (field) {
                    field.addEventListener('blur', () => {
                        validateField(field);
                    });
                }
            });
            
            // 供應商搜尋輸入驗證
            const supplierSearchInput = document.getElementById('editSupplierSearchInput');
            if (supplierSearchInput) {
                supplierSearchInput.addEventListener('blur', () => {
                    const supplierId = document.getElementById('editSupplierId').value;
                    if (!supplierId) {
                        showFieldError(supplierSearchInput, '請選擇有效的供應商');
                    } else {
                        clearFieldError(supplierSearchInput);
                    }
                });
            }
        }
        document.getElementById('editProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const originalId = formData.get('id');
            const newId = formData.get('id').trim();
            const productName = formData.get('prodName');
            
            // 檢查產品編號是否重複
            if (checkProductIdDuplicate(newId, originalId)) {
                showToast('產品編號重複，請使用其他編號', 'bg-red-500');
                return;
            }
            
            // 確認編輯
            if (!confirm(`確定要修改產品「${productName}」(編號: ${newId}) 的報價資訊嗎？`)) {
                return;
            }
            
            // 顯示載入狀態
            const submitBtn = document.getElementById('editProductSubmitBtn');
            const submitText = document.getElementById('editProductSubmitText');
            const originalText = submitText.textContent;
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
            submitText.textContent = '更新中...';
            
            try {
                const index = data.products.findIndex(p => p.id === originalId);
                if (index !== -1) {
                    const updatedProduct = {
                        ...data.products[index],
                        id: newId,
                        supplierId: formData.get('supplierId'),
                        prodName: formData.get('prodName'),
                        brandName: formData.get('brandName'),
                        deliveryTime: formData.get('deliveryTime'), 
                        spec: formData.get('spec'),
                        prodUrl: formData.get('prodUrl'),
                        price: parseFloat(formData.get('price')) || 0,
                        salesPrice: parseFloat(formData.get('salesPrice')) || 0,
                        isTaxIncl: formData.get('isTaxIncl'),
                        shipping: parseFloat(formData.get('shipping')) || 0,
                        prodNote: formData.get('prodNote'),
                        updatedAt: new Date().toISOString()
                    };
                    
                    // 如果是新建產品，設置 createdAt
                    if (!updatedProduct.createdAt) {
                        updatedProduct.createdAt = new Date().toISOString();
                    }
                    
                    data.products[index] = updatedProduct;
                    saveData();
                    renderProducts();
                    closeModal('modal-edit-product');
                    showToast('產品報價已更新！', 'bg-orange-600');
                }
            } catch (error) {
                console.error('更新產品失敗:', error);
                showToast('更新失敗，請重試', 'bg-red-500');
            } finally {
                // 恢復按鈕狀態
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                submitText.textContent = originalText;
            }
        });
        function renderProducts() {
            const keyword = getInputValue('searchProduct').toLowerCase();
            const supplierMap = new Map((data.suppliers || []).map(s => [s.id, s.name]));

            const filtered = filterSafe(data.products, p => {
                const supplierName = supplierMap.get(p.supplierId) || '';
                return (p.prodName || '').toLowerCase().includes(keyword) || 
                       ((p.spec || '').toLowerCase().includes(keyword)) ||
                       supplierName.toLowerCase().includes(keyword);
            });

            renderList('productList', filtered, (fragment, p) => {
                const supplierName = supplierMap.get(p.supplierId) || '';
                const urlLink = p.prodUrl ? `<a href="${p.prodUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 ml-1 inline-block align-middle" title="開啟產品網頁"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>` : '';
                const tr = document.createElement('tr');
                tr.className = 'border-b hover:bg-gray-50 group';
                tr.innerHTML = `
                    <td class="p-4 align-top">
                        <div class="font-bold text-gray-800 flex items-center">${p.prodName}${urlLink}</div>
                        <div class="text-xs text-gray-500">${p.spec || '無規格'}</div>
                        <div class="text-xs text-gray-400 mt-1">${p.prodNote || ''}</div>
                    </td>
                    <td class="p-4 align-top text-sm">
                        <div class="font-medium">${supplierName ? supplierName : '<span class="text-red-400">未知供應商</span>'}</div>
                    </td>
                    <td class="p-4 align-top text-sm">
                        <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">${p.deliveryTime || '未定'}</span>
                    </td>
                    <td class="p-4 align-top font-mono text-blue-600 font-bold">$${p.price}</td>
                    <td class="p-4 align-top text-sm">${p.isTaxIncl}</td>
                    <td class="p-4 align-top text-sm text-gray-500">$${p.shipping || 0}</td>
                    <td class="p-4 align-top">
                        <div class="flex flex-col gap-2">
                            <button onclick="addToCart('${p.id}')" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm shadow-sm">加入採購</button>
                            <div class="flex gap-2 text-xs">
                                <button onclick="openEditProduct('${p.id}')" class="text-orange-500 hover:underline">修改</button>
                                <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:underline">刪除</button>
                            </div>
                        </div>
                    </td>
                `;
                fragment.appendChild(tr);
            }, '<tr><td colspan="7" class="p-8 text-center text-gray-400">沒有符合搜尋條件的產品</td></tr>');
        }

        function openEditProduct(id) {
            const p = data.products.find(item => item.id === id);
            if (!p) return;
            updateSupplierSelect(); 
            const form = document.getElementById('editProductForm');
            const supplier = data.suppliers.find(s => s.id === p.supplierId);
            
            // 顯示產品編號和時間戳
            document.getElementById('editProductId').value = p.id;
            document.getElementById('editProductCreatedAt').textContent = p.createdAt ? new Date(p.createdAt).toLocaleString('zh-TW') : '-';
            document.getElementById('editProductUpdatedAt').textContent = p.updatedAt ? new Date(p.updatedAt).toLocaleString('zh-TW') : '-';
            
            form.id.value = p.id;
            document.getElementById('editSupplierId').value = p.supplierId;
            document.getElementById('editSupplierSearchInput').value = supplier ? supplier.name : '';
            form.prodName.value = p.prodName;
            form.brandName.value = p.brandName || '';
            form.deliveryTime.value = p.deliveryTime || '';
            form.spec.value = p.spec || '';
            form.prodUrl.value = p.prodUrl || '';
            form.price.value = p.price || '';
            form.salesPrice.value = p.salesPrice || '';
            form.isTaxIncl.value = p.isTaxIncl || '含稅';
            form.shipping.value = p.shipping || 0;
            form.prodNote.value = p.prodNote || '';
            document.getElementById('modal-edit-product').classList.add('modal-active');
        }

        // 產品編號重複檢查函數
        function checkProductIdDuplicate(productId, excludeId = null) {
            return data.products.some(p => p.id === productId && p.id !== excludeId);
        }

        // 產品編號輸入驗證
        const editProductIdInput = document.getElementById('editProductId');
        if (editProductIdInput) {
            editProductIdInput.addEventListener('input', (e) => {
                const newId = e.target.value.trim();
                const originalId = document.getElementById('editProductForm').id.value;
                const errorDiv = document.getElementById('productIdError');
                
                if (newId && checkProductIdDuplicate(newId, originalId)) {
                    errorDiv.classList.remove('hidden');
                    errorDiv.textContent = '此編號已存在，請使用其他編號';
                    e.target.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                } else {
                    errorDiv.classList.add('hidden');
                    e.target.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                }
            });
        }

        function openAddProductModal(supplierId) {
            const s = data.suppliers.find(item => item.id === supplierId);
            if (!s) return;
            
            const form = document.getElementById('addProductDirectForm');
            form.reset(); 
            form.supplierId.value = s.id;
            document.getElementById('directSupplierName').value = s.name;
            
            document.getElementById('modal-add-product-direct').classList.add('modal-active');
        }
        function deleteProduct(id) {
            if (confirm('確定刪除此產品報價？')) {
                data.products = data.products.filter(p => p.id !== id);
                saveData();
                renderProducts();
            }
        }
