const API_BASE_URL = `${window.location.origin}/api`;

function getToken() {
    try {
        const data = JSON.parse(localStorage.getItem('user'));
        return data?.token || localStorage.getItem('token');
    } catch (e) { return localStorage.getItem('token'); }
}

function getStoredUser() {
    try {
        const data = JSON.parse(localStorage.getItem('user'));
        return data?.user || data || null;
    } catch (e) { return null; }
}

function redirectToLogin() { window.location.href = 'login.html'; }

const INVITE_PERMISSIONS = {
    owner: ['head_coach', 'coach', 'athlete'],
    head_coach: ['coach', 'athlete'],
    coach: ['athlete'],
};

const inviteEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const inviteMobileRegex = /^[0-9]{10}$/;

function renderInviteSection() {
    const user = getStoredUser();
    const inviteCard = document.getElementById('inviteCard');
    if (!inviteCard || !user || user.role === 'athlete') {
        if (inviteCard) inviteCard.style.display = 'none';
        return;
    }

    const allowedRoles = INVITE_PERMISSIONS[user.role] || [];
    const roleSelect = document.getElementById('inviteRole');
    if (roleSelect) {
        const labels = { owner: 'Owner', head_coach: 'Head Coach', coach: 'Coach', athlete: 'Athlete' };
        roleSelect.innerHTML = allowedRoles.map(role => `<option value="${role}">${labels[role] || role}</option>`).join('');
    }

    const sportSelect = document.getElementById('inviteSport');
    if (sportSelect) {
        const academySports = (Array.isArray(user.sports) && user.sports.length > 0) ? user.sports : [user.sport || 'cricket'];
        const sportLabels = { cricket: '🏏 Cricket', tennis: '🎾 Tennis', kabaddi: '🤾 Kabaddi' };
        sportSelect.innerHTML = academySports.map(s => `<option value="${s}">${sportLabels[s] || s}</option>`).join('');
    }
    inviteCard.style.display = 'block';
}

async function handleInviteCreate() {
    const feedbackEl = document.getElementById('inviteFeedback');
    const linkEl = document.getElementById('inviteLink');
    const copyBtn = document.getElementById('copyInviteLinkBtn');
    if (!feedbackEl) return;

    feedbackEl.textContent = 'Generating link...';
    feedbackEl.style.color = '#6B7280';
    if (linkEl) linkEl.style.display = 'none';
    if (copyBtn) copyBtn.style.display = 'none';

    const email = document.getElementById('inviteEmail')?.value.trim();
    const phone = document.getElementById('inviteMobile')?.value.trim();
    const role = document.getElementById('inviteRole')?.value;
    const sport = document.getElementById('inviteSport')?.value;

    if (!email && !phone) {
        feedbackEl.textContent = 'Enter an email address or a mobile number.';
        feedbackEl.style.color = '#EF4444';
        return;
    }

    if (email && !inviteEmailRegex.test(email)) {
        feedbackEl.textContent = 'Enter a valid email address.';
        feedbackEl.style.color = '#EF4444';
        return;
    }

    if (phone && !inviteMobileRegex.test(phone)) {
        feedbackEl.textContent = 'Enter a valid 10-digit mobile number.';
        feedbackEl.style.color = '#EF4444';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/invites/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ email, phone, role, sport }),
        });

        const data = await res.json();
        if (!res.ok) {
            feedbackEl.textContent = data.message || 'Unable to create invite link.';
            feedbackEl.style.color = '#EF4444';
            return;
        }

        if (linkEl) {
            linkEl.value = data.link;
            linkEl.style.display = 'block';
        }
        if (copyBtn) copyBtn.style.display = 'inline-flex';
        feedbackEl.textContent = 'Link created! Copy and share it.';
        feedbackEl.style.color = '#10B981';
    } catch (err) {
        console.error('Invite error:', err);
        feedbackEl.textContent = 'Connection error.';
        feedbackEl.style.color = '#EF4444';
    }
}

function copyInviteLink() {
    const linkEl = document.getElementById('inviteLink');
    if (!linkEl) return;
    linkEl.select();
    document.execCommand('copy');
    const feedback = document.getElementById('inviteFeedback');
    if (feedback) feedback.textContent = 'Copied to clipboard!';
}

function setDashboardHeader() {
    const user = getStoredUser();
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

    const dateEl = document.getElementById('pageDate');
    if (dateEl) dateEl.textContent = `${weekday} · ${day} ${month}`;

    const greetingNameEl = document.getElementById('greetingName');
    if (greetingNameEl && user?.name) {
        greetingNameEl.textContent = user.name.split(' ')[0];
    }

    const academyNameEl = document.getElementById('academyName');
    if (academyNameEl && user?.academyName) {
        academyNameEl.innerText = user.academyName;
    }
}

async function renderDashboard() {
    const user = getStoredUser();
    if (user?.role === 'athlete') {
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        const topRow = document.getElementById('athleteTopRow');
        if (topRow) topRow.style.display = 'grid';
        renderAthleteProfile(user);
        return;
    }

    // Load data sequence
    loadUpcomingMatch();
    loadDashboardCards();
    loadAttendanceSummary();
    loadPracticeList();
    loadEquipmentSnapshot();
    loadAnnouncements();
}

async function loadUpcomingMatch() {
    const token = getToken();
    const matchTitleEl = document.getElementById("nextMatchTitle");
    const matchTimeEl = document.getElementById("nextMatchTime");
    const matchLocEl = document.getElementById("nextMatchLocation");
    const matchTagsEl = document.getElementById("nextMatchTags");
    if (!matchTitleEl) return;

    try {
        const matchRes = await fetch(`${API_BASE_URL}/matches`, { headers: { Authorization: `Bearer ${token}` } });
        const matches = matchRes.ok ? await matchRes.json() : [];

        if (Array.isArray(matches) && matches.length > 0) {
            const latest = matches[matches.length - 1];
            matchTitleEl.textContent = latest.opponent ? `${latest.opponent} Match` : (latest.title || "Planned Session");
            if (matchTimeEl) matchTimeEl.textContent = `${latest.matchDate ? new Date(latest.matchDate).toLocaleDateString() : ''} · ${latest.startTime || ''}`;
            if (matchLocEl) matchLocEl.textContent = latest.location || latest.venue || "TBD";
            if (matchTagsEl) matchTagsEl.innerHTML = '<span class="pill green-pill">Planned Session</span>';
            return;
        }

        const ttRes = await fetch(`${API_BASE_URL}/timetable`, { headers: { Authorization: `Bearer ${token}` } });
        const sessions = ttRes.ok ? await ttRes.json() : [];

        if (Array.isArray(sessions) && sessions.length > 0) {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todaySlot = sessions.find(s => s.dayOfWeek === today) || sessions[0];
            matchTitleEl.textContent = todaySlot.activityType;
            if (matchTimeEl) matchTimeEl.textContent = `${todaySlot.startTime} - ${todaySlot.endTime}`;
            if (matchLocEl) matchLocEl.textContent = todaySlot.location;
            if (matchTagsEl) matchTagsEl.innerHTML = '<span class="pill">Scheduled Session</span>';
        } else {
            matchTitleEl.textContent = 'No Upcoming Match';
            if (matchTimeEl) matchTimeEl.textContent = '';
            if (matchLocEl) matchLocEl.textContent = '';
            if (matchTagsEl) matchTagsEl.innerHTML = '';
        }
    } catch (err) { console.error('Error loading upcoming match:', err); }
}

async function loadDashboardCards() {
    const token = getToken();
    try {
        const athleteRes = await fetch(`${API_BASE_URL}/roster/athletes`, { headers: { Authorization: `Bearer ${token}` } });
        const athletes = athleteRes.ok ? await athleteRes.json() : [];
        if (document.getElementById("totalAthletes")) document.getElementById("totalAthletes").textContent = Array.isArray(athletes) ? athletes.length : 0;

        const resourceRes = await fetch(`${API_BASE_URL}/resources`, { headers: { Authorization: `Bearer ${token}` } });
        const resources = resourceRes.ok ? await resourceRes.json() : [];
        if (document.getElementById("equipmentCount")) document.getElementById("equipmentCount").textContent = Array.isArray(resources) ? resources.length : 0;

        const matchRes = await fetch(`${API_BASE_URL}/matches`, { headers: { Authorization: `Bearer ${token}` } });
        const matches = matchRes.ok ? await matchRes.json() : [];
        if (document.getElementById("matchCount")) document.getElementById("matchCount").textContent = Array.isArray(matches) ? matches.length : 0;
    } catch (err) { console.error('Error loading KPI cards:', err); }
}

async function loadAttendanceSummary() {
    const user = getStoredUser();
    if (!user || user.role === 'athlete') return;

    const statsEl = document.getElementById('attendanceSummaryStats');
    const presentTodayEl = document.getElementById('presentToday');
    const presentTodaySubEl = document.getElementById('presentTodaySub');
    if (!statsEl && !presentTodayEl) return;

    const token = getToken();
    const today = new Date().toISOString().slice(0, 10);

    try {
        const athletesRes = await fetch(`${API_BASE_URL}/roster/athletes`, { headers: { Authorization: `Bearer ${token}` } });
        const athletes = athletesRes.ok ? await athletesRes.json() : [];
        const totalAthletes = Array.isArray(athletes) ? athletes.length : 0;

        const batchesRes = await fetch(`${API_BASE_URL}/batches`, { headers: { Authorization: `Bearer ${token}` } });
        const batches = batchesRes.ok ? await batchesRes.json() : [];

        let present = 0;
        let coachPresent = 0;
        let coachTotal = 0;
        let markedCount = 0;

        if (Array.isArray(batches) && batches.length > 0) {
            const attendanceResults = await Promise.all(
                batches.map(b => fetch(`${API_BASE_URL}/attendance?batchId=${b._id}&date=${today}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).catch(() => null))
            );
            const presentAthletes = new Set();
            attendanceResults.forEach(doc => {
                if (doc && Array.isArray(doc.records)) {
                    markedCount += doc.records.length;
                    doc.records.forEach(r => { if (r.status === 'present' && r.athlete) presentAthletes.add(r.athlete.toString()); });
                }
            });
            present = presentAthletes.size;
        }

        try {
            const coachRes = await fetch(`${API_BASE_URL}/coach-attendance?date=${today}`, { headers: { Authorization: `Bearer ${token}` } });
            const coachData = coachRes.ok ? await coachRes.json() : null;
            if (coachData && Array.isArray(coachData.records)) {
                coachTotal = coachData.records.length;
                coachPresent = coachData.records.filter(r => r.status === 'present').length;
            }
        } catch (err) { console.error(err); }

        const pct = totalAthletes > 0 ? Math.round((present / totalAthletes) * 100) : 0;
        if (presentTodayEl) presentTodayEl.textContent = present + coachPresent;
        if (presentTodaySubEl) presentTodaySubEl.textContent = markedCount > 0 ? `${pct}% Athlete Rate` : 'No attendance marked today';

        if (statsEl) {
            statsEl.innerHTML = `
                <div class="stat-box"><p class="stat-label">ATHLETES PRESENT</p><p class="stat-value">${present}/${totalAthletes}</p></div>
                <div class="stat-box"><p class="stat-label">COACHES PRESENT</p><p class="stat-value">${coachPresent}/${coachTotal || '—'}</p></div>
                <div class="stat-box" style="grid-column: span 2;"><p class="stat-label">DAILY ATTENDANCE RATE</p><p class="stat-value">${pct}%</p></div>`;
        }
    } catch (err) { console.error('Error loading attendance summary:', err); }
}

async function loadPracticeList() {
    const el = document.getElementById('practiceList');
    if (!el) return;
    try {
        const res = await fetch(`${API_BASE_URL}/timetable`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const slots = res.ok ? await res.json() : [];
        if (!Array.isArray(slots) || !slots.length) {
            el.innerHTML = '<p class="card-subtext">No sessions logged yet.</p>';
            return;
        }
        el.innerHTML = slots.slice(0, 3).map(slot => `
            <div class="practice-row">
                <span class="status-dot dark"></span>
                <div class="practice-info"><p class="practice-title">${slot.activityType}</p><p class="practice-meta">${slot.dayOfWeek}</p></div>
                <span class="practice-time">${slot.startTime} - ${slot.endTime}</span>
            </div>`).join('');
    } catch (err) { console.error('Error loading practice list:', err); }
}

async function loadEquipmentSnapshot() {
    const el = document.getElementById('equipmentStats');
    if (!el) return;
    try {
        const res = await fetch(`${API_BASE_URL}/resources`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const resources = res.ok ? await res.json() : [];
        if (!Array.isArray(resources) || !resources.length) {
            el.innerHTML = '<p class="card-subtext">No equipment added yet.</p>';
            return;
        }
        el.innerHTML = resources.slice(0, 4).map(r => `
            <div class="stat-box"><p class="stat-label">${(r.name || '').toUpperCase()}</p><p class="stat-value">${r.quantity ?? '—'}</p><p class="stat-note">${r.condition || r.status || ''}</p></div>`).join('');
    } catch (err) { console.error('Error loading equipment snapshot:', err); }
}

async function loadAnnouncements() {
    const listEl = document.getElementById('announcementList');
    if (!listEl) return;
    try {
        const res = await fetch(`${API_BASE_URL}/announcements`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const announcements = res.ok ? await res.json() : [];
        if (!Array.isArray(announcements) || !announcements.length) {
            listEl.innerHTML = '<p class="card-subtext">No announcements yet.</p>';
            return;
        }
        listEl.innerHTML = announcements.map(a => `
            <div style="padding:12px; border-bottom:1px solid #F0F0F0; background:#F9FAFB; border-radius:8px; margin-bottom:8px;">
                <p style="font-weight:700;margin:0;color:var(--color-dark);">${a.title}</p>
                <p style="font-size:13px;margin:6px 0 0;color:#4B5563;">${a.message}</p>
            </div>`).join('');
    } catch (err) { console.error('Error loading announcements:', err); }
}

async function handleCreateAnnouncement() {
    const feedbackEl = document.getElementById('announcementModalFeedback');
    const titleEl = document.getElementById('announcementTitle');
    const messageEl = document.getElementById('announcementMessage');
    const sportEl = document.getElementById('announcementSport');
    const postBtn = document.getElementById('announcementCreateBtn');

    if (!feedbackEl || !titleEl || !messageEl || !sportEl || !postBtn) return;

    const title = titleEl.value.trim();
    const message = messageEl.value.trim();
    const sport = sportEl.value;

    if (!title || !message) {
        feedbackEl.textContent = 'Title and Message are required.';
        feedbackEl.style.color = '#EF4444';
        return;
    }

    const originalText = postBtn.textContent;
    postBtn.textContent = 'Saving...';
    postBtn.disabled = true;
    feedbackEl.textContent = '';

    try {
        const res = await fetch(`${API_BASE_URL}/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ title, message, sport })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            document.getElementById('announcementModalOverlay').style.display = 'none';
            await loadAnnouncements();
            titleEl.value = '';
            messageEl.value = '';
        } else {
            feedbackEl.textContent = data.message || 'Error saving announcement.';
            feedbackEl.style.color = '#EF4444';
        }
    } catch (err) {
        console.error('Error creating announcement:', err);
        feedbackEl.textContent = 'Connection error.';
        feedbackEl.style.color = '#EF4444';
    } finally {
        postBtn.textContent = originalText;
        postBtn.disabled = false;
    }
}

function renderAthleteProfile(user) {
    const avatarEl = document.getElementById('athleteAvatar');
    const nameEl = document.getElementById('athleteProfileName');
    const metaEl = document.getElementById('athleteProfileMeta');
    if (avatarEl) avatarEl.textContent = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
    if (nameEl) nameEl.textContent = user?.name || 'Athlete';
    if (metaEl) {
        const sport = (user?.sport || '').charAt(0).toUpperCase() + (user?.sport || '').slice(1);
        metaEl.textContent = `${sport} · ${user?.batchAssigned || 'No batch assigned'}`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = getStoredUser();
    if (!user || !getToken()) { redirectToLogin(); return; }

    setDashboardHeader();
    await renderDashboard();
    renderInviteSection();

    window.addEventListener("focus", () => {
        renderDashboard();
    });

    document.getElementById('addAnnouncementBtn')?.addEventListener('click', () => {
        document.getElementById('announcementModalOverlay').style.display = 'flex';
        const feedback = document.getElementById('announcementModalFeedback');
        if (feedback) feedback.textContent = '';
    });
    document.getElementById('announcementModalCloseBtn')?.addEventListener('click', () => document.getElementById('announcementModalOverlay').style.display = 'none');
    document.getElementById('announcementModalCancelBtn')?.addEventListener('click', () => document.getElementById('announcementModalOverlay').style.display = 'none');
    document.getElementById('announcementCreateBtn')?.addEventListener('click', handleCreateAnnouncement);

    document.getElementById('viewSquadBtn')?.addEventListener('click', () => window.location.href = 'batches.html');
    document.getElementById('enterMatchModeBtn')?.addEventListener('click', () => window.location.href = 'match-mode.html');

    document.getElementById('inviteCreateBtn')?.addEventListener('click', handleInviteCreate);
    document.getElementById('copyInviteLinkBtn')?.addEventListener('click', copyInviteLink);
});