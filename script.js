function showPage(page) {
    const pages = {
        'main': document.getElementById('main-page'),
        'get-card': document.getElementById('get-card-page'),
        'support': document.getElementById('support-page')
    };

    if (!pages[page]) {
        console.error('Page not found:', page);
        return;
    }

    Object.values(pages).forEach(p => p.classList.add('hidden'));
    pages[page].classList.remove('hidden');
    window.scrollTo(0, 0);
}

function showModal(title, message) {
    const modal = document.getElementById('success-modal');
    if (!modal) return;

    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    showPage('main');
}

function formatPhoneInput(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        if (value[0] === '8') {
            value = '7' + value.slice(1);
        }
        if (value[0] !== '7') {
            value = '7' + value;
        }
    }
    
    value = value.substring(0, 11);
    
    // Форматируем как +7 (999) 999-99-99 (с дефисами как в оригинальной форме)
    let formatted = '';
    if (value.length > 0) {
        formatted = '+7';
        if (value.length > 1) {
            formatted += ' (' + value.substring(1, 4);
        }
        if (value.length > 4) {
            formatted += ') ' + value.substring(4, 7);
        }
        if (value.length > 7) {
            formatted += '-' + value.substring(7, 9);
        }
        if (value.length > 9) {
            formatted += '-' + value.substring(9, 11);
        }
    }
    
    input.value = formatted;
    
    const isValid = validatePhone(formatted);
    if (isValid) {
        input.style.borderColor = '#27ae60';
    } else if (value.length === 11) {
        input.style.borderColor = '#e74c3c';
    } else {
        input.style.borderColor = '#d1d5db';
    }
    
    return formatted;
}

function formatPhone(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return '+7 (' + digits.substring(1, 4) + ') ' + digits.substring(4, 7) + '-' + digits.substring(7, 9) + '-' + digits.substring(9, 11);
    }
    return phone;
}

function validatePhone(phone) {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 11 && digitsOnly.startsWith('7');
}

function sendToGateway(data) {
    const gatewayUrl = 'https://eks.sakhalin.gov.ru/api/gateway';

    fetch(gatewayUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response:', response);
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function validateGetCardForm(form) {
    const bank = form.querySelector('select[name="bank"]').value;
    const forwhom = form.querySelector('select[name="forwhom"]').value;
    const lastname = form.querySelector('input[name="lastname"]').value.trim();
    const name = form.querySelector('input[name="name"]').value.trim();
    const mobPhone = form.querySelector('input[name="mobPhone"]').value;
    const persAgreeCheckbox = form.querySelector('input[name="persAgree"]');
    const persAgreeChecked = persAgreeCheckbox ? persAgreeCheckbox.checked : false;

    return bank && forwhom && lastname && name && validatePhone(mobPhone) && persAgreeChecked;
}

function validateSupportForm(form) {
    const name = form.querySelector('input[name="name"]').value.trim();
    const phone = form.querySelector('input[name="phone"]').value;
    const email = form.querySelector('input[name="email"]').value;
    const subject = form.querySelector('select[name="subject"]').value;
    const message = form.querySelector('textarea[name="message"]').value.trim();
    const consentChecked = form.querySelector('input[type="checkbox"][required]').checked;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    console.log('Validation check:', {
        name: !!name,
        phone: validatePhone(phone),
        email: emailRegex.test(email),
        subject: !!subject,
        message: !!message,
        consent: consentChecked
    });
    
    return name && validatePhone(phone) && emailRegex.test(email) && subject && message && consentChecked;
}

document.addEventListener('DOMContentLoaded', function() {
    // Обработчик выбора банка
    const bankSelect = document.querySelector('select[name="bank"]');
    if (bankSelect) {
        bankSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const bankId = selectedOption.getAttribute('data-id');
            const bankIdInput = this.closest('form').querySelector('input[name="bank-id"]');
            if (bankIdInput) {
                bankIdInput.value = bankId || '';
            }
        });
    }

    // Обработчик выбора "На кого оформляется карта"
    const forwhomSelect = document.querySelector('select[name="forwhom"]');
    if (forwhomSelect) {
        forwhomSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const forwhomId = selectedOption.getAttribute('data-id');
            const forwhomIdInput = this.closest('form').querySelector('input[name="forwhom-id"]');
            if (forwhomIdInput) {
                forwhomIdInput.value = forwhomId || '';
            }
        });
    }

    const phoneInputs = document.querySelectorAll('input[name="phone"], input[name="mobPhone"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            formatPhoneInput(this);
            
            const form = this.closest('form');
            if (form) {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (form.id === 'get-card-form') {
                    submitBtn.disabled = !validateGetCardForm(form);
                } else if (form.id === 'support-form') {
                    submitBtn.disabled = !validateSupportForm(form);
                }
            }
        });
        
        input.addEventListener('blur', function() {
            const value = this.value.replace(/\D/g, '');
            if (value.length > 0 && value.length < 11) {
                this.style.borderColor = '#e74c3c';
            } else if (value.length === 11) {
                this.style.borderColor = validatePhone(this.value) ? '#27ae60' : '#e74c3c';
            } else {
                this.style.borderColor = '';
            }
        });
    });

    const getCardForm = document.getElementById('get-card-form');
    if (getCardForm) {
        const submitBtn = getCardForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        
        function updateSubmitBtn() {
            submitBtn.disabled = !validateGetCardForm(getCardForm);
        }
        
        const inputs = getCardForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', updateSubmitBtn);
            input.addEventListener('change', updateSubmitBtn);
            input.addEventListener('blur', updateSubmitBtn);
        });
        
        getCardForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            
            if (!validateGetCardForm(this)) {
                alert('Пожалуйста, заполните все поля правильно');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
            
            try {
                // Формируем данные формы в формате application/x-www-form-urlencoded
                const params = new URLSearchParams();
                
                // Добавляем все поля
                for (const [key, value] of formData.entries()) {
                    if (value === 'on') {
                        params.append(key, 'on');
                    } else if (value) {
                        params.append(key, value);
                    }
                }
                
                // Добавляем timestamp/номер заявки
                params.append('n', Date.now().toString());
                
                // Отправляем запрос на правильный эндпоинт
                const response = await fetch('https://eks.sakhalin.gov.ru/sendmail-bank-applying/', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': '*/*',
                        'Accept-Language': 'ru-RU,ru;q=0.9,en-RU;q=0.8,en;q=0.7,en-US;q=0.6'
                    },
                    credentials: 'include',
                    body: params
                });
                
                // В режиме no-cors мы не можем получить ответ от сервера
                // Считаем запрос успешным, если не возникло ошибки сети
                showModal('Заявка отправлена', 'Специалист банка свяжется с вами в ближайшее время');
                this.reset();
                submitBtn.disabled = true;
                
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка соединения: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить заявку';
            }
        });
    }

    const supportForm = document.getElementById('support-form');
    console.log('Support form found:', !!supportForm);
    if (supportForm) {
        const submitBtn = supportForm.querySelector('button[type="submit"]');
        console.log('Submit button found:', !!submitBtn);
        submitBtn.disabled = true;
        
        function updateSubmitBtn() {
            const isValid = validateSupportForm(supportForm);
            console.log('Support form validation:', isValid);
            submitBtn.disabled = !isValid;
        }
        
        const inputs = supportForm.querySelectorAll('input, select, textarea');
        console.log('Inputs found:', inputs.length);
        inputs.forEach(input => {
            input.addEventListener('input', updateSubmitBtn);
            input.addEventListener('change', updateSubmitBtn);
            input.addEventListener('blur', updateSubmitBtn);
        });
        
        supportForm.addEventListener('submit', function(e) {
            console.log('Support form submit triggered');
            e.preventDefault();

            const formData = new FormData(this);
            console.log('Form data collected');

            if (!validateSupportForm(this)) {
                console.log('Validation failed');
                alert('Пожалуйста, заполните все поля правильно');
                return;
            }
            
            const data = {
                type: 'support',
                name: formData.get('name'),
                phone: formatPhone(formData.get('phone')),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                consent: this.querySelector('input[type="checkbox"][required]').checked
            };
            console.log('Data prepared:', data);

            sendToGateway(data);
            showModal('Сообщение отправлено', 'Служба поддержки свяжется с вами в ближайшее время');
            this.reset();
            submitBtn.disabled = true;
        });
    }
});