function showPage(page) {
    const pages = {
        'main': document.getElementById('main-page'),
        'get-card': document.getElementById('get-card-page'),
        'support': document.getElementById('support-page'),
        'cabinet': document.getElementById('cabinet-page')
    };

    if (!pages[page]) {
        console.error('Page not found:', page);
        return;
    }

    Object.values(pages).forEach(p => p.classList.add('hidden'));
    pages[page].classList.remove('hidden');
    window.scrollTo(0, 0);
}

function openCabinet() {
    const iframe = document.getElementById('cabinet-iframe');
    if (iframe) {
        iframe.src = 'https://eks.sakhalin.gov.ru/cabinet/login';
    }
    showPage('cabinet');
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
    return phone.replace(/\D/g, '').replace(/^7/, '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '+7 ($1) $2-$3-$4');
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
    const cardType = form.querySelector('select[name="card_type"]').value;
    const phone = form.querySelector('input[name="phone"]').value;
    const consentCheckbox = form.querySelector('input[type="checkbox"][required]');
    const consentChecked = consentCheckbox ? consentCheckbox.checked : false;

    return bank && cardType && validatePhone(phone) && consentChecked;
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
    const phoneInputs = document.querySelectorAll('input[name="phone"]');
    
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
        
        getCardForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const checkboxes = this.querySelectorAll('input[type="checkbox"]');
            
            if (!validateGetCardForm(this)) {
                alert('Пожалуйста, заполните все поля правильно');
                return;
            }
            
            const data = {
                type: 'get_card',
                bank: formData.get('bank'),
                card_type: formData.get('card_type'),
                phone: formatPhone(formData.get('phone')),
                transport: checkboxes[0] ? checkboxes[0].checked : false,
                longevity: checkboxes[1] ? checkboxes[1].checked : false,
                aquapark: checkboxes[2] ? checkboxes[2].checked : false,
                consent: checkboxes[3] ? checkboxes[3].checked : false
            };

            sendToGateway(data);
            showModal('Заявка отправлена', 'Специалист банка свяжется с вами в ближайшее время');
            this.reset();
            submitBtn.disabled = true;
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