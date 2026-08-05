/**
 * LifeStock Ядро 1.0 — auto-scroll navigation + smooth UX
 */
(function () {
  'use strict';

  // ===== Mobile nav toggle =====
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
  }

  // ===== Close mobile nav on link click =====
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      navToggle.classList.remove('open');
    });
  });

  // ===== Header shadow on scroll =====
  var header = document.querySelector('.header');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });

  // ===== Active section highlight (auto-scroll spy) =====
  var sections = document.querySelectorAll('section[id], header[id]');
  var navLinks = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    var scrollPos = window.scrollY + 80;
    var current = '';
    sections.forEach(function (sec) {
      if (scrollPos >= sec.offsetTop) {
        current = sec.id;
      }
    });
    navLinks.forEach(function (link) {
      link.classList.remove('active');
      var href = link.getAttribute('href');
      if (href && href === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink);
  updateActiveLink();

  // ===== Fade-in animations on scroll =====
  var observerOpts = {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
  };
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOpts);

  // Apply to cards
  document.querySelectorAll('.module-card, .principle-card, .contact-card, .hero-stat').forEach(function (el, i) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease ' + (i * 30) + 'ms, transform .5s ease ' + (i * 30) + 'ms';
    observer.observe(el);
  });
})();
