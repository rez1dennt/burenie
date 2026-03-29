'use strict';

// ─── NAV SCROLL ───────────────────────────────────────────────
const nav = document.getElementById('nav');

const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ─── MOBILE MENU + SCROLL LOCK ────────────────────────────────
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');

const closeMenu = () => {
  mobileMenu.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('menu-open');
};

burger.addEventListener('click', () => {
  const opening = !mobileMenu.classList.contains('open');
  if (opening) {
    mobileMenu.classList.add('open');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
  } else {
    closeMenu();
  }
});

document.querySelectorAll('.mob-link').forEach(link =>
  link.addEventListener('click', closeMenu)
);

document.addEventListener('click', e => {
  if (!nav.contains(e.target)) closeMenu();
});

// ─── SMOOTH SCROLL ────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ─── ANIMATED COUNTERS ────────────────────────────────────────
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

const animateCounter = el => {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const start    = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(easeOutCubic(p) * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll('.stat-num[data-target]').forEach(el =>
  counterObserver.observe(el)
);

// ─── PHONE MASK (исправленная) ───────────────────────────────
// Суть бага: при ровно 4/7/9 цифрах маска добавляла хвост-разделитель
// (например «) » после 4 цифр), backspace удалял его, маска тут же
// возвращала — пользователь застревал. Исправлено: разделитель
// добавляется только когда следующих цифр УЖЕ больше порога (>4, >7, >9).

const phoneInput = document.getElementById('phone');
if (phoneInput) {
  const formatPhone = digits => {
    if (!digits) return '';
    let out = '+7';
    // Открываем скобку только если есть хоть одна цифра зоны
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    // Закрываем скобку и добавляем следующие цифры только если они есть
    if (digits.length > 4) out += ') ' + digits.slice(4, 7);
    if (digits.length > 7) out += '-' + digits.slice(7, 9);
    if (digits.length > 9) out += '-' + digits.slice(9, 11);
    return out;
  };

  phoneInput.addEventListener('input', e => {
    const input = e.target;
    let v = input.value.replace(/\D/g, '');

    // Нормализуем страновой код
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (v.length && !v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);

    input.value = formatPhone(v);
  });

  // Начальный placeholder
  phoneInput.addEventListener('focus', e => {
    if (!e.target.value) e.target.value = '+7 ';
  });
  phoneInput.addEventListener('blur', e => {
    if (e.target.value === '+7 ' || e.target.value === '+7') e.target.value = '';
  });
}

// ─── SELECT ARROW STATE ──────────────────────────────────────
const selectWraps = [...document.querySelectorAll('.select-wrap')];
const closeSelectArrows = () => {
  selectWraps.forEach(wrap => wrap.classList.remove('is-open'));
};

document.addEventListener('pointerdown', e => {
  selectWraps.forEach(wrap => {
    if (!wrap.contains(e.target)) wrap.classList.remove('is-open');
  });
});

window.addEventListener('blur', closeSelectArrows);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSelectArrows();
});

document.querySelectorAll('.select-wrap select').forEach(select => {
  const wrap = select.closest('.select-wrap');
  if (!wrap) return;

  const open = () => wrap.classList.add('is-open');
  const close = () => wrap.classList.remove('is-open');
  const toggle = () => wrap.classList.toggle('is-open');

  select.addEventListener('pointerdown', toggle);
  select.addEventListener('change', close);
  select.addEventListener('blur', close);
  select.addEventListener('keydown', e => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) open();
    if (['Escape', 'Tab'].includes(e.key)) close();
  });
});

// ─── ВАЛИДАЦИЯ ФОРМЫ ─────────────────────────────────────────
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const formWrap    = form?.closest('.form-wrap');

const showError = (field, msg) => {
  field.classList.add('error');
  let err = field.parentElement.querySelector('.field-err');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-err';
    err.style.cssText = 'display:block;font-size:12px;color:#d85050;margin-top:4px;';
    field.parentElement.appendChild(err);
  }
  err.textContent = msg;
};

const clearError = field => {
  field.classList.remove('error');
  const err = field.parentElement.querySelector('.field-err');
  if (err) err.textContent = '';
};

// Правила валидации
const rules = {
  name: {
    validate: v => v.trim().length >= 2,
    message:  'Введите имя (минимум 2 символа)'
  },
  phone: {
    validate: v => /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(v.trim()),
    message:  'Введите полный номер: +7 (xxx) xxx-xx-xx'
  }
};

// ─── СБРОС ФОРМЫ ─────────────────────────────────────────────
let resetTimer    = null;
let countdownTick = null;

const resetForm = () => {
  if (!form || !formSuccess || !formWrap) return;
  clearTimeout(resetTimer);
  clearInterval(countdownTick);

  // Показываем форму, скрываем успех
  formSuccess.hidden = true;
  form.hidden        = false;
  formWrap.classList.remove('success-shown');

  // Возвращаем кнопку
  const btn = form.querySelector('.btn-submit');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>Отправить заявку`;
  }

  // Чистим поля и ошибки
  form.reset();
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.field-err').forEach(el => { el.textContent = ''; });
};

// ─── ОТПРАВКА ФОРМЫ ──────────────────────────────────────────
if (form && formSuccess && formWrap) {
  form.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('input',  () => clearError(field));
    field.addEventListener('change', () => clearError(field));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    let valid = true;
    let firstError = null;

    Object.entries(rules).forEach(([name, rule]) => {
      const field = form.elements[name];
      if (!field) return;
      clearError(field);
      if (!rule.validate(field.value)) {
        showError(field, rule.message);
        valid = false;
        if (!firstError) firstError = field;
      }
    });

    if (!valid) {
      firstError?.focus();
      shakeBtn(form.querySelector('.btn-submit'));
      return;
    }

    // Отправляем (здесь подключить реальный fetch к бэкенду)
    const btn = form.querySelector('.btn-submit');
    btn.disabled    = true;
    btn.textContent = 'Отправляем…';

    setTimeout(() => {
      // Показываем успех, скрываем форму и заголовок блока
      form.hidden = true;
      formWrap.classList.add('success-shown');

      // Пересоздаём countdown-bar-fill чтобы анимация стартовала заново
      const fill = document.getElementById('countdownFill');
      if (fill) {
        fill.style.animation = 'none';
        void fill.offsetWidth; // reflow
        fill.style.animation = '';
      }

      formSuccess.hidden = false;

      // Живой обратный отсчёт
      const countdownEl = document.getElementById('countdown');
      let seconds = 10;
      if (countdownEl) countdownEl.textContent = seconds;

      clearInterval(countdownTick);
      countdownTick = setInterval(() => {
        seconds -= 1;
        if (countdownEl) countdownEl.textContent = seconds;
        if (seconds <= 0) clearInterval(countdownTick);
      }, 1000);

      // Автосброс через 10 секунд
      resetTimer = setTimeout(resetForm, 10_000);
    }, 900);
  });
}

// ─── SHAKE ───────────────────────────────────────────────────
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform:translateX(0); }
    20%,60%  { transform:translateX(-6px); }
    40%,80%  { transform:translateX(6px); }
  }
  .shaking { animation: shake .38s ease; }
`;
document.head.appendChild(shakeStyle);

const shakeBtn = btn => {
  if (!btn) return;
  btn.classList.remove('shaking');
  void btn.offsetWidth;
  btn.classList.add('shaking');
  btn.addEventListener('animationend', () => btn.classList.remove('shaking'), { once: true });
};
