// ============================================
// State Management
// ============================================
let currentScreen = 'onboarding';
let currentSlide = 0;
const totalSlides = 4;
let map = null;
let navigationMap = null;
let trafficChart = null;
let donutChart = null;
let peakForecastChart = null;
let homeInteractionsBound = false;
let authMode = 'login';
let markersMap = {};
let currentLocationSelected = null;
let navigationRoute = null;
let activeNavigationMap = null;
let navigationSteps = [];
let currentStepIndex = 0;
let currentUserPosition = null;
let navigationDestination = null;
let navigationInterval = null;
let navigationProgress = 0;
let navigationRouteData = null; // holds geometry + steps from OSRM
let navigationRouteIndex = 0;
let initialNavigationDistance = 0;
let navigationTotalDurationSec = 0;
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
    // Open navigation screen
    document.getElementById('onboarding')?.classList.add('hidden');
    document.getElementById('auth-screen')?.classList.add('hidden');
    document.getElementById('main-app')?.classList.remove('hidden');
    navigateTo('navigation-screen');
    // Get user location and show directions
    getCurrentLocationAndShowDirections(location);
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

// ============================================
// Navigation & Directions
// ============================================
async function getCurrentLocationAndShowDirections(destination) {
    const useRoute = async (origin) => {
        try {
            const routeData = await fetchRouteFromOSRM(origin, destination);
            navigationRouteData = routeData;
            initialNavigationDistance = routeData.distanceKm;
            navigationTotalDurationSec = routeData.durationSec;
            showDirectionsFromRoute(origin, destination, routeData);
        } catch (err) {
            console.error('Failed to fetch route, using straight line fallback', err);
            showToast('تعذر تحميل المسار، سيتم استخدام خط مستقيم', 'error');
            const fallbackRoute = buildFallbackRoute(origin, destination);
            navigationRouteData = fallbackRoute;
            initialNavigationDistance = fallbackRoute.distanceKm;
            navigationTotalDurationSec = estimateDurationSeconds(fallbackRoute.distanceKm, destination.traffic);
            showDirectionsFromRoute(origin, destination, fallbackRoute);
        }
    };

    if (!navigator.geolocation) {
        const mockLocation = { lat: 24.7136, lng: 46.6753 };
        await useRoute(mockLocation);
        return;
    }

    showToast('جاري تحديد موقعك الحالي...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            await useRoute(userLocation);
        },
        async (error) => {
            console.error('Error getting location:', error);
            const mockLocation = { lat: 24.7136, lng: 46.6753 };
            showToast('استخدام موقع تجريبي (مركز الرياض)', 'info');
            await useRoute(mockLocation);
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

function formatDistance(km) {
    if (km < 1) {
        return Math.round(km * 1000) + ' متر';
    }
    return km.toFixed(1) + ' كم';
}

// Fetch driving route using OSRM (OpenStreetMap)
async function fetchRouteFromOSRM(origin, destination) {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=false`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`OSRM error: ${res.status}`);
    }
    const data = await res.json();
    if (!data?.routes?.length) {
        throw new Error('OSRM returned no routes');
    }
    const route = data.routes[0];
    const coords = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    const steps = (route.legs?.[0]?.steps || []).map((step, idx) => {
        const instructionText = buildInstructionText(step.maneuver, step.name);
        const icon = mapManeuverToIcon(step.maneuver);
        const cumDistanceKm = (route.legs[0].steps.slice(0, idx + 1).reduce((sum, s) => sum + (s.distance || 0), 0)) / 1000;
        return {
            type: step.maneuver?.type || 'straight',
            icon,
            instruction: instructionText,
            road: step.name || '',
            distance: formatDistance((step.distance || 0) / 1000),
            maneuver: step.maneuver?.type || 'straight',
            distanceKm: (step.distance || 0) / 1000,
            cumulativeDistance: cumDistanceKm
        };
    });

    return {
        distanceKm: route.distance / 1000,
        durationSec: route.duration,
        geometry: coords,
        steps
    };
}

function buildInstructionText(maneuver, roadName) {
    if (!maneuver) return `استمر على ${roadName || 'الطريق'}`;
    const { type, modifier } = maneuver;
    const turnText = mapManeuverToText(type, modifier);
    if (roadName) {
        return `${turnText} إلى ${roadName}`;
    }
    return turnText;
}

function mapManeuverToText(type, modifier) {
    const turns = {
        right: 'انعطف يميناً',
        left: 'انعطف يساراً',
        straight: 'استمر مباشرة',
        slight_right: 'انعطف ميلاً لليمين',
        slight_left: 'انعطف ميلاً لليسار',
        uturn: 'استدر للخلف'
    };
    if (type === 'arrive') return 'وصلت إلى وجهتك';
    if (type === 'depart') return 'ابدأ من موقعك الحالي';
    if (type === 'turn') {
        return turns[modifier] || 'انعطف';
    }
    if (type === 'roundabout') return 'ادخل الدوار واتبع المخرج المحدد';
    return 'استمر على الطريق';
}

function mapManeuverToIcon(maneuver) {
    if (!maneuver) return 'fa-arrow-up';
    const { type, modifier } = maneuver;
    if (type === 'arrive') return 'fa-flag-checkered';
    if (type === 'depart') return 'fa-map-marker-alt';
    if (type === 'roundabout') return 'fa-sync-alt';
    if (type === 'turn') {
        if (modifier === 'right' || modifier === 'sharp right') return 'fa-arrow-right';
        if (modifier === 'left' || modifier === 'sharp left') return 'fa-arrow-left';
        if (modifier === 'slight right') return 'fa-arrow-up-right-from-square';
        if (modifier === 'slight left') return 'fa-arrow-up-left-from-square';
    }
    return 'fa-arrow-up';
}

function buildFallbackRoute(origin, destination) {
    const distanceKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    return {
        distanceKm,
        durationSec: estimateDurationSeconds(distanceKm, destination.traffic),
        geometry: [
            { lat: origin.lat, lng: origin.lng },
            { lat: destination.lat, lng: destination.lng }
        ],
        steps: [
            {
                type: 'depart',
                icon: 'fa-map-marker-alt',
                instruction: 'ابدأ من موقعك الحالي',
                road: '',
                distance: '0 م',
                maneuver: 'start',
                distanceKm: 0,
                cumulativeDistance: 0
            },
            {
                type: 'arrive',
                icon: 'fa-flag-checkered',
                instruction: `وصلت إلى ${destination.name}`,
                road: '',
                distance: formatDistance(distanceKm),
                maneuver: 'arrive',
                distanceKm,
                cumulativeDistance: distanceKm
            }
        ]
    };
}

function estimateDurationSeconds(distanceKm, trafficLevel) {
    const speeds = {
        low: 60,
        medium: 45,
        high: 30,
        severe: 20
    };
    const avgSpeed = speeds[trafficLevel] || 40;
    return (distanceKm / avgSpeed) * 3600;
}

function estimateTravelTime(distanceKm, trafficLevel) {
    // Average speed based on traffic level (km/h)
    const speeds = {
        low: 60,
        medium: 45,
        high: 30,
        severe: 20
    };
    const avgSpeed = speeds[trafficLevel] || 40;
    const timeHours = distanceKm / avgSpeed;
    const timeMinutes = Math.round(timeHours * 60);
    
    if (timeMinutes < 60) {
        return timeMinutes + ' دقيقة';
    }
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return minutes > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${hours} ساعة`;
}

function formatDurationFromSeconds(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${hours} ساعة`;
}

function showDirectionsFromRoute(userLocation, destination, routeData) {
    // Store for navigation
    currentUserPosition = { ...userLocation };
    navigationDestination = destination;
    navigationRouteData = routeData;
    initialNavigationDistance = routeData.distanceKm;
    navigationTotalDurationSec = routeData.durationSec || estimateDurationSeconds(routeData.distanceKm, destination.traffic);
    
    // Update distance and time
    const distanceEl = document.getElementById('navigationDistance');
    const timeEl = document.getElementById('navigationTime');
    const destNameEl = document.getElementById('navigationDestinationName');
    
    if (distanceEl) {
        distanceEl.textContent = formatDistance(routeData.distanceKm);
    }
    if (timeEl) {
        timeEl.textContent = navigationTotalDurationSec
            ? formatDurationFromSeconds(navigationTotalDurationSec)
            : estimateTravelTime(routeData.distanceKm, destination.traffic);
    }
    if (destNameEl) {
        destNameEl.textContent = destination.name;
    }
    
    // Initialize navigation map
    initNavigationMapFromRoute(routeData, userLocation, destination);
    
    // Generate navigation steps
    generateNavigationSteps(routeData, destination);
}

function initNavigationMapFromRoute(routeData, userLocation, destination) {
    if (!routeData) return;
    if (navigationMap) {
        navigationMap.remove();
        navigationMap = null;
    }
    
    const mapContainer = document.getElementById('navigationMap');
    if (!mapContainer) return;
    mapContainer.innerHTML = '';
    
    // Center on first coordinate
    const firstCoord = routeData.geometry?.[0] || userLocation || { lat: 24.7136, lng: 46.6753 };
    navigationMap = L.map('navigationMap').setView([firstCoord.lat, firstCoord.lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(navigationMap);
    
    // Markers
    const userIcon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="width: 30px; height: 30px; background: #3498db; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                <i class="fas fa-map-marker-alt" style="color: white; font-size: 16px;"></i>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(navigationMap)
        .bindPopup('<b>موقعك الحالي</b>');

    let destIconColor = '#27ae60';
    if (destination.traffic === 'medium') destIconColor = '#f39c12';
    else if (destination.traffic === 'high') destIconColor = '#e74c3c';
    else if (destination.traffic === 'severe') destIconColor = '#c0392b';
    const destIcon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="width: 35px; height: 35px; background: ${destIconColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                <i class="fas fa-flag" style="color: white; font-size: 18px;"></i>
            </div>
        `,
        iconSize: [35, 35],
        iconAnchor: [17, 35]
    });
    L.marker([destination.lat, destination.lng], { icon: destIcon })
        .addTo(navigationMap)
        .bindPopup(`<b>${destination.name}</b>`);
    
    // Route polyline
    if (routeData.geometry?.length) {
        navigationRoute = L.polyline(routeData.geometry.map(c => [c.lat, c.lng]), {
            color: '#3498db',
            weight: 5,
            opacity: 0.8
        }).addTo(navigationMap);
        navigationMap.fitBounds(navigationRoute.getBounds(), { padding: [50, 50] });
    }
}

function generateNavigationSteps(routeData, destination) {
    const stepsContainer = document.getElementById('navigationSteps');
    if (!stepsContainer) return;
    stepsContainer.innerHTML = '';

    const stepsData = (routeData.steps && routeData.steps.length > 0)
        ? routeData.steps
        : buildFallbackRoute(currentUserPosition, destination).steps;

    navigationSteps = stepsData;

    stepsData.forEach((step) => {
        const stepEl = document.createElement('div');
        stepEl.className = `navigation-step-item ${step.type}`;
        
        let iconClass = 'navigation-step-icon';
        if (step.type === 'start' || step.type === 'depart') iconClass += ' start';
        else if (step.type === 'arrive') iconClass += ' arrive';
        else if (step.maneuver === 'turn-right') iconClass += ' turn-right';
        else if (step.maneuver === 'turn-left') iconClass += ' turn-left';
        else iconClass += ' straight';
        
        stepEl.innerHTML = `
            <div class="${iconClass}">
                <i class="fas ${step.icon}"></i>
            </div>
            <div class="navigation-step-details">
                <div class="navigation-step-main">
                    <span class="navigation-step-maneuver">${step.instruction}</span>
                    ${step.road ? `<span class="navigation-step-road">على ${step.road}</span>` : ''}
                </div>
                <div class="navigation-step-distance">${step.distance}</div>
            </div>
        `;
        stepsContainer.appendChild(stepEl);
    });
}

function startNavigation() {
    if (!navigationRouteData || !navigationRouteData.geometry || navigationRouteData.geometry.length === 0) {
        showToast('تعذر بدء التنقل لعدم توفر مسار', 'error');
        return;
    }
    if (!currentUserPosition || !navigationDestination) {
        const destination = window.currentLocationSelected || currentLocationSelected;
        if (!destination) {
            showToast('لم يتم العثور على الوجهة', 'error');
            return;
        }
        currentUserPosition = navigationRouteData.geometry[0] || { lat: destination.lat, lng: destination.lng };
        navigationDestination = destination;
    }

    // Reset navigation state
    currentStepIndex = 0;
    navigationProgress = 0;
    navigationRouteIndex = 0;

    // Switch to active navigation screen
    navigateTo('active-navigation-screen');

    // Initialize active navigation map
    initActiveNavigationMap();

    // Start navigation simulation
    startNavigationSimulation();
}

function initActiveNavigationMap() {
    // Remove existing map if any
    if (activeNavigationMap) {
        activeNavigationMap.remove();
        activeNavigationMap = null;
    }
    
    const mapContainer = document.getElementById('activeNavigationMap');
    if (!mapContainer || !currentUserPosition || !navigationDestination) return;
    
    // Clear container
    mapContainer.innerHTML = '';
    
    // Initialize map centered on user position
    activeNavigationMap = L.map('activeNavigationMap').setView([currentUserPosition.lat, currentUserPosition.lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(activeNavigationMap);
    
    // Add user position marker (will be updated)
    const userIcon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="width: 40px; height: 40px; background: #3498db; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <i class="fas fa-map-marker-alt" style="color: white; font-size: 20px;"></i>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });
    
    window.activeNavUserMarker = L.marker([currentUserPosition.lat, currentUserPosition.lng], { icon: userIcon })
        .addTo(activeNavigationMap);
    
    // Add destination marker
    let destIconColor = '#27ae60';
    if (navigationDestination.traffic === 'medium') destIconColor = '#f39c12';
    else if (navigationDestination.traffic === 'high') destIconColor = '#e74c3c';
    else if (navigationDestination.traffic === 'severe') destIconColor = '#c0392b';
    
    const destIcon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="width: 45px; height: 45px; background: ${destIconColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <i class="fas fa-flag" style="color: white; font-size: 22px;"></i>
            </div>
        `,
        iconSize: [45, 45],
        iconAnchor: [22, 45]
    });
    
    window.activeNavDestMarker = L.marker([navigationDestination.lat, navigationDestination.lng], { icon: destIcon })
        .addTo(activeNavigationMap);
    
    // Draw route line from real geometry if available
    if (navigationRouteData?.geometry?.length) {
        window.activeNavRoute = L.polyline(navigationRouteData.geometry.map(c => [c.lat, c.lng]), {
            color: '#3498db',
            weight: 6,
            opacity: 0.8
        }).addTo(activeNavigationMap);
    } else {
        const routeCoordinates = [
            [currentUserPosition.lat, currentUserPosition.lng],
            [navigationDestination.lat, navigationDestination.lng]
        ];
        window.activeNavRoute = L.polyline(routeCoordinates, {
            color: '#3498db',
            weight: 6,
            opacity: 0.8
        }).addTo(activeNavigationMap);
    }
    
    // Update UI
    updateActiveNavigationUI();
}

function startNavigationSimulation() {
    if (navigationInterval) {
        clearInterval(navigationInterval);
    }
    
    if (!navigationRouteData || !navigationRouteData.geometry || navigationRouteData.geometry.length === 0) {
        showToast('لا يوجد مسار للتنقل', 'error');
        return;
    }

    initialNavigationDistance = navigationRouteData.distanceKm || initialNavigationDistance;
    const coords = navigationRouteData.geometry;
    navigationRouteIndex = 0;

    // pace in points per tick
    const stepSize = Math.max(1, Math.floor(coords.length / 120)); // ~60s animation

    navigationInterval = setInterval(() => {
        navigationRouteIndex = Math.min(navigationRouteIndex + stepSize, coords.length - 1);
        currentUserPosition = { ...coords[navigationRouteIndex] };

        // Update map marker
        if (window.activeNavUserMarker) {
            window.activeNavUserMarker.setLatLng([currentUserPosition.lat, currentUserPosition.lng]);
            activeNavigationMap.setView([currentUserPosition.lat, currentUserPosition.lng], 15);
        }

        // Update progress
        const traveledDistance = initialNavigationDistance * (navigationRouteIndex / (coords.length - 1));
        navigationProgress = Math.min(100, (traveledDistance / initialNavigationDistance) * 100);

        // Update current step based on progress
        updateCurrentStep();

        // Update UI
        updateActiveNavigationUI();

        // Arrived
        if (navigationRouteIndex >= coords.length - 1) {
            stopNavigation();
            showToast(`وصلت إلى ${navigationDestination.name}`, 'success');
        }
    }, 500);
}

function updateCurrentStep() {
    if (!navigationSteps || navigationSteps.length === 0 || initialNavigationDistance === 0) return;

    const traveledDistance = (navigationProgress / 100) * initialNavigationDistance;

    for (let i = 0; i < navigationSteps.length; i++) {
        const step = navigationSteps[i];
        if (traveledDistance >= step.cumulativeDistance || i === navigationSteps.length - 1) {
            if (currentStepIndex !== i) {
                currentStepIndex = i;
                updateActiveNavigationInstruction();
            }
            break;
        }
    }
}

function updateActiveNavigationInstruction() {
    if (!navigationSteps || currentStepIndex >= navigationSteps.length) return;
    
    const step = navigationSteps[currentStepIndex];
    const iconEl = document.getElementById('activeNavIcon');
    const instructionEl = document.getElementById('activeNavInstruction');
    const roadEl = document.getElementById('activeNavRoad');
    const nextDistanceEl = document.getElementById('activeNavNextDistance');
    
    if (iconEl) {
        iconEl.innerHTML = `<i class="fas ${step.icon}"></i>`;
        iconEl.className = 'active-nav-instruction-icon';
        if (step.type === 'start') iconEl.classList.add('start');
        else if (step.type === 'arrive') iconEl.classList.add('arrive');
        else if (step.maneuver === 'turn-right') iconEl.classList.add('turn-right');
        else if (step.maneuver === 'turn-left') iconEl.classList.add('turn-left');
        else iconEl.classList.add('straight');
    }
    
    if (instructionEl) {
        instructionEl.textContent = step.instruction;
    }
    
    if (roadEl) {
        roadEl.textContent = step.road ? `على ${step.road}` : '';
    }
    
    // Calculate distance to next step based on route progress
    const nextStep = navigationSteps[currentStepIndex + 1];
    const traveledDistance = (navigationProgress / 100) * initialNavigationDistance;
    const remainingToNext = nextStep ? Math.max(nextStep.cumulativeDistance - traveledDistance, 0) : 0;
    if (nextDistanceEl) {
        nextDistanceEl.textContent = nextStep ? formatDistance(remainingToNext) : '0 م';
    }
}

function updateActiveNavigationUI() {
    const remainingDistance = calculateDistance(
        currentUserPosition.lat,
        currentUserPosition.lng,
        navigationDestination.lat,
        navigationDestination.lng
    );
    
    const timeEl = document.getElementById('activeNavTime');
    const distanceEl = document.getElementById('activeNavDistance');
    const totalDistanceEl = document.getElementById('activeNavTotalDistance');
    const totalTimeEl = document.getElementById('activeNavTotalTime');
    const progressEl = document.getElementById('activeNavProgress');
    
    if (timeEl) {
        timeEl.textContent = navigationTotalDurationSec
            ? formatDurationFromSeconds((navigationTotalDurationSec * remainingDistance) / (initialNavigationDistance || 1))
            : estimateTravelTime(remainingDistance, navigationDestination.traffic);
    }
    
    if (distanceEl) {
        distanceEl.textContent = formatDistance(remainingDistance);
    }
    
    if (totalDistanceEl) {
        totalDistanceEl.textContent = formatDistance(initialNavigationDistance);
    }
    
    if (totalTimeEl) {
        totalTimeEl.textContent = navigationTotalDurationSec
            ? formatDurationFromSeconds(navigationTotalDurationSec)
            : estimateTravelTime(initialNavigationDistance, navigationDestination.traffic);
    }
    
    if (progressEl) {
        progressEl.style.width = `${navigationProgress}%`;
    }
}

function stopNavigation() {
    if (navigationInterval) {
        clearInterval(navigationInterval);
        navigationInterval = null;
    }
    
    // Reset state
    currentStepIndex = 0;
    navigationProgress = 0;
    
    // Go back to location details
    navigateTo('location-details');
}

function toggleNavMenu() {
    showToast('قائمة التنقل قريباً', 'info');
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
window.startNavigation = startNavigation;
window.stopNavigation = stopNavigation;
window.toggleNavMenu = toggleNavMenu;

