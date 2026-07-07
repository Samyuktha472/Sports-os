const API_BASE_URL = `${window.location.origin}/api`;

function getToken() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
}

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('user')) || null;
    } catch { return null; }
}

function redirectToLogin() { window.location.href = 'login.html'; }
const INVITE_PERMISSIONS = {
    owner: ['head_coach', 'coach', 'athlete'],
    head_coach: ['coach', 'athlete'],
    coach: ['athlete'],
};

const inviteEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function renderInviteSection() {
    const user = getStoredUser();
    const inviteCard = document.getElementById('inviteCard');
    if (!inviteCard || !user || user.role === 'athlete') {
        if (inviteCard) inviteCard.style.display = 'none';
        return;
    }

    const allowedRoles = INVITE_PERMISSIONS[user.role] || [];
    const roleSelect = document.getElementById('inviteRole');
    if (!roleSelect) return;
    roleSelect.innerHTML = allowedRoles.map(role => `<option value="${role}">${ROLE_LABELS[role] || role}</option>`).join('');

    // Sport dropdown — backend requires a sport on every invite.
    // Use the academy's sports list if present, else fall back to the single sport field.
    const sportSelect = document.getElementById('inviteSport');
    if (sportSelect) {
        const academySports = (Array.isArray(user.sports) && user.sports.length > 0)
            ? user.sports
            : [user.sport || 'cricket'];
        const sportLabels = { cricket: '🏏 Cricket', tennis: '🎾 Tennis', kabaddi: '🤾 Kabaddi' };
        sportSelect.innerHTML = academySports
            .map(s => `<option value="${s}">${sportLabels[s] || s}</option>`)
            .join('');
    }

    inviteCard.style.display = 'block';
}

async function handleInviteCreate() {
    const feedbackEl = document.getElementById('inviteFeedback');
    const linkEl = document.getElementById('inviteLink');
    const copyBtn = document.getElementById('copyInviteLinkBtn');
    feedbackEl.textContent = '';
    linkEl.style.display = 'none';
    copyBtn.style.display = 'none';

    const email = document.getElementById('inviteEmail').value.trim();
    const role = document.getElementById('inviteRole').value;
    const sport = document.getElementById('inviteSport')?.value;
    if (!inviteEmailRegex.test(email)) {
        feedbackEl.textContent = 'Enter a valid email address.';
        return;
    }

    const token = getToken();
    if (!token) { redirectToLogin(); return; }

    try {
        const res = await fetch(`${API_BASE_URL}/invites/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email, role, sport }),
        });

        const data = await res.json();
        if (!res.ok) {
            feedbackEl.textContent = data.message || 'Unable to create invite link.';
            return;
        }

        linkEl.value = data.link;
        linkEl.style.display = 'block';
        copyBtn.style.display = 'inline-flex';
        feedbackEl.textContent = 'Invite link created. Copy and share it manually.';
    } catch (err) {
        console.error('Error creating invite:', err);
        feedbackEl.textContent = 'Unable to create invite link. Please try again.';
    }
}

function copyInviteLink() {
    const linkEl = document.getElementById('inviteLink');
    if (!linkEl) return;
    navigator.clipboard.writeText(linkEl.value).then(() => {
        document.getElementById('inviteFeedback').textContent = 'Copied to clipboard!';
    }).catch(() => {
        document.getElementById('inviteFeedback').textContent = 'Copy failed. Please copy the link manually.';
    });
}

// ─────────────────────────────────────────────────────────────
// Sport-specific content config — drives all dashboard text
// ─────────────────────────────────────────────────────────────
const SPORT_CONTENT = {
    cricket: {
        icon: '🏏',
        nextMatch: {
            title: 'U-16 Elite vs Mumbai Colts',
            time: '🕐 Sat, 10:30 AM',
            location: '📍 Wankhede Practice Ground',
            tags: ['T20 · League', 'Squad: 14', '5 days out'],
        },
        practiceList: [
            { status: 'dark', title: 'Net 3 (Throw-downs)', meta: 'R. Gaikwad', time: '10:00–11:30' },
            { status: 'yellow', title: 'Center Wicket', meta: 'Match Sim · U-19', time: '11:00–13:00' },
        ],
        workloadLabel: 'FAST BOWLER WORKLOAD',
        equipmentStats: [
            { label: 'NEW LEATHER BALLS', value: '48', note: '~6 today' },
            { label: 'OLD BALLS (PRACTICE)', value: '212', note: 'stable' },
            { label: 'BOWLING MACHINES', value: '3/4', note: '1 maintenance' },
        ],
        athletePerfStats: [
            { label: 'Strike Rate', value: '162', highlight: true },
            { label: 'Average', value: '48' },
            { label: 'Attendance', value: '92%', highlight: true },
            { label: 'Sessions', value: '14' },
        ],
        athleteNextEvent: {
            title: 'Net 3 (Throw-downs)',
            time: '🕐 Today, 10:00 AM',
            location: '📍 Wankhede Practice Ground',
        },
    },
    tennis: {
        icon: '🎾',
        nextMatch: {
            title: 'U-16 Elite vs City Aces',
            time: '🕐 Sat, 10:30 AM',
            location: '📍 Main Court Complex',
            tags: ['Singles · League', 'Squad: 14', '5 days out'],
        },
        practiceList: [
            { status: 'dark', title: 'Practice Wall', meta: 'M. Rao', time: '10:00–11:30' },
            { status: 'yellow', title: 'Center Court', meta: 'Match Sim · U-19', time: '11:00–13:00' },
        ],
        workloadLabel: 'SERVE LOAD MONITOR',
        equipmentStats: [
            { label: 'NEW TENNIS BALLS', value: '60', note: '~12 today' },
            { label: 'PRACTICE BALLS', value: '140', note: 'stable' },
            { label: 'BALL MACHINES', value: '1/1', note: 'ok' },
        ],
        athletePerfStats: [
            { label: 'First Serve %', value: '68%', highlight: true },
            { label: 'Rally Win %', value: '54%' },
            { label: 'Attendance', value: '92%', highlight: true },
            { label: 'Sessions', value: '14' },
        ],
        athleteNextEvent: {
            title: 'Practice Wall',
            time: '🕐 Today, 10:00 AM',
            location: '📍 Main Court Complex',
        },
    },
    kabaddi: {
        icon: '🤼',
        nextMatch: {
            title: 'U-16 Elite vs Iron Lions',
            time: '🕐 Sat, 10:30 AM',
            location: '📍 Main Mat',
            tags: ['Pro Kabaddi · League', 'Squad: 14', '5 days out'],
        },
        practiceList: [
            { status: 'dark', title: 'Fitness Zone', meta: 'K. Patil', time: '10:00–11:30' },
            { status: 'yellow', title: 'Main Mat', meta: 'Match Sim · U-19', time: '11:00–13:00' },
        ],
        workloadLabel: 'RAID LOAD MONITOR',
        equipmentStats: [
            { label: 'LIME POWDER', value: '20', note: 'stable' },
            { label: 'KABADDI MATS', value: '2', note: 'ok' },
            { label: 'JERSEYS / BIBS', value: '30', note: 'ok' },
        ],
        athletePerfStats: [
            { label: 'Raid Points', value: '7', highlight: true },
            { label: 'Tackle Points', value: '4' },
            { label: 'Attendance', value: '92%', highlight: true },
            { label: 'Sessions', value: '14' },
        ],
        athleteNextEvent: {
            title: 'Fitness Zone',
            time: '🕐 Today, 10:00 AM',
            location: '📍 Main Mat',
        },
    },
};

function getSportContent() {
    const user = getStoredUser();
    const sport = user?.sport || 'cricket';
    return SPORT_CONTENT[sport] || SPORT_CONTENT.cricket;
}

function getGreetingWord() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good evening'; // late night fallback
}

function setDashboardHeader() {
    const user = getStoredUser();
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

    const dateEl = document.getElementById('pageDate');
    if (dateEl) dateEl.textContent = `${weekday} · ${day} ${month}`;

    // Time-based greeting + first name
    const pageTitleEl = document.querySelector('.page-title');
    if (pageTitleEl) {
        pageTitleEl.innerHTML = `${getGreetingWord()}, <span id="greetingName"></span>.`;
    }
    const greetingEl = document.getElementById('greetingName');
    if (greetingEl && user?.name) greetingEl.textContent = user.name.split(' ')[0];

    // Academy name — backend returns this as "academyName" (see authController.js),
    // so this MUST read user.academyName, not user.academy.
    const academyNameEl = document.getElementById('academyName');
    if (academyNameEl && user?.academyName) academyNameEl.innerText = user.academyName;
}

function renderDashboard() {
    const user = getStoredUser();
    const role = user?.role;
    const sport = user?.sport || '';
    const sportIcon = { cricket: '🏏', tennis: '🎾', kabaddi: '🤼' }[sport] || '🏆';
    const token = getToken();

    // Next match card — real data from API, no hardcoded fallback
    const matchTitleEl = document.getElementById('nextMatchTitle');
    const matchTimeEl = document.getElementById('nextMatchTime');
    const matchLocEl = document.getElementById('nextMatchLocation');
    const matchTagsEl = document.getElementById('nextMatchTags');
    if (matchTitleEl) matchTitleEl.textContent = 'Loading…';
    fetch(`${API_BASE_URL}/matches/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.ok ? r.json() : null)
    .then(match => {
        if (!match) {
            if (matchTitleEl) matchTitleEl.textContent = 'No upcoming match scheduled';
            if (matchTimeEl) matchTimeEl.textContent = '';
            if (matchLocEl) matchLocEl.textContent = '';
            if (matchTagsEl) matchTagsEl.innerHTML = '';
            return;
        }
        const dateObj = new Date(match.matchDate);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const daysOut = Math.max(0, Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24)));

        if (matchTitleEl) {
    console.log(match);

    const batchName = match.batch?.name || "Selected Batch";
    matchTitleEl.textContent = `${batchName} vs ${match.opponent}`;
}

if (matchTimeEl) {
    matchTimeEl.textContent = `🕐 ${dateStr}, ${timeStr}`;
}

if (matchLocEl) {
    matchLocEl.textContent = match.location ? `📍 ${match.location}` : '';
}

if (matchTagsEl) {
    matchTagsEl.innerHTML = [
        match.format ? `<span class="pill">${match.format}</span>` : '',
        match.squadSize ? `<span class="pill">Squad: ${match.squadSize}</span>` : '',
        `<span class="pill green-pill">${daysOut} day${daysOut === 1 ? '' : 's'} out</span>`,
    ].join('');
}

})   // closes .then(match => {

.catch(() => {
    if (matchTitleEl) {
        matchTitleEl.textContent = 'Unable to load match data.';
    }
});

    // Hide "Manage" link for athletes
    const manageLinkEl = document.querySelector('.practice-net-card .text-link');
    if (manageLinkEl && role === 'athlete') manageLinkEl.style.display = 'none';

    // Practice list — real sessions from API
    const practiceListEl = document.getElementById('practiceList');
    if (practiceListEl) {
        if (role === 'athlete') {
            practiceListEl.innerHTML = '<p class="card-subtext">No upcoming sessions.</p>';
        } else {
            practiceListEl.innerHTML = '<p class="card-subtext">Loading sessions...</p>';
            fetch(`${API_BASE_URL}/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(r => r.ok ? r.json() : [])
            .then(sessions => {
                if (!sessions.length) {
                    practiceListEl.innerHTML = '<p class="card-subtext">No sessions logged yet. <a href="sessions.html">Add a session →</a></p>';
                    return;
                }
                practiceListEl.innerHTML = sessions.slice(0, 3).map(s => `
                    <div class="practice-row">
                        <span class="status-dot dark"></span>
                        <div class="practice-info">
                            <p class="practice-title">${s.title || s.activityType || 'Session'}</p>
                            <p class="practice-meta">${s.coachName || s.batchName || ''}</p>
                        </div>
                        <span class="practice-time">${s.startTime || ''}</span>
                    </div>
                `).join('');
            })
            .catch(() => {
                practiceListEl.innerHTML = '<p class="card-subtext">Unable to load sessions.</p>';
            });
        }
    }

    // Equipment snapshot — real data from API
    const equipmentTitleEl = document.getElementById('equipmentTitle');
    const equipmentStatsEl = document.getElementById('equipmentStats');
    if (equipmentTitleEl) equipmentTitleEl.textContent = `${sportIcon} Equipment Snapshot`;
    if (equipmentStatsEl) {
        equipmentStatsEl.innerHTML = '<p class="card-subtext">Loading equipment...</p>';
        fetch(`${API_BASE_URL}/resources`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => r.ok ? r.json() : [])
        .then(resources => {
            if (!resources.length) {
                equipmentStatsEl.innerHTML = '<p class="card-subtext">No equipment added yet. <a href="resources.html">Add equipment →</a></p>';
                return;
            }
            equipmentStatsEl.innerHTML = resources.slice(0, 3).map(r => `
                <div class="stat-box">
                    <p class="stat-label">${(r.name || '').toUpperCase()}</p>
                    <p class="stat-value">${r.quantity ?? '—'}</p>
                    <p class="stat-note">${r.condition || r.status || ''}</p>
                </div>
            `).join('');
        })
        .catch(() => {
            equipmentStatsEl.innerHTML = '<p class="card-subtext">Unable to load equipment.</p>';
        });
    }

    // Role-based visibility
    if (role === 'athlete') {
        const alertsCard = document.querySelector('.workload-card');
        const equipCard = document.querySelector('.equipment-card');
        const attendanceSummaryCard = document.querySelector('.attendance-summary-card');
        if (alertsCard) alertsCard.style.display = 'none';
        if (equipCard) equipCard.style.display = 'none';
        if (attendanceSummaryCard) attendanceSummaryCard.style.display = 'none';

        // Athletes can see the upcoming match, but shouldn't create/edit it
        const enterMatchBtn = document.getElementById('enterMatchModeBtn');
        const viewSquadBtn = document.getElementById('viewSquadBtn');
        if (enterMatchBtn) enterMatchBtn.style.display = 'none';
        if (viewSquadBtn) viewSquadBtn.style.display = 'none';
    }

    if (role === 'coach') {
        const workloadCard = document.querySelector('.workload-card');
        if (workloadCard) workloadCard.style.display = 'none';
        const subtitle = document.querySelector('.page-subtitle');
        if (subtitle) subtitle.textContent = "Here's what's happening with your batch today.";
    }
}

// ─────────────────────────────────────────────────────────────
// Attendance Summary Card — coach/owner/head_coach only
// FIX: pct = present / totalAthletes (not present / marked)
// ─────────────────────────────────────────────────────────────
async function loadAttendanceSummary() {
    const user = getStoredUser();
    if (user?.role === 'athlete') return;

    const statsEl = document.getElementById('attendanceSummaryStats');
    const subEl = document.getElementById('attendanceSummarySub');
    if (!statsEl) return;

    const token = getToken();
    const today = new Date().toISOString().slice(0, 10);

    try {
        const athletesRes = await fetch(`${API_BASE_URL}/roster/athletes`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const athletes = athletesRes.ok ? await athletesRes.json() : [];
        const totalAthletes = Array.isArray(athletes) ? athletes.length : 0;

        const batchesRes = await fetch(`${API_BASE_URL}/batches`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const batches = batchesRes.ok ? await batchesRes.json() : [];

        let present = 0;
        let marked = 0;

        if (Array.isArray(batches) && batches.length > 0) {
            const attendanceResults = await Promise.all(
                batches.map(b =>
                    fetch(`${API_BASE_URL}/attendance?batchId=${b._id}&date=${today}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                        .then(r => (r.ok ? r.json() : null))
                        .catch(() => null)
                )
            );

            attendanceResults.forEach(doc => {
                if (doc && Array.isArray(doc.records)) {
                    doc.records.forEach(r => {
                        marked++;
                        if (r.status === 'present') present++;
                    });
                }
            });
        }

        // ✅ FIX: divide by totalAthletes, not marked
        const pct = totalAthletes > 0 ? Math.round((present / totalAthletes) * 100) : 0;

        if (subEl) {
            subEl.textContent = marked > 0
                ? `${present} present · ${marked - present} absent · ${totalAthletes - marked} not yet marked`
                : 'No attendance marked yet today';
        }

        statsEl.innerHTML = `
            <div class="stat-box">
                <p class="stat-label">TOTAL ATHLETES</p>
                <p class="stat-value">${totalAthletes}</p>
            </div>
            <div class="stat-box">
                <p class="stat-label">PRESENT TODAY</p>
                <p class="stat-value">${present}</p>
            </div>
            <div class="stat-box">
                <p class="stat-label">ATTENDANCE %</p>
                <p class="stat-value">${totalAthletes > 0 ? pct + '%' : '—'}</p>
            </div>`;
    } catch (err) {
        console.error('Error loading attendance summary:', err);
        if (subEl) subEl.textContent = 'Unable to load attendance.';
        statsEl.innerHTML = '<p class="stat-label">No data available.</p>';
    }
}

// ─────────────────────────────────────────────────────────────
// Workload Alerts — real data from backend
// ─────────────────────────────────────────────────────────────
async function loadWorkloadAlerts() {
    const workloadLabelEl = document.getElementById('workloadLabel');
    const workloadBadgeEl = document.getElementById('workloadBadge');
    const workloadAlertsEl = document.getElementById('workloadAlerts');
    if (!workloadAlertsEl) return;

    const token = getToken();
    try {
        const res = await fetch(`${API_BASE_URL}/performance/workload-alerts`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load workload alerts');
        const data = await res.json();

        if (workloadLabelEl) workloadLabelEl.textContent = data.label;
        if (workloadBadgeEl) {
            workloadBadgeEl.textContent = data.criticalCount > 0
                ? `${data.criticalCount} CRITICAL`
                : 'ALL CLEAR';
            workloadBadgeEl.className = data.criticalCount > 0 ? 'badge red' : 'badge green';
        }

        if (!data.alerts || !data.alerts.length) {
            workloadAlertsEl.innerHTML = '<p class="card-subtext">No workload concerns this week.</p>';
            return;
        }

        workloadAlertsEl.innerHTML = data.alerts.map(a => `
            <div class="alert-row ${a.badgeClass === 'red' ? 'alert-high' : 'alert-ok'}">
                <div class="alert-icon">${a.icon}</div>
                <div>
                    <p class="alert-title">${a.title}</p>
                    <p class="alert-meta">${a.meta}</p>
                </div>
                <span class="badge ${a.badgeClass}">${a.badge}</span>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading workload alerts:', err);
        if (workloadAlertsEl) workloadAlertsEl.innerHTML = '<p class="card-subtext">Unable to load workload data.</p>';
    }
}

// ─────────────────────────────────────────────────────────────
// Athlete extras: profile, performance, streak, to-dos, quote
// ─────────────────────────────────────────────────────────────
const MOTIVATIONAL_QUOTES = [
    "Discipline is choosing between what you want now and what you want most.",
    "Champions keep playing until they get it right.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "Hard work beats talent when talent doesn't work hard.",
    "Small steps every day lead to big results.",
    "You don't have to be great to start, but you have to start to be great.",
    "Push yourself, because no one else is going to do it for you.",
    "Train like you've never won. Perform like you've never lost.",
];

function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
}

function renderAthleteProfile(user) {
    const avatarEl = document.getElementById('athleteAvatar');
    const nameEl = document.getElementById('athleteProfileName');
    const metaEl = document.getElementById('athleteProfileMeta');
    if (avatarEl) avatarEl.textContent = getInitials(user?.name);
    if (nameEl) nameEl.textContent = user?.name || 'Athlete';
    if (metaEl) {
        const sport = (user?.sport || '').charAt(0).toUpperCase() + (user?.sport || '').slice(1);
        metaEl.textContent = `${sport} · ${user?.batchAssigned || 'No batch assigned'}`;
    }
}

const DASHBOARD_PROFILE_METRICS = {
    cricket: ['Batting Strike Rate', 'Batting Average'],
    tennis: ['First Serve %', 'Rally Win %'],
    kabaddi: ['Raid Points', 'Tackle Points'],
};

async function renderAthletePerfStats() {
    const user = getStoredUser();
    const el = document.getElementById('athletePerfStatsEl');
    if (!el || !user) return;

    const metrics = DASHBOARD_PROFILE_METRICS[user.sport] || DASHBOARD_PROFILE_METRICS.cricket;
    const token = getToken();

    // Placeholder while real data loads
    el.innerHTML = `
        <div class="stat-box"><p class="stat-label">${metrics[0]}</p><p class="stat-value">—</p></div>
        <div class="stat-box"><p class="stat-label">${metrics[1]}</p><p class="stat-value">—</p></div>
        <div class="stat-box"><p class="stat-label">Attendance</p><p class="stat-value">—</p></div>
        <div class="stat-box"><p class="stat-label">Sessions</p><p class="stat-value">—</p></div>
    `;

    // Latest real value for each sport-specific metric (no fake fallback)
    const metricValues = await Promise.all(metrics.map(async (metric) => {
        try {
            const res = await fetch(`${API_BASE_URL}/performance?athleteId=${user.id}&metric=${encodeURIComponent(metric)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.ok ? await res.json() : { records: [] };
            if (data.records && data.records.length > 0) {
                return data.records[data.records.length - 1].value;
            }
        } catch (err) {
            console.error('Error loading performance metric:', err);
        }
        return '—';
    }));

    // Real attendance % and session count this month, from the athlete's own attendance history
    let attendanceDisplay = '—', sessionsDisplay = '—';
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const res = await fetch(`${API_BASE_URL}/attendance/my`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const history = res.ok ? await res.json() : [];
        const thisMonth = (Array.isArray(history) ? history : []).filter(r => new Date(r.date) >= monthStart);
        const present = thisMonth.filter(r => r.status === 'present').length;
        const total = thisMonth.length;
        attendanceDisplay = total > 0 ? `${Math.round((present / total) * 100)}%` : '—';
        sessionsDisplay = total > 0 ? total : '—';
    } catch (err) {
        console.error('Error loading attendance summary:', err);
    }

    el.innerHTML = `
        <div class="stat-box"><p class="stat-label">${metrics[0]}</p><p class="stat-value">${metricValues[0]}</p></div>
        <div class="stat-box"><p class="stat-label">${metrics[1]}</p><p class="stat-value">${metricValues[1]}</p></div>
        <div class="stat-box"><p class="stat-label">Attendance</p><p class="stat-value">${attendanceDisplay}</p></div>
        <div class="stat-box"><p class="stat-label">Sessions</p><p class="stat-value">${sessionsDisplay}</p></div>
    `;
}

function renderMotivationQuote() {
    const el = document.getElementById('motivationQuote');
    if (!el) return;
    const dayIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
    el.textContent = `"${MOTIVATIONAL_QUOTES[dayIndex]}"`;
}

function updateLoginStreak(user) {
    const streakEl = document.getElementById('streakValue');
    const subEl = document.getElementById('streakSub');
    if (!streakEl) return;

    const key = `streak_${user?.id || user?.email || 'user'}`;
    const todayStr = new Date().toDateString();

    let data;
    try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch { data = {}; }

    if (data.lastLoginDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = data.lastLoginDate === yesterday.toDateString();
        data.streak = wasYesterday ? (data.streak || 0) + 1 : 1;
        data.lastLoginDate = todayStr;
        localStorage.setItem(key, JSON.stringify(data));
    }

    const streak = data.streak || 1;
    streakEl.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
    if (subEl) {
        subEl.textContent = streak >= 7
            ? "You're on fire! Keep it going."
            : 'Log in daily to build your streak.';
    }
}

async function renderAthleteTodos(content) {
    const listEl = document.getElementById('athleteTodoList');
    if (!listEl) return;

    const key = 'athlete_todos_' + new Date().toDateString();
    let checked;
    try { checked = JSON.parse(localStorage.getItem(key)) || {}; } catch { checked = {}; }

    // Check for a real session today matching this athlete's batch — no fake fallback
    const user = getStoredUser();
    let todaySessionTitle = null;
    try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const res = await fetch(`${API_BASE_URL}/sessions?date=${todayStr}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const sessions = res.ok ? await res.json() : [];
        const mySession = (Array.isArray(sessions) ? sessions : []).find(
            s => s.batch?.name && user?.batchAssigned && s.batch.name.toLowerCase() === user.batchAssigned.toLowerCase()
        );
        if (mySession) todaySessionTitle = mySession.drillType;
    } catch (err) {
        console.error('Error checking today\'s session:', err);
    }

    const todos = [
        ...(todaySessionTitle ? [{ id: 'session', label: `Attend session: ${todaySessionTitle}` }] : []),
        { id: 'hydrate', label: 'Stay hydrated through training' },
        { id: 'log_notes', label: 'Check coach notes from last session' },
        { id: 'warmup', label: 'Complete warm-up routine before practice' },
    ];

    listEl.innerHTML = todos.map(t => `
        <label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;">
            <input type="checkbox" class="athlete-todo-checkbox" data-id="${t.id}" ${checked[t.id] ? 'checked' : ''}>
            <span style="${checked[t.id] ? 'text-decoration:line-through;color:var(--color-muted);' : ''}">${t.label}</span>
        </label>
    `).join('');

    listEl.querySelectorAll('.athlete-todo-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            let state;
            try { state = JSON.parse(localStorage.getItem(key)) || {}; } catch { state = {}; }
            state[cb.dataset.id] = cb.checked;
            localStorage.setItem(key, JSON.stringify(state));
            renderAthleteTodos(content);
        });
    });
}

// ─────────────────────────────────────────────────────────────
// Match Mode — real match creation
// ─────────────────────────────────────────────────────────────
function closeMatchModal() {
    const overlay = document.getElementById('matchModalOverlay');
    if (overlay) overlay.style.display = 'none';
    const feedbackEl = document.getElementById('matchModalFeedback');
    if (feedbackEl) feedbackEl.textContent = '';
}
async function loadMatchBatches() {
    const batchSelect = document.getElementById("matchBatch");
    const sportSelect = document.getElementById("matchSport");

    if (!batchSelect) return;

    batchSelect.innerHTML = '<option value="">Loading batches...</option>';

    try {
        const res = await fetch(`${API_BASE_URL}/batches`, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        if (!res.ok) throw new Error("Failed to fetch batches");

        const batches = await res.json();

        const selectedSport = sportSelect ? sportSelect.value : "";

        batchSelect.innerHTML = '<option value="">Select Batch</option>';

        const filteredBatches = selectedSport
            ? batches.filter(batch =>
                batch.sport === selectedSport ||
                batch.sportName === selectedSport ||
                (batch.sport && batch.sport.name === selectedSport)
            )
            : batches;

        if (filteredBatches.length === 0) {
            batchSelect.innerHTML =
                '<option value="">No batches available</option>';
            return;
        }

        filteredBatches.forEach(batch => {
            batchSelect.innerHTML += `
                <option value="${batch._id}">
                    ${batch.name}
                </option>
            `;
        });

    } catch (err) {
        console.error("Error loading batches:", err);
        batchSelect.innerHTML =
            '<option value="">Unable to load batches</option>';
    }
}
async function handleCreateMatch() {
    const feedbackEl = document.getElementById("matchModalFeedback");

    const opponent = document.getElementById("matchOpponent").value.trim();
    const format = document.getElementById("matchFormat").value;
    const sport = document.getElementById("matchSport").value;
    const batch = document.getElementById("matchBatch").value;
    const matchDate = document.getElementById("matchDate").value;
    const startTime = document.getElementById("matchStartTime").value;
    const endTime = document.getElementById("matchEndTime").value;
    const location = document.getElementById("matchLocation").value.trim();
    const squadSize = document.getElementById("matchSquadSize").value;

    feedbackEl.textContent = "";

    if (!opponent) {
        feedbackEl.textContent = "Please enter the opponent.";
        return;
    }

    if (!sport) {
        feedbackEl.textContent = "Please select a sport.";
        return;
    }

    if (!batch) {
        feedbackEl.textContent = "Please select a batch.";
        return;
    }

    if (!format) {
        feedbackEl.textContent = "Please select a format.";
        return;
    }

    if (!matchDate) {
        feedbackEl.textContent = "Please select the match date.";
        return;
    }

    if (!startTime) {
        feedbackEl.textContent = "Please select the start time.";
        return;
    }

    if (!endTime) {
        feedbackEl.textContent = "Please select the end time.";
        return;
    }

    try {

        console.log("Sending Match Data:", {
            opponent,
            format,
            sport,
            batch,
            matchDate,
            startTime,
            endTime,
            location,
            squadSize
        });

        const res = await fetch(`${API_BASE_URL}/matches`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                opponent,
                format,
                sport,
                batch,
                matchDate,
                startTime,
                endTime,
                location,
                squadSize
            })
        });

        const data = await res.json();

        console.log("Response Status:", res.status);
        console.log("Response Data:", data);

        if (!res.ok) {
            feedbackEl.textContent =
                data.message || "Unable to create match.";
            return;
        }

        feedbackEl.textContent = "";

        closeMatchModal();
        renderDashboard();

    } catch (err) {
        console.error("Error creating match:", err);
        feedbackEl.textContent =
            "Unable to create match. Please try again.";
    }
}
// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const user = getStoredUser();
    if (!user || !getToken()) { redirectToLogin(); return; }

    setDashboardHeader();
    renderDashboard();
    loadAttendanceSummary();
    loadWorkloadAlerts();
    renderInviteSection();

    // Button handlers
    document.getElementById('viewSquadBtn')?.addEventListener('click', () => {
        window.location.href = 'batches.html';
    });
   document.getElementById('enterMatchModeBtn')?.addEventListener('click', async () => {
    const overlay = document.getElementById('matchModalOverlay');

    if (overlay) {
        overlay.style.display = 'flex';
    }

    await loadMatchBatches();
});
    document.getElementById('matchModalCloseBtn')?.addEventListener('click', closeMatchModal);
    document.getElementById('matchModalCancelBtn')?.addEventListener('click', closeMatchModal);
    document.getElementById('matchCreateBtn')?.addEventListener('click', handleCreateMatch);
    document.getElementById('inviteCreateBtn')?.addEventListener('click', handleInviteCreate);
    document.getElementById('copyInviteLinkBtn')?.addEventListener('click', copyInviteLink);
    document.getElementById("matchSport").addEventListener("change", loadMatchBatches);

    // Athlete-only extras
    if (user.role === 'athlete') {
        const topRow = document.getElementById('athleteTopRow');
        if (topRow) topRow.style.display = 'grid';

        const content = getSportContent();
        renderAthleteProfile(user);
        renderAthletePerfStats();
        renderMotivationQuote();
        updateLoginStreak(user);
        renderAthleteTodos(content);
    }
});