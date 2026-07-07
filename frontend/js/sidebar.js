const NAV_ITEMS = [
    {
        label: 'Dashboard', icon: '🏠', href: 'dashboard.html',
        roles: ['owner', 'head_coach', 'coach', 'athlete']
    },
    {
        label: 'Timetable', icon: '🗓️', href: 'timetable.html',
        roles: ['owner', 'head_coach', 'coach', 'athlete']
    },
    {
        label: 'Batches & Attendance', icon: '👥', href: 'batches.html',
        roles: ['head_coach', 'coach']
    },
    {
        label: 'Coach Attendance', icon: '📋', href: 'batches.html',
        roles: ['owner']
    },
    {
        label: 'My Attendance', icon: '📅', href: 'my-attendance.html',
        roles: ['athlete']
    },
    {
        label: 'Session & Voice Logging', icon: '🎙️', href: 'sessions.html',
        roles: ['head_coach', 'coach']
    },
    {
        label: 'Performance & Benchmarks', icon: '📈', href: 'performance.html',
        roles: ['owner', 'head_coach', 'coach', 'athlete']
    },
    {
        label: 'My Profile', icon: '👤', href: 'my-profile.html',
        roles: ['athlete']
    },
    {
        label: 'Resource Management', icon: '🎒', href: 'resources.html',
        roles: ['owner', 'head_coach', 'coach']
    },
    {
        label: 'Fee Collection', icon: '💰', href: 'fees.html',
        roles: ['owner', 'head_coach', 'coach']
    },
    {
        label: 'Bulk Import', icon: '📥', href: 'import.html',
        roles: ['owner']
    },
    {
        label: 'Manage Roster', icon: '📋', href: 'roster.html',
        roles: ['owner', 'head_coach', 'coach']
    },
];

const ROLE_LABELS = {
    owner: 'Owner',
    head_coach: 'Head Coach',
    coach: 'Coach',
    athlete: 'Athlete',
};

const SPORT_LABELS = {
    cricket: 'CRICKET ACADEMY',
    tennis: 'TENNIS ACADEMY',
    kabaddi: 'KABADDI ACADEMY',
};

const SPORT_ICONS = {
    cricket: '🏏',
    tennis: '🎾',
    kabaddi: '🤼',
};

function getStoredUser() {
    try {
        const data = JSON.parse(localStorage.getItem('user'));
        return data?.user || data || null;
    } catch {
        return null;
    }
}

function getToken() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) return user.token;
        return localStorage.getItem('token');
    } catch {
        return null;
    }
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const user = getStoredUser();
    const token = getToken();

    if (!user || !token) {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'login.html' && currentPage !== 'register.html') {
            window.location.href = 'login.html';
        }
        return;
    }

    const role = user?.role;
    if (!role) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }
    const sport = user?.sport || 'cricket';
    const initials = user?.initials ||
        (user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO');
    const name = user?.name || 'Coach';
    const roleLabel = ROLE_LABELS[role] || 'Coach';
    const sportLabel = (user?.academyName ? user.academyName.toUpperCase() : null) || SPORT_LABELS[sport] || 'SPORTS ACADEMY';
    const sportIcon = SPORT_ICONS[sport] || '🏆';

    const filtered = NAV_ITEMS.filter(item => item.roles.includes(role));
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    const navMarkup = filtered.map(item => {
        const isActive = item.href === currentPage;
        return `
            <li>
                <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}" data-href="${item.href}">
                    <span class="nav-icon">${item.icon}</span>
                    <span class="nav-text">${item.label}</span>
                </a>
            </li>`;
    }).join('');

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <div class="logo-icon">${sportIcon}</div>
                <div class="logo-copy">
                    <div class="logo-title">Sports OS</div>
                    <div class="logo-subtitle">${sportLabel}</div>
                </div>
            </div>
            <div style="position:relative;">
                <button id="notificationBellBtn" aria-label="Notifications"
                    style="position:relative;background:none;border:none;cursor:pointer;font-size:20px;padding:6px;color:#fff;">
                    🔔
                    <span id="notificationBadge"
                        style="display:none;position:absolute;top:2px;right:2px;background:#DC2626;color:#fff;
                        font-size:10px;font-weight:700;border-radius:999px;min-width:16px;height:16px;
                        line-height:16px;text-align:center;padding:0 3px;"></span>
                </button>
                <div id="notificationDropdown"
    style="display:none;position:fixed;width:300px;max-height:360px;
                    overflow-y:auto;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.18);
                    z-index:9999;">
                    <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:10px 12px;border-bottom:1px solid #F0F0F0;">
                        <span style="font-size:13px;font-weight:700;color:#111827;">Notifications</span>
                        <button id="markAllReadBtn"
                            style="background:none;border:none;color:#2563EB;font-size:12px;cursor:pointer;">Mark all read</button>
                    </div>
                    <div id="notificationList"></div>
                </div>
            </div>
        </div>
        <nav class="sidebar-nav">
            <ul>${navMarkup}</ul>
        </nav>
        <div class="sidebar-footer">
            <div class="sidebar-user">
                <div class="avatar">${initials}</div>
                <div class="user-details">
                    <span class="user-name">${name}</span>
                    <span class="user-role">${roleLabel}</span>
                </div>
            </div>
            <button id="logoutBtn" class="btn-logout">Logout</button>
        </div>
    `;

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Render sidebar content first ──────────────────────────────────────
    renderSidebar();

    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    // ── 2. Create hamburger button ────────────────────────────────────────────
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-btn';
    hamburgerBtn.innerHTML = '☰';
    hamburgerBtn.setAttribute('aria-label', 'Open menu');
    document.body.appendChild(hamburgerBtn);

    // ── 3. Create overlay ─────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // ── 4. Single open/close state ────────────────────────────────────────────
    let sidebarOpen = false;
    const MOBILE_BREAKPOINT = 1024;

    function isMobileViewport() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function openSidebar() {
        sidebarOpen = true;
        sidebarEl.style.transform = 'translateX(0)';
        overlay.style.display = 'block';
        hamburgerBtn.innerHTML = '✕';
        hamburgerBtn.setAttribute('aria-label', 'Close menu');
    }

    function closeSidebar() {
        sidebarOpen = false;
        sidebarEl.style.transform = 'translateX(-250px)';
        overlay.style.display = 'none';
        hamburgerBtn.innerHTML = '☰';
        hamburgerBtn.setAttribute('aria-label', 'Open menu');
    }

    // ── 5. Hamburger toggle ───────────────────────────────────────────────────
    hamburgerBtn.addEventListener('click', () => {
        if (sidebarOpen) closeSidebar();
        else openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    sidebarEl.addEventListener('click', (e) => {
        if (e.target.closest('.nav-link') && isMobileViewport()) {
            closeSidebar();
        }
    });

    // ── 6. Layout engine ──────────────────────────────────────────────────────
    // Desktop (width > 1024px): sidebar permanently visible, no hamburger.
    // Mobile (width <= 1024px): sidebar hidden behind hamburger toggle.
    function applyLayout() {
        const mainContent = document.querySelector('.main-content');

        if (isMobileViewport()) {
            hamburgerBtn.style.display = 'flex';
            if (!sidebarOpen) {
                sidebarEl.style.transform = 'translateX(-250px)';
            }
            if (mainContent) mainContent.style.marginLeft = '0';
        } else {
            // Desktop: always show sidebar, hide hamburger/overlay
            sidebarEl.style.transform = 'translateX(0)';
            hamburgerBtn.style.display = 'none';
            overlay.style.display = 'none';
            if (mainContent) mainContent.style.marginLeft = '250px';
            sidebarOpen = false;
        }
    }

    // ── 7. Init ───────────────────────────────────────────────────────────────
    applyLayout();

    window.addEventListener('resize', applyLayout);
});