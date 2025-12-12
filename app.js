// ============================================
// State Management
// ============================================
let currentScreen = 'onboarding';
let currentSlide = 0;
const totalSlides = 4;
let map = null;
let trafficChart = null;
let donutChart = null;
let peakForecastChart = null;
let homeInteractionsBound = false;
let authMode = 'login';
let markersMap = {};
let currentLocationSelected = null;
const USER_STORAGE_KEY = 'user_profile';

// ============================================
// Mock Data
// ============================================
const locations = [
    {
        id: 1,
        name: 'وزارة الداخلية',
        type: 'Ministry of Interior',
        traffic: 'medium',
        congestionPercentage: 48,
        parking: 32,
        roadStatus: 'متوسط',
        waitTime: '20 دقيقة',
        arrival: '15 دقيقة',
        lat: 24.7136,
        lng: 46.6753,
        website: 'https://www.moi.gov.sa',
        popularTimes: [20, 35, 60, 75, 80, 70, 50, 30, 25, 30, 40, 55]
    },
    {
        id: 2,
        name: 'حي المالية - كافد',
        type: 'King Abdullah Financial District',
        traffic: 'low',
        congestionPercentage: 28,
        parking: 120,
        roadStatus: 'مريح',
        waitTime: '10 دقائق',
        arrival: '12 دقيقة',
        lat: 24.7295,
        lng: 46.6400,
        website: 'https://www.kafd.sa',
        popularTimes: [10, 15, 25, 35, 45, 40, 30, 20, 15, 20, 30, 40]
    },
    {
        id: 3,
        name: 'مطار الملك خالد الدولي',
        type: 'King Khalid Int. Airport',
        traffic: 'high',
        congestionPercentage: 78,
        parking: 60,
        roadStatus: 'مزدحم',
        waitTime: '35 دقيقة',
        arrival: '25 دقيقة',
        lat: 24.9578,
        lng: 46.6988,
        website: 'https://www.riyadh-airport.com',
        popularTimes: [25, 40, 65, 80, 90, 85, 70, 50, 35, 45, 60, 75]
    },
    {
        id: 4,
        name: 'بوليفارد رياض سيتي',
        type: 'Boulevard Riyadh City',
        traffic: 'severe',
        congestionPercentage: 92,
        parking: 15,
        roadStatus: 'ازدحام شديد',
        waitTime: '50 دقيقة',
        arrival: '30 دقيقة',
        lat: 24.7510,
        lng: 46.6465,
        website: 'https://www.riyadhcity.sa',
        popularTimes: [30, 45, 70, 85, 95, 90, 80, 65, 50, 55, 70, 85]
    }
];

const alerts = [
    {
        id: 1,
        type: 'high',
        urgent: true,
        read: false,
        title: 'ازدحام مرتفع متوقع خلال 30 دقيقة',
        time: 'منذ 5 دقائق',
        description: 'يتوقع ارتفاع مستوى الازدحام إلى 85% خلال النصف ساعة القادمة',
        location: 'وزارة الداخلية',
        icon: 'fa-exclamation-triangle'
    },
    {
        id: 2,
        type: 'medium',
        urgent: true,
        read: false,
        title: 'المواقف قاربت على الامتلاء',
        time: 'منذ 15 دقيقة',
        description: 'تبقى فقط 3 مواقف متاحة من أصل 200 موقف',
        location: 'بوليفارد رياض سيتي',
        icon: 'fa-map-marker-alt'
    },
    {
        id: 3,
        type: 'low',
        urgent: false,
        read: false,
        title: 'أفضل وقت لزيارتك الآن',
        time: 'منذ 30 دقيقة',
        description: 'مستوى الازدحام منخفض حالياً مع 120 موقف متاح',
        location: 'حي المالية - كافد',
        icon: 'fa-check-circle'
    },
    {
        id: 4,
        type: 'high',
        urgent: false,
        read: true,
        title: 'ازدحام مرتفع في الجوازات',
        time: 'منذ ساعة',
        description: 'مستوى الازدحام مرتفع جداً. يُنصح بتأجيل الزيارة أو الوصول قبل الساعة 8 صباحاً.',
        location: 'الجوازات',
        icon: 'fa-exclamation-triangle'
    },
    {
        id: 5,
        type: 'medium',
        urgent: false,
        read: true,
        title: 'حادث على الطريق',
        time: 'منذ ساعتين',
        description: 'تم الإبلاغ عن حادث على الطريق المؤدي للموقع. قد يسبب تأخيراً.',
        location: 'مطار الملك خالد الدولي',
        icon: 'fa-exclamation-circle'
    }
];

// ============================================
// Onboarding Logic
// ============================================
function initOnboarding() {
    const slider = document.getElementById('slider');
    const nextBtn = document.getElementById('nextBtn');
    const skipBtns = document.querySelectorAll('.skip-btn');
    const dots = document.querySelectorAll('.dot');

    // Check if onboarding was already seen
    const onboardingSeen = localStorage.getItem('onboarding_seen') === 'true';
    const savedUser = getSavedUser();
    if (onboardingSeen && savedUser) {
        showMainApp();
        return;
    } else if (onboardingSeen && !savedUser) {
        showAuthScreen();
        return;
    }

    function updateSlider() {
        // كل شريحة الآن بعرض 100% من عرض السلايدر
        const translateX = -currentSlide * 100;
        slider.style.transform = `translateX(${translateX}%)`;
    }

    function updateDots() {
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function updateNextButton() {
        if (currentSlide === totalSlides - 1) {
            nextBtn.textContent = 'ابدأ الآن';
        } else {
            nextBtn.textContent = 'التالي';
        }
    }

    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateSlider();
            updateDots();
            updateNextButton();
        } else {
            completeOnboarding();
        }
    }

    function goToSlide(index) {
        if (index >= 0 && index < totalSlides) {
            currentSlide = index;
            updateSlider();
            updateDots();
            updateNextButton();
        }
    }

    function completeOnboarding() {
        showAuthScreen();
    }

    // Event listeners
    nextBtn.addEventListener('click', nextSlide);
    
    skipBtns.forEach(btn => {
        btn.addEventListener('click', completeOnboarding);
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        const swipeThreshold = 50;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentSlide < totalSlides - 1) {
                nextSlide();
            } else if (diff < 0 && currentSlide > 0) {
                goToSlide(currentSlide - 1);
            }
        }
    }, { passive: true });

    updateDots();
    updateNextButton();
}

// ============================================
// Auth (Login / Register) Flow
// ============================================
function showAuthScreen() {
    document.getElementById('onboarding').classList.add('hidden');
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) {
        authScreen.classList.remove('hidden');
    }
}

function completeAuth(successMessage) {
    localStorage.setItem('onboarding_seen', 'true');
    // Already saved user in storage before calling
    showMainApp();
    showToast(successMessage || 'تم تسجيل الدخول بنجاح', 'success');
}

function initAuthForm() {
    const authTabs = document.querySelectorAll('.auth-tab');
    const registerFields = document.querySelectorAll('.register-only');
    const authForm = document.getElementById('authForm');
    const submitBtn = document.getElementById('authSubmitBtn');
    const quickLoginBtn = document.getElementById('quickLoginBtn');
    const forgotBtn = document.getElementById('authForgotPassword');

    function updateAuthMode(mode) {
        authMode = mode;
        authTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        registerFields.forEach(field => {
            field.classList.toggle('hidden', mode === 'login');
        });
        if (submitBtn) {
            submitBtn.textContent = mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب';
        }
    }

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            updateAuthMode(tab.dataset.mode);
        });
    });

    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nationalId = document.getElementById('nationalId')?.value.trim();
            const password = document.getElementById('password')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            const mobile = document.getElementById('mobile')?.value.trim();

            if (!nationalId || !password) {
                showToast('يرجى إدخال جميع الحقول المطلوبة', 'error');
                return;
            }

            if (authMode === 'register') {
                if (mobile && !/^05\d{8}$/.test(mobile)) {
                    showToast('رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام', 'error');
                    return;
                }
                if (password !== confirmPassword) {
                    showToast('تأكيد كلمة المرور غير متطابق', 'error');
                    return;
                }
            }

            saveUserToStorage({
                nationalId,
                mobile: mobile || '',
                password,
                mode: authMode,
                createdAt: Date.now()
            });
            completeAuth(authMode === 'register' ? 'تم إنشاء الحساب وتسجيل الدخول' : 'تم تسجيل الدخول بنجاح');
        });
    }

    if (quickLoginBtn) {
        quickLoginBtn.addEventListener('click', () => {
            saveUserToStorage({
                nationalId: 'NID-0000',
                mobile: '',
                password: '',
                mode: 'quick',
                createdAt: Date.now()
            });
            completeAuth('تم الدخول عبر النفاذ الوطني');
        });
    }

    if (forgotBtn) {
        forgotBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('سيتم دعم استعادة كلمة المرور قريباً', 'info');
        });
    }

    updateAuthMode(authMode);
}

// Helpers for localStorage user
function saveUserToStorage(user) {
    try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
        console.error('Failed to save user', e);
    }
}

function getSavedUser() {
    try {
        const raw = localStorage.getItem(USER_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Failed to read user', e);
        return null;
    }
}

function renderProfileScreen() {
    const user = getSavedUser();
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');

    if (!nameEl || !emailEl) return;

    if (user) {
        const maskedId = user.nationalId ? `****${user.nationalId.slice(-4)}` : 'المستخدم';
        const displayName = user.mode === 'quick' ? 'دخول عبر النفاذ الوطني' : `مستخدم ${maskedId}`;
        const pseudoEmail = user.nationalId ? `${user.nationalId}@user.local` : 'user@example.com';
        nameEl.textContent = displayName;
        emailEl.textContent = user.mobile && user.mobile.trim().length > 0 ? user.mobile : pseudoEmail;
    } else {
        nameEl.textContent = 'المستخدم';
        emailEl.textContent = 'user@example.com';
    }
}

// ============================================
// Navigation
// ============================================
function navigateTo(screenId) {
    // Hide all screens
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        currentScreen = screenId;

        // Update bottom nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const navMap = {
            'home': 0,
            'map-screen': 1,
            'alerts-screen': 2,
            'profile-screen': 3
        };

        if (navMap[screenId] !== undefined) {
            document.querySelectorAll('.nav-item')[navMap[screenId]]?.classList.add('active');
        }

        // Initialize screen-specific features
        if (screenId === 'map-screen') {
            setTimeout(() => {
                initMap();
            }, 100);
        } else if (screenId === 'alerts-screen') {
            loadAlertsScreen();
        } else if (screenId === 'profile-screen') {
            renderProfileScreen();
        }
    }
}

function showMainApp() {
    document.getElementById('onboarding').classList.add('hidden');
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) {
        authScreen.classList.add('hidden');
    }
    document.getElementById('main-app').classList.remove('hidden');
    navigateTo('home');
    loadHomeScreen();
}

// ============================================
// Home Screen
// ============================================
function loadHomeScreen() {
    renderNearbyLocations();
    initHomeMapPreview();
    bindHomeInteractions();
}

function renderNearbyLocations() {
    const container = document.getElementById('nearbyList');
    if (!container) return;
    container.innerHTML = '';

    const trafficLabels = {
        low: 'منخفض',
        medium: 'متوسط',
        high: 'مرتفع',
        severe: 'ازدحام شديد'
    };

    locations.forEach(location => {
        const card = document.createElement('div');
        card.className = 'location-card';
        card.onclick = () => showLocationDetails(location);

        card.innerHTML = `
            <div class="location-top">
                <div class="location-name">${location.name}</div>
                <div class="location-status ${location.traffic}">${trafficLabels[location.traffic]}</div>
            </div>
            <div class="location-stats">
                <div class="location-stat-item">
                    <div class="location-stat-label">
                        <i class="fas fa-hourglass-half"></i>
                        <span>الانتظار</span>
                    </div>
                    <div class="location-stat-value">${location.waitTime}</div>
                </div>
                <div class="location-stat-item">
                    <div class="location-stat-label">
                        <i class="fas fa-parking"></i>
                        <span>مواقف</span>
                    </div>
                    <div class="location-stat-value">${location.parking}</div>
                </div>
                <div class="location-stat-item">
                    <div class="location-stat-label">
                        <i class="fas fa-route"></i>
                        <span>الوصول</span>
                    </div>
                    <div class="location-stat-value">${location.arrival}</div>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// ============================================
// Map Screen
// ============================================
function initMap() {
    if (map) {
        map.remove();
        map = null;
    }
    markersMap = {};

    map = L.map('map').setView([24.7136, 46.6753], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers for each location with custom icons
    locations.forEach(location => {
        let iconColor;
        if (location.traffic === 'low') {
            iconColor = '#27ae60';
        } else if (location.traffic === 'medium') {
            iconColor = '#f39c12';
        } else if (location.traffic === 'high') {
            iconColor = '#e74c3c';
        } else {
            iconColor = '#c0392b';
        }

        // Create custom icon with parking indicator
        const parkingIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="position: relative;">
                    <i class="fas fa-map-marker-alt" style="font-size: 32px; color: ${iconColor};"></i>
                    ${location.parking > 0 ? `
                        <div style="position: absolute; bottom: -5px; right: 8px; width: 18px; height: 18px; background: #27ae60; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 2px solid white;">
                            <span style="color: white; font-size: 10px; font-weight: 700;">P</span>
                        </div>
                    ` : ''}
                </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 40]
        });

        const marker = L.marker([location.lat, location.lng], { icon: parkingIcon }).addTo(map);
        markersMap[location.id] = marker;
        
        marker.bindPopup(`
            <div style="text-align: right; direction: rtl; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; font-weight: 700; font-size: 16px;">${location.name}</h3>
                <p style="margin: 5px 0; font-size: 14px;">الازدحام: ${location.traffic === 'low' ? 'منخفض' : location.traffic === 'medium' ? 'متوسط' : location.traffic === 'high' ? 'مرتفع' : 'حرج'}</p>
                <p style="margin: 5px 0; font-size: 14px;">المواقف: ${location.parking}</p>
                <p style="margin: 5px 0; font-size: 14px;">وقت الانتظار: ${location.waitTime}</p>
                <button onclick="showLocationDetailsFromMap(${location.id})" 
                        style="margin-top: 10px; padding: 8px 15px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-size: 14px;">
                    عرض التفاصيل
                </button>
            </div>
        `);
    });

    // Add incident marker (example)
    const incidentIcon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="position: relative;">
                <div style="width: 30px; height: 30px; background: #e74c3c; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    <span style="color: white; font-size: 16px; font-weight: 700;">!</span>
                </div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    // Add incident marker near Boulevard
    const incidentMarker = L.marker([24.7510, 46.6465], { icon: incidentIcon }).addTo(map);
    incidentMarker.bindPopup(`
        <div style="text-align: right; direction: rtl; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; font-weight: 700; font-size: 16px; color: #e74c3c;">حادث على الطريق</h3>
            <p style="margin: 5px 0; font-size: 14px;">تم الإبلاغ عن حادث على الطريق المؤدي لـ بوليفارد رياض سيتي</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">منذ 10 دقائق</p>
        </div>
    `);
}

function refreshMap() {
    if (map) {
        map.setView([24.7136, 46.6753], 12);
        showToast('تم تحديث الخريطة', 'success');
    }
}

function openMapSearch() {
    const query = prompt('أدخل اسم الموقع للبحث', '').trim().toLowerCase();
    if (!query) return;
    const location = locations.find(loc => loc.name.toLowerCase().includes(query));
    if (location) {
        startNavigationToLocation(location);
        showToast(`تم العثور على ${location.name}`, 'success');
    } else {
        showToast('لم يتم العثور على موقع مطابق', 'error');
    }
}

function openMapFilter() {
    showToast('فلترة الخريطة قريباً', 'info');
}

function zoomInMap() {
    if (map) {
        map.zoomIn();
    }
}

function showLocationDetailsFromMap(locationId) {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
        showLocationDetails(location);
    }
}

function focusLocationOnMap(location) {
    if (!location) return;
    if (!map) {
        initMap();
    }
    const marker = markersMap[location.id];
    if (marker) {
        map.setView([location.lat, location.lng], 14);
        marker.openPopup();
    } else {
        map.setView([location.lat, location.lng], 14);
    }
}

function startNavigationToLocation(location) {
    // If no location provided, try to get from window
    if (!location) {
        location = window.currentLocationSelected || currentLocationSelected;
    }
    if (!location) {
        showToast('لم يتم العثور على معلومات الموقع', 'error');
        return;
    }
    // Ensure main app and map screen are visible, then focus on location
    document.getElementById('onboarding')?.classList.add('hidden');
    document.getElementById('auth-screen')?.classList.add('hidden');
    document.getElementById('main-app')?.classList.remove('hidden');
    navigateTo('map-screen');
    setTimeout(() => {
        initMap();
        setTimeout(() => focusLocationOnMap(location), 150);
    }, 100);
}

function openLocationWebsite(location) {
    if (!location) {
        // Try to get from window if not provided
        location = window.currentLocationSelected;
    }
    if (!location) {
        showToast('لم يتم العثور على معلومات الموقع', 'error');
        return;
    }
    if (location.website) {
        window.open(location.website, '_blank');
        showToast('جاري فتح موقع الجهة', 'success');
    } else {
        showToast('لا يوجد رابط موقع متاح لهذه الجهة', 'info');
    }
}

// Mini map in home screen
function initHomeMapPreview() {
    const mapContainer = document.getElementById('homeMap');
    if (!mapContainer || mapContainer.dataset.initialized === 'true') return;

    const previewMap = L.map('homeMap', {
        attributionControl: false,
        zoomControl: false
    }).setView([24.7136, 46.6753], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(previewMap);

    locations.forEach(location => {
        L.circleMarker([location.lat, location.lng], {
            radius: 6,
            color: location.traffic === 'low' ? '#27ae60' : location.traffic === 'medium' ? '#f39c12' : '#e74c3c',
            fillColor: location.traffic === 'low' ? '#27ae60' : location.traffic === 'medium' ? '#f39c12' : '#e74c3c',
            fillOpacity: 0.8
        }).addTo(previewMap);
    });

    mapContainer.dataset.initialized = 'true';
}

// ============================================
// Home Screen Interactions (Buttons & Cards)
// ============================================
function bindHomeInteractions() {
    if (homeInteractionsBound) return;

    // إحصاءات سريعة - اجعل كل كرت تفاعلي
    const statCards = document.querySelectorAll('.stats-grid .stat-card');
    if (statCards.length >= 3) {
        // كرت مواقع متاحة → يفتح قائمة المواقع القريبة (لا شيء إضافي الآن)
        statCards[0].addEventListener('click', () => {
            scrollToSection('nearbyList');
        });

        // كرت أفضل وقت → يركز أيضاً على المواقع القريبة
        statCards[1].addEventListener('click', () => {
            scrollToSection('nearbyList');
            showToast('الآن هو أفضل وقت لزيارة أغلب المواقع القريبة', 'success');
        });

        // كرت التنبيهات → يفتح شاشة التنبيهات
        statCards[2].addEventListener('click', () => {
            navigateTo('alerts-screen');
        });
    }

    // زر إضافة حادث في الطريق
    const incidentBtn = document.querySelector('.incident-button');
    if (incidentBtn) {
        incidentBtn.addEventListener('click', () => {
            openIncidentScreen();
        });
    }

    homeInteractionsBound = true;
}

function scrollToSection(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Toast helper
function showToast(message, type = 'success') {
    const toast = document.getElementById('appToast');
    const msgSpan = document.getElementById('toastMessage');
    if (!toast || !msgSpan) return;

    msgSpan.textContent = message;

    toast.classList.remove('success', 'error');
    toast.classList.add(type === 'error' ? 'error' : 'success');

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ============================================
// Incident Flow
// ============================================
function openIncidentScreen() {
    // إظهار شاشة إضافة الحادث
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    const screen = document.getElementById('incident-screen');
    if (screen) {
        screen.classList.remove('hidden');
    }

    // إعادة ضبط الحقول
    const notes = document.getElementById('incidentNotes');
    if (notes) notes.value = '';
}

function bindIncidentEvents() {
    const cancelBtn = document.getElementById('incidentCancelBtn');
    const confirmBtn = document.getElementById('incidentConfirmBtn');
    const successBackBtn = document.getElementById('incidentSuccessBackBtn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            navigateTo('home');
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            // يمكن هنا لاحقاً إرسال البيانات إلى API، الآن فقط نظهر شاشة النجاح
            document.querySelectorAll('.app-screen').forEach(screen => {
                screen.classList.add('hidden');
            });
            const success = document.getElementById('incident-success');
            if (success) {
                success.classList.remove('hidden');
            }
        });
    }

    if (successBackBtn) {
        successBackBtn.addEventListener('click', () => {
            navigateTo('home');
            showToast('شكرًا لمساهمتك، تم تسجيل الحادث', 'success');
        });
    }
}

function showLocationDetailsFromMap(locationId) {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
        showLocationDetails(location);
    }
}

// ============================================
// Location Details Screen - New Design
// ============================================
function showLocationDetails(location) {
    navigateTo('location-details');
    currentLocationSelected = location;
    window.currentLocationSelected = location;

    // Update header
    document.getElementById('locationName').textContent = location.name;
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        const minutes = Math.floor(Math.random() * 10) + 1;
        lastUpdate.textContent = `آخر تحديث: منذ ${minutes} دقيقة`;
    }

    // Update congestion status text
    const statusText = document.getElementById('congestionStatusText');
    if (statusText) {
        const statusLabels = {
            low: 'منخفض',
            medium: 'متوسط',
            high: 'مرتفع',
            severe: 'حرج',
            critical: 'حرج'
        };
        statusText.textContent = statusLabels[location.traffic] || 'متوسط';
        // Ensure traffic class matches (severe should use 'critical' class for styling)
        const trafficClass = location.traffic === 'severe' ? 'critical' : location.traffic;
        statusText.className = 'congestion-status-text ' + trafficClass;
    }

    // Calculate percentage for donut chart - use actual congestion percentage from location data
    // If congestionPercentage exists, use it; otherwise calculate from current time in popularTimes
    let percentage;
    if (location.congestionPercentage !== undefined) {
        percentage = location.congestionPercentage;
    } else {
        // Calculate from current hour in popularTimes array
        const now = new Date();
        const currentHour = now.getHours();
        // Map hour (0-23) to popularTimes index (0-11, representing 2-hour intervals)
        const timeIndex = Math.floor(currentHour / 2);
        const safeIndex = Math.min(Math.max(timeIndex, 0), location.popularTimes.length - 1);
        percentage = location.popularTimes[safeIndex] || 
                    (location.traffic === 'low' ? 25 : 
                     location.traffic === 'medium' ? 45 : 
                     location.traffic === 'high' ? 75 : 90);
    }

    // Draw Donut Chart
    if (donutChart) {
        donutChart.destroy();
    }

    const donutCtx = document.getElementById('donutChart');
    if (donutCtx) {
        // Determine color based on traffic level or percentage
        let donutColor;
        if (percentage <= 30) {
            donutColor = '#27ae60'; // Green for low
        } else if (percentage <= 50) {
            donutColor = '#f39c12'; // Orange for medium
        } else if (percentage <= 80) {
            donutColor = '#e74c3c'; // Red for high
        } else {
            donutColor = '#c0392b'; // Dark red for critical/severe
        }

        donutChart = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['الازدحام', 'المتبقي'],
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: [donutColor, '#e0e0e0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '75%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                    const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
                    
                    ctx.save();
                    ctx.font = 'bold 36px Cairo';
                    ctx.fillStyle = '#2c3e50';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(percentage + '%', centerX, centerY - 10);
                    ctx.restore();
                }
            }]
        });
    }

    // Draw Peak Forecast Line Chart
    if (peakForecastChart) {
        peakForecastChart.destroy();
    }

    const lineCtx = document.getElementById('peakForecastChart');
    if (lineCtx) {
        // Prepare data for line chart (extend popularTimes to cover full day)
        const timeLabels = ['6 ص', '8 ص', '10 ص', '12 م', '2 م', '4 م', '6 م', '8 م', '10 م'];
        const forecastData = [
            location.popularTimes[0] || 15,
            location.popularTimes[1] || 25,
            location.popularTimes[2] || 40,
            location.popularTimes[3] || 55,
            location.popularTimes[4] || 70,
            location.popularTimes[5] || 85,
            location.popularTimes[6] || 75,
            location.popularTimes[7] || 60,
            location.popularTimes[8] || 45
        ];

        // Find peak hours
        const maxValue = Math.max(...forecastData);
        const peakIndex = forecastData.indexOf(maxValue);
        const peakStart = peakIndex > 0 ? peakIndex - 1 : peakIndex;
        const peakEnd = peakIndex < forecastData.length - 1 ? peakIndex + 1 : peakIndex;
        const peakWarning = `تزداد الذروة بين ${timeLabels[peakStart]}-${timeLabels[peakEnd]}`;

        const warningText = document.getElementById('peakWarningText');
        if (warningText) {
            warningText.textContent = peakWarning;
        }

        peakForecastChart = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'مستوى الازدحام',
                    data: forecastData,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#27ae60',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 25,
                            callback: function(value) {
                                return value;
                            }
                        },
                        grid: {
                            color: '#f0f0f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// ============================================
// Alerts Screen
// ============================================
let currentAlertFilter = 'all';

function loadAlertsScreen() {
    filterAlerts(currentAlertFilter);
}

function filterAlerts(filter) {
    currentAlertFilter = filter;
    const container = document.getElementById('alertsList');
    container.innerHTML = '';

    // Update active tab
    document.querySelectorAll('.alert-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.alert-tab[data-filter="${filter}"]`)?.classList.add('active');

    // Filter alerts
    let filteredAlerts = alerts;
    if (filter === 'read') {
        filteredAlerts = alerts.filter(a => a.read);
    } else if (filter === 'urgent') {
        filteredAlerts = alerts.filter(a => a.urgent);
    }

    if (filteredAlerts.length === 0) {
        container.innerHTML = '<div class="no-alerts">لا توجد تنبيهات</div>';
        return;
    }

    filteredAlerts.forEach(alert => {
        const card = document.createElement('div');
        card.className = `alert-card ${alert.type} ${alert.read ? 'read' : ''}`;
        card.onclick = () => {
            const location = locations.find(loc => loc.name === alert.location);
            if (location) {
                showLocationDetails(location);
            }
        };

        const iconClass = alert.icon || (alert.type === 'high' ? 'fa-exclamation-triangle' : 
                                        alert.type === 'medium' ? 'fa-map-marker-alt' : 'fa-check-circle');

        card.innerHTML = `
            ${!alert.read ? '<div class="alert-unread-dot"></div>' : ''}
            <div class="alert-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${alert.location}</span>
                </div>
                <div class="alert-desc">${alert.description}</div>
                <div class="alert-footer">
                    <span class="alert-time">${alert.time}</span>
                    <a href="#" class="alert-details-link" onclick="event.stopPropagation(); const location = locations.find(loc => loc.name === '${alert.location}'); if(location) showLocationDetails(location); return false;">عرض التفاصيل</a>
                    <a href="#" class="alert-details-link start-nav" onclick="event.stopPropagation(); const location = locations.find(loc => loc.name === '${alert.location}'); if(location) startNavigationToLocation(location); return false;">ابدأ</a>
                    <a href="#" class="alert-details-link start-nav" onclick="event.stopPropagation(); const location = locations.find(loc => loc.name === '${alert.location}'); if(location) startNavigationToLocation(location); return false;">انتقال للخريطة</a>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function markAllAsRead() {
    alerts.forEach(alert => {
        alert.read = true;
    });
    loadAlertsScreen();
    showToast('تم تعليم جميع التنبيهات كمقروءة', 'success');
}

function openAlertSettings() {
    showToast('صفحة إعدادات التنبيهات قريباً', 'info');
}

// ============================================
// Search Functionality
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length > 0) {
                // Simple search - in a real app, this would filter locations
                console.log('Searching for:', query);
            }
        });
    }

    // Notifications button
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            navigateTo('alerts-screen');
        });
    }
});

// ============================================
// Initialize App
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
    initAuthForm();

    // Load alerts when alerts screen is accessed
    const alertsScreen = document.getElementById('alerts-screen');
    if (alertsScreen) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!alertsScreen.classList.contains('hidden')) {
                    loadAlertsScreen();
                }
            });
        });

        observer.observe(alertsScreen, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // ربط أحداث شاشة الحادث
    bindIncidentEvents();
});

// ============================================
// Logout (Profile Screen)
// ============================================
function logout() {
    // إزالة العلم حتى تظهر الشرائح التعريفية مرة أخرى
    localStorage.removeItem('onboarding_seen');
    localStorage.removeItem(USER_STORAGE_KEY);
    // إعادة تحميل الصفحة لتصفير الحالة والعودة للأونبوردنج
    window.location.reload();
}

// Make functions globally available
window.navigateTo = navigateTo;
window.showLocationDetailsFromMap = showLocationDetailsFromMap;
window.logout = logout;
window.openLocationWebsite = openLocationWebsite;
window.startNavigationToLocation = startNavigationToLocation;

