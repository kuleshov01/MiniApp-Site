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

function openCabinet() {
    window.open('https://eks.sakhalin.gov.ru/cabinet/login', '_blank');
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

function formatPhone(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '').replace(/^7/, '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '+7 ($1) $2-$3-$4');
}

function validatePhone(phone) {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Check if it starts with 7 or 8 and has 11 digits total
    if ((digitsOnly.startsWith('7') || digitsOnly.startsWith('8')) && digitsOnly.length === 11) {
        // Additional check: ensure the operator code is valid (first digit after country code should be 9)
        const operatorCode = digitsOnly.substring(1, 4); // Get the 3 digits after country code
        if (operatorCode.startsWith('9')) {
            return true;
        }
    }

    // Or check if it has exactly 10 digits (without leading 7 or 8), starting with 9
    if (digitsOnly.length === 10 && digitsOnly.startsWith('9')) {
        return true;
    }

    return false;
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

document.addEventListener('DOMContentLoaded', function() {
    const getCardForm = document.getElementById('get-card-form');
    if (getCardForm) {
        getCardForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const checkboxes = this.querySelectorAll('input[type="checkbox"]');
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
        });
    }

    const supportForm = document.getElementById('support-form');
    if (supportForm) {
        supportForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const phoneInput = this.querySelector('input[name="phone"]');
            const emailInput = this.querySelector('input[name="email"]');
            const checkbox = this.querySelector('input[type="checkbox"]');

            // Validate phone number
            if (!validatePhone(formData.get('phone'))) {
                alert('Пожалуйста, введите действительный номер телефона формата +7 (XXX) XXX-XX-XX');
                phoneInput.focus();
                return;
            }

            // Validate email
            const emailValue = formData.get('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                alert('Пожалуйста, введите действительный адрес электронной почты');
                emailInput.focus();
                return;
            }

            const data = {
                type: 'support',
                name: formData.get('name'),
                phone: formatPhone(formData.get('phone')),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                consent: checkbox ? checkbox.checked : false
            };

            sendToGateway(data);
            showModal('Сообщение отправлено', 'Служба поддержки свяжется с вами в ближайшее время');
            this.reset();
        });
    }
});