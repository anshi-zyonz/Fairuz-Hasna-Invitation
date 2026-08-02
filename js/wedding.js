'use strict';

/* ══════════════════════════════════════════
   WEDDING WEBSITE — JAVASCRIPT
   Fairuz & Hasna
   Wedding: Saturday, 22 August 2026, 11:30 AM
   Venue: Thottam - Venture by Chiriankandath
   Color Palette: Blush Pink, Ivory, Soft Sage
   Visuals: Glassmorphism & High-Performance Canvas Particles
   Platform-Specific Calendar Behavior
 ══════════════════════════════════════════ */

// ── Wedding date target (August 22, 2026, 11:30 AM IST) ────────────────────
const WEDDING_DATE = new Date('2026-08-22T11:30:00+05:30');

// ── DOM refs ───────────────────────────────
const splash = document.getElementById('splash');
const details = document.getElementById('details');
const swipeTrack = document.getElementById('swipeTrack');
const swipeThumb = document.getElementById('swipeThumb');
const swipeLabel = document.getElementById('swipeLabel');
const swipeFill = document.getElementById('swipeFill');
const bgMusic = document.getElementById('bgMusic');
const musicPill = document.getElementById('musicPill');
const musicPillDet = document.getElementById('musicPillDetails');

// ── Intro Sequence Controller ──────────────
(function initIntroSequence() {
  const canvas = document.getElementById('introCanvas');
  const envelopeOverlay = document.getElementById('envelopeOverlay');
  if (!canvas || !envelopeOverlay) return;

  const ctx = canvas.getContext('2d');
  const totalFrames = 51;
  const startNum = 86400;
  const folder = 'assets/Intro/sequence_opt/';
  const images = [];
  let loadedCount = 0;
  let currentFrame = 0;
  let playing = false;

  // Set standard logical size
  canvas.width = 540;
  canvas.height = 960;

  let cleared = false;
  function clearOverlay() {
    if (cleared) return;
    cleared = true;
    envelopeOverlay.classList.add('fade-out');
    setTimeout(() => {
      envelopeOverlay.style.display = 'none';
    }, 900);
  }

  // Preload all frames sequentially
  for (let i = 0; i < totalFrames; i++) {
    const img = new Image();
    const frameNum = String(startNum + i).padStart(8, '0');
    img.src = `${folder}intro${frameNum}.png`;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === totalFrames) {
        startPlayback();
      }
    };
    img.onerror = () => {
      loadedCount++;
      if (loadedCount === totalFrames) {
        startPlayback();
      }
    };
    images.push(img);
  }

  // Fallback safety timeout (4.5 seconds) in case images hang
  const safetyTimeout = setTimeout(clearOverlay, 4500);

  function startPlayback() {
    clearTimeout(safetyTimeout);
    if (playing) return;
    playing = true;

    const fps = 24;
    const interval = 1000 / fps;
    let lastTime = 0;

    function render(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      if (elapsed >= interval) {
        lastTime = timestamp - (elapsed % interval);

        // Clear and draw current frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (images[currentFrame] && images[currentFrame].complete) {
          ctx.drawImage(images[currentFrame], 0, 0, canvas.width, canvas.height);
        }

        currentFrame++;
        if (currentFrame >= totalFrames) {
          clearOverlay();
          return; // stop render loop
        }
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
})();

// ── State ──────────────────────────────────
let musicStarted = false;  // has audio.play() ever succeeded?
let musicMuted = false;  // is it currently muted?

/* ════════════════════════════════════════════
   AUDIO UNLOCK — iOS Safari requires a play()
   call during a user gesture before any later
   play() will succeed. We trigger a silent
   play/pause on the very first touch so that
   by the time the swipe completes, the audio
   context is already unlocked.
 ════════════════════════════════════════════ */
(function unlockAudioOnFirstTouch() {
  if (!bgMusic) return;
  function unlock() {
    bgMusic.muted = true;
    bgMusic.play().then(() => {
      bgMusic.pause();
      bgMusic.currentTime = 0;
      bgMusic.muted = false;
    }).catch(() => { });
    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('mousedown', unlock, true);
  }
  document.addEventListener('touchstart', unlock, { capture: true, once: true, passive: true });
  document.addEventListener('mousedown', unlock, { capture: true, once: true });
})();

/* ════════════════════════════════════════════
   COUNTDOWN TIMER
 ════════════════════════════════════════════ */
const cdDays = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMins = document.getElementById('cd-mins');
const cdSecs = document.getElementById('cd-secs');

function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

function animateDigit(el, newVal) {
  if (!el || el.textContent === newVal) return;
  el.textContent = newVal;
}

function updateCountdown() {
  const now = Date.now();
  const diff = WEDDING_DATE.getTime() - now;

  if (diff <= 0) {
    animateDigit(cdDays, '00');
    animateDigit(cdHours, '00');
    animateDigit(cdMins, '00');
    animateDigit(cdSecs, '00');
    return;
  }

  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  animateDigit(cdDays, pad(days));
  animateDigit(cdHours, pad(hours));
  animateDigit(cdMins, pad(mins));
  animateDigit(cdSecs, pad(secs));
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ════════════════════════════════════════════
   SWIPE-TO-ATTEND
 ════════════════════════════════════════════ */
(function initSwipe() {
  if (!swipeTrack || !swipeThumb) return;
  
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let trackW, thumbW, maxTravel;

  function getGeometry() {
    trackW = swipeTrack.offsetWidth;
    thumbW = swipeThumb.offsetWidth;
    maxTravel = trackW - thumbW - 16; // 8px padding each side
  }

  function setThumbX(x) {
    x = Math.max(0, Math.min(x, maxTravel));
    currentX = x;
    const progress = x / maxTravel;

    swipeThumb.style.transform = `translateY(-50%) translateX(${x}px)`;
    swipeLabel.style.opacity = String(Math.max(0, 1 - progress * 2));
    swipeFill.style.width = `${progress * 100}%`;
    swipeTrack.style.border = `1px solid rgba(255,255,255,${0.25 + progress * 0.5})`;
  }

  function onDragStart(clientX) {
    getGeometry();
    isDragging = true;
    startX = clientX - currentX;
    swipeThumb.style.transition = 'none';
    swipeFill.style.transition = 'none';
    swipeTrack.style.cursor = 'grabbing';
  }

  function onDragMove(clientX) {
    if (!isDragging) return;
    setThumbX(clientX - startX);
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    swipeTrack.style.cursor = '';

    if (currentX / maxTravel >= 0.78) {
      completeSwipe();
    } else {
      snapBack();
    }
  }

  function snapBack() {
    swipeThumb.style.transition = 'transform 0.45s cubic-bezier(0.32,0.72,0,1)';
    swipeFill.style.transition = 'width 0.45s cubic-bezier(0.32,0.72,0,1)';
    swipeLabel.style.transition = 'opacity 0.3s';
    setThumbX(0);
    currentX = 0;
    swipeLabel.style.opacity = '1';
  }

  function completeSwipe() {
    getGeometry();
    swipeThumb.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1)';
    swipeFill.style.transition = 'width 0.3s ease';
    setThumbX(maxTravel);

    swipeTrack.classList.add('done');
    swipeLabel.style.opacity = '0';
    swipeLabel.style.paddingLeft = '0';

    setTimeout(() => {
      swipeLabel.textContent = 'Welcome! ✓';
      swipeLabel.style.opacity = '1';
    }, 250);

    if (bgMusic && !musicStarted) {
      bgMusic.volume = 0;
      bgMusic.play().then(() => {
        musicStarted = true;
        musicMuted = false;
        updateMusicUI();
        fadeVolume(0, 0.55, 2000);
      }).catch(() => { });
    }

    setTimeout(revealDetails, 700);
  }

  swipeThumb.addEventListener('touchstart', e => {
    e.preventDefault();
    onDragStart(e.touches[0].clientX);
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (isDragging) {
      e.preventDefault();
      onDragMove(e.touches[0].clientX);
    }
  }, { passive: false });

  document.addEventListener('touchend', () => onDragEnd());

  swipeThumb.addEventListener('mousedown', e => {
    e.preventDefault();
    onDragStart(e.clientX);
  });
  document.addEventListener('mousemove', e => {
    if (isDragging) onDragMove(e.clientX);
  });
  document.addEventListener('mouseup', () => onDragEnd());

  window.addEventListener('resize', () => {
    if (!swipeTrack.classList.contains('done')) { currentX = 0; }
  });
})();

/* ════════════════════════════════════════════
   PAGE TRANSITION — REVEAL DETAILS
 ════════════════════════════════════════════ */
function revealDetails() {
  details.classList.add('revealed');
  details.removeAttribute('aria-hidden');
  splash.classList.add('exit');
  setTimeout(() => { splash.style.visibility = 'hidden'; }, 900);
}

/* ════════════════════════════════════════════
   BACKGROUND MUSIC
 ════════════════════════════════════════════ */
function fadeVolume(from, to, durationMs) {
  const steps = 40;
  const interval = durationMs / steps;
  const delta = (to - from) / steps;
  let current = from;
  const timer = setInterval(() => {
    current = Math.max(0, Math.min(1, current + delta));
    bgMusic.volume = current;
    if ((delta > 0 && current >= to) || (delta < 0 && current <= to)) {
      clearInterval(timer);
    }
  }, interval);
}

function toggleMusic() {
  if (!bgMusic) return;

  if (!musicStarted) {
    bgMusic.volume = 0;
    bgMusic.play().then(() => {
      musicStarted = true;
      musicMuted = false;
      updateMusicUI();
      fadeVolume(0, 0.55, 1000);
    }).catch(() => { });
    return;
  }

  musicMuted = !musicMuted;
  bgMusic.muted = musicMuted;
  updateMusicUI();
}

function updateMusicUI() {
  const isAudible = musicStarted && !musicMuted;
  const pills = [musicPill, musicPillDet].filter(Boolean);
  pills.forEach(p => {
    if (isAudible) {
      p.classList.add('playing');
      p.setAttribute('aria-label', 'Mute music');
    } else {
      p.classList.remove('playing');
      p.setAttribute('aria-label', 'Play music');
    }
  });
}

if (musicPill) musicPill.addEventListener('click', toggleMusic);
if (musicPillDet) musicPillDet.addEventListener('click', toggleMusic);

/* ════════════════════════════════════════════
   DOWNLOAD CARD BUTTON
 ════════════════════════════════════════════ */
async function downloadWeddingCard(btn) {
  const CARD_URL = 'assets/Fairuz-Hasna Invitation.jpg';
  const FILENAME = 'Fairuz-Hasna Invitation.jpg';

  const origText = btn.textContent;
  btn.textContent = 'Downloading…';
  btn.disabled = true;

  try {
    const res = await fetch(CARD_URL);
    if (!res.ok) throw new Error('Card image not found');
    const blob = await res.blob();
    const file = new File([blob], FILENAME, { type: blob.type || 'image/jpeg' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Fairuz & Hasna — Wedding Invitation',
        text: 'You\'re invited! ✨'
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = FILENAME;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  } catch {
    // Fallback: simple href download trigger if image fetch fails
    const a = document.createElement('a');
    a.href = CARD_URL;
    a.download = FILENAME;
    a.click();
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
}

document.querySelectorAll('.download-btn:not(.disabled)').forEach(btn => {
  btn.addEventListener('click', () => downloadWeddingCard(btn));
});

/* ════════════════════════════════════════════
   HAPTIC FEEDBACK
 ════════════════════════════════════════════ */
function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

if (swipeThumb) {
  swipeThumb.addEventListener('touchstart', () => vibrate(10), { passive: true });
}

/* ════════════════════════════════════════════
   LUCIDE ICONS
 ════════════════════════════════════════════ */
if (typeof lucide !== 'undefined') lucide.createIcons();

/* ════════════════════════════════════════════
   TRANSPORT ACCORDION
 ════════════════════════════════════════════ */
(function initAccordion() {
  const items = document.querySelectorAll('.accordion-item');
  items.forEach(item => {
    const header = item.querySelector('.accordion-header');
    if (!header) return;
    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

/* ════════════════════════════════════════════
   HIGH-PERFORMANCE BACKGROUND PARTICLES
 ════════════════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const colors = [
    'rgba(143, 166, 150, 0.45)', // Sage Green
    'rgba(178, 201, 185, 0.45)', // Lighter Sage
    'rgba(248, 200, 220, 0.35)', // Blush Pink
    'rgba(255, 255, 240, 0.45)'  // Ivory
  ];

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(init = false) {
      this.x = Math.random() * canvas.width;
      this.y = init ? Math.random() * canvas.height : -20;
      this.size = Math.random() * 8 + 4; // leaves can be slightly larger for shape clarity
      this.speedY = Math.random() * 0.6 + 0.3; // slow falling
      this.speedX = Math.random() * 0.4 - 0.2; // base drift
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.angle = Math.random() * Math.PI * 2;
      this.angleSpeed = (Math.random() * 0.02 - 0.01); // slow rotation
      this.sway = Math.random() * Math.PI * 2;
      this.swaySpeed = Math.random() * 0.02 + 0.01;
      this.swayWidth = Math.random() * 0.5 + 0.2; // sway amplitude
    }

    update() {
      this.y += this.speedY;
      this.sway += this.swaySpeed;
      this.x += this.speedX + Math.sin(this.sway) * this.swayWidth;
      this.angle += this.angleSpeed;
      
      if (this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      
      ctx.beginPath();
      // Draw leaf shape
      ctx.moveTo(0, -this.size);
      ctx.quadraticCurveTo(this.size * 0.5, -this.size * 0.2, 0, this.size);
      ctx.quadraticCurveTo(-this.size * 0.5, -this.size * 0.2, 0, -this.size);
      
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  const particleCount = 35; // kept low for high performance and clean looks
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
})();

/* ════════════════════════════════════════════
   SCROLL ENTRANCE ANIMATION (IntersectionObserver)
 ════════════════════════════════════════════ */
(function initScrollAnimation() {
  const animatedElements = document.querySelectorAll('.scroll-animate');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, {
      threshold: 0.12
    });

    animatedElements.forEach(el => observer.observe(el));
  } else {
    // Fallback: display directly if not supported
    animatedElements.forEach(el => el.classList.add('in-view'));
  }
})();

/* ════════════════════════════════════════════
   PLATFORM-SPECIFIC CALENDAR BUTTON
 ════════════════════════════════════════════ */
(function initCalendarButtons() {
  const calendarButtons = document.querySelectorAll('#addToCalendarBtn');
  
  calendarButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isIOS) {
        // iOS: Trigger dynamic Apple-compatible .ics file download
        const icsLines = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Fairuz and Hasna//Wedding Invitation//EN',
          'BEGIN:VEVENT',
          'UID:fairuz-hasna-wedding-20260822',
          'DTSTAMP:20260725T000000Z',
          'DTSTART:20260822T060000Z',
          'DTEND:20260822T090000Z',
          'SUMMARY:Fairuz & Hasna Wedding',
          'DESCRIPTION:You are cordially invited to the wedding celebration of Fairuz and Hasna.',
          'LOCATION:Thottam - Venture by Chiriankandath, Alpara, Kannara, Thrissur, Kerala',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fairuz-hasna-wedding.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Android / Desktop: Direct URL to Google Calendar Template
        const googleUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Fairuz+%26+Hasna+Wedding&dates=20260822T060000Z/20260822T090000Z&details=You+are+cordially+invited+to+the+wedding+celebration+of+Fairuz+and+Hasna.&location=Thottam+-+Venture+by+Chiriankandath,+Alpara,+Kannara,+Thrissur,+Kerala';
        window.open(googleUrl, '_blank', 'noopener');
      }
    });
  });
})();
