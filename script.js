// Get DOM elements
const slider = document.getElementById('slider');
const nextBtn = document.getElementById('nextBtn');
const skipBtns = document.querySelectorAll('.skip-btn');
const dots = document.querySelectorAll('.dot');
const onboardingContainer = document.getElementById('onboardingContainer');
const welcomeMessage = document.getElementById('welcomeMessage');

// Current slide index
let currentSlide = 0;
const totalSlides = 4;

// Initialize the carousel
function initCarousel() {
    updateSlider();
    updateDots();
    updateNextButton();
}

// Update slider position
function updateSlider() {
    const translateX = -currentSlide * 25; // Each slide is 25% of the slider width
    slider.style.transform = `translateX(${translateX}%)`;
}

// Update dot indicators
function updateDots() {
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Update next button text
function updateNextButton() {
    if (currentSlide === totalSlides - 1) {
        nextBtn.textContent = 'ابدأ الآن';
    } else {
        nextBtn.textContent = 'التالي';
    }
}

// Go to specific slide
function goToSlide(slideIndex) {
    if (slideIndex >= 0 && slideIndex < totalSlides) {
        currentSlide = slideIndex;
        updateSlider();
        updateDots();
        updateNextButton();
    }
}

// Go to next slide
function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlider();
        updateDots();
        updateNextButton();
    } else {
        // On last slide, clicking "ابدأ الآن" should hide onboarding
        hideOnboarding();
    }
}

// Hide onboarding and show welcome message
function hideOnboarding() {
    onboardingContainer.style.display = 'none';
    welcomeMessage.style.display = 'block';
}

// Event listeners
nextBtn.addEventListener('click', nextSlide);

// Skip button listeners
skipBtns.forEach(btn => {
    btn.addEventListener('click', hideOnboarding);
});

// Dot indicator listeners
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        goToSlide(index);
    });
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentSlide < totalSlides - 1) {
            // Swipe left (next slide)
            nextSlide();
        } else if (diff < 0 && currentSlide > 0) {
            // Swipe right (previous slide)
            goToSlide(currentSlide - 1);
        }
    }
}

// Initialize on page load
initCarousel();

