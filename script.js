// script.js

"use strict";

/* =========================================
   1. Вспомогательные функции
========================================= */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const phoneRegex = /^[+\d][\d\s\-()]{9,}$/;

function showToast(message = "Готово") {
  const toast = $("[data-toast]");
  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3500);
}

function setError(form, fieldName, message) {
  const errorNode = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (errorNode) errorNode.textContent = message || "";
}

function clearErrors(form) {
  $$("[data-error-for]", form).forEach((node) => {
    node.textContent = "";
  });
}

/* =========================================
   2. Год в footer
========================================= */
const yearNode = $("[data-year]");
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

/* =========================================
   3. Мобильное меню
========================================= */
const navToggle = $("[data-nav-toggle]");
const navMenu = $("[data-nav-menu]");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$(".nav-link-custom", navMenu).forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* =========================================
   4. Анимации появления при скролле
========================================= */
const revealItems = $$(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

/* =========================================
   5. Модальные окна
========================================= */
let lastFocusedElement = null;

function openModal(modalId, productName = "") {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Если открываем заявку из рекламного модального окна — закрываем старое
  $$(".modal-overlay").forEach((item) => {
    if (item.id !== modalId) item.hidden = true;
  });

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = "hidden";

  const productInput = $("[data-modal-product]", modal);
  if (productInput && productName) {
    productInput.value = productName;
  }

  const firstInput = $("input, button, textarea, select", modal);
  if (firstInput) firstInput.focus();
}

function closeModal(modal) {
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = "";

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

$$("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    const modalId = button.dataset.openModal;
    const productName = button.dataset.product || "";
    openModal(modalId, productName);
  });
});

$$("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    closeModal(button.closest(".modal-overlay"));
  });
});

$$(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal(overlay);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const openedModal = $$(".modal-overlay").find((modal) => !modal.hidden);
  if (openedModal) closeModal(openedModal);
});

/* =========================================
   6. Слайдер на vanilla JS
========================================= */
const slider = $("[data-slider]");

if (slider) {
  const track = $("[data-slider-track]", slider);
  const slides = $$(".slide", slider);
  const prevButton = $("[data-slider-prev]", slider);
  const nextButton = $("[data-slider-next]", slider);
  const dotsContainer = $("[data-slider-dots]", slider);

  let currentSlide = 0;
  let autoSlideTimer = null;

  function renderDots() {
    if (!dotsContainer) return;

    dotsContainer.innerHTML = "";

    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "slider__dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Перейти к слайду ${index + 1}`);
      dot.addEventListener("click", () => {
        goToSlide(index);
        restartAutoSlide();
      });

      dotsContainer.appendChild(dot);
    });
  }

  function updateSlider() {
    if (!track) return;

    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    $$(".slider__dot", slider).forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentSlide);
    });
  }

  function goToSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    updateSlider();
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoSlide() {
    autoSlideTimer = window.setInterval(nextSlide, 5500);
  }

  function restartAutoSlide() {
    window.clearInterval(autoSlideTimer);
    startAutoSlide();
  }

  renderDots();
  updateSlider();
  startAutoSlide();

  prevButton?.addEventListener("click", () => {
    prevSlide();
    restartAutoSlide();
  });

  nextButton?.addEventListener("click", () => {
    nextSlide();
    restartAutoSlide();
  });

  slider.addEventListener("mouseenter", () => window.clearInterval(autoSlideTimer));
  slider.addEventListener("mouseleave", startAutoSlide);
}

/* =========================================
   7. Валидация основной формы
========================================= */
const orderForm = $("[data-form]");

if (orderForm) {
  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors(orderForm);

    const formData = new FormData(orderForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const volume = String(formData.get("volume") || "").trim();
    const agree = $("#agree", orderForm)?.checked;

    let isValid = true;

    if (name.length < 2) {
      setError(orderForm, "name", "Введите имя минимум из 2 символов.");
      isValid = false;
    }

    if (!phoneRegex.test(phone)) {
      setError(orderForm, "phone", "Введите корректный телефон.");
      isValid = false;
    }

    if (volume && Number(volume) < 0) {
      setError(orderForm, "volume", "Объём не может быть отрицательным.");
      isValid = false;
    }

    if (!agree) {
      setError(orderForm, "agree", "Нужно согласие для отправки заявки.");
      isValid = false;
    }

    if (!isValid) return;

    // Здесь можно подключить отправку на email, Telegram, CRM или backend.
    console.log("Заявка:", Object.fromEntries(formData.entries()));

    orderForm.reset();
    showToast("Заявка заполнена корректно. Подключите отправку на почту или CRM.");
  });
}

/* =========================================
   8. Валидация формы в модальном окне
========================================= */
const modalForm = $("[data-modal-form]");

if (modalForm) {
  modalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors(modalForm);

    const formData = new FormData(modalForm);
    const name = String(formData.get("modalName") || "").trim();
    const phone = String(formData.get("modalPhone") || "").trim();

    let isValid = true;

    if (name.length < 2) {
      setError(modalForm, "modalName", "Введите имя минимум из 2 символов.");
      isValid = false;
    }

    if (!phoneRegex.test(phone)) {
      setError(modalForm, "modalPhone", "Введите корректный телефон.");
      isValid = false;
    }

    if (!isValid) return;

    // Здесь можно подключить реальную отправку.
    console.log("Быстрый заказ:", Object.fromEntries(formData.entries()));

    modalForm.reset();
    closeModal(modalForm.closest(".modal-overlay"));
    showToast("Быстрая заявка заполнена корректно.");
  });
}