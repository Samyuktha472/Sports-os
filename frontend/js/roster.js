const API_BASE_URL = `${window.location.origin}/api`;

function getToken() {
    try {
        const u = JSON.parse(localStorage.getItem('user'));
        return u?.token || localStorage.getItem('token');
    } catch { return null; }
}

function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

function initials(name) {
    if (!name) return '??';
    const p = name.trim().split(/\s+/);
    return p.length >= 2
        ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
        : p[0][0].toUpperCase();
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Field validation (phone / password) ──────────────────────────────────────
const phoneRegex = /^[0-9]{10}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=])[A-Za-z\d!@#$%^&*(),.?":{}|<>_\-+=]{6,}$/;

function validatePhoneField(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (!input || !errorEl) return true;

    const val = input.value.trim();
    if (!val) { // optional field, empty is fine
        input.classList.remove('invalid');
        errorEl.classList.remove('show');
        return true;
    }
    if (!phoneRegex.test(val)) {
        input.classList.add('invalid');
        errorEl.textContent = 'Phone number must be exactly 10 digits';
        errorEl.classList.add('show');
        return false;
    }
    input.classList.remove('invalid');
    errorEl.classList.remove('show');
    return true;
}

function validatePasswordField(inputId, errorId, required) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (!input || !errorEl) return true;

    const val = input.value;
    if (!val) {
        input.classList.remove('invalid');
        errorEl.classList.remove('show');
        return !required; // if required and empty, invalid; else valid
    }
    if (!passwordRegex.test(val)) {
        input.classList.add('invalid');
        errorEl.textContent = 'Min 6 chars with uppercase, lowercase & special character';
        errorEl.classList.add('show');
        return false;
    }
    input.classList.remove('invalid');
    errorEl.classList.remove('show');
    return true;
}

// Athlete fields — validate live
document.getElementById('a_phone')?.addEventListener('input', () => validatePhoneField('a_phone', 'a_phone_error'));
document.getElementById('a_phone')?.addEventListener('blur', () => validatePhoneField('a_phone', 'a_phone_error'));
document.getElementById('a_password')?.addEventListener('input', () => validatePasswordField('a_password', 'a_password_error', false));
document.getElementById('a_password')?.addEventListener('blur', () => validatePasswordField('a_password', 'a_password_error', false));

// Coach fields — validate live
document.getElementById('c_phone')?.addEventListener('input', () => validatePhoneField('c_phone', 'c_phone_error'));
document.getElementById('c_phone')?.addEventListener('blur', () => validatePhoneField('c_phone', 'c_phone_error'));
document.getElementById('c_password')?.addEventListener('input', () => validatePasswordField('c_password', 'c_password_error', false));
document.getElementById('c_password')?.addEventListener('blur', () => validatePasswordField('c_password', 'c_password_error', false));

// ── Tabs ──────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// ── Search filter ─────────────────────────────────────────────────────────────
document.getElementById('athleteSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#athleteTableBody tr[data-id]').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});
document.getElementById('coachSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#coachTableBody tr[data-id]').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});

// ── Athletes ──────────────────────────────────────────────────────────────────
let athletes = [];

async function loadAthletes() {
    try {
        const res = await fetch(`${API_BASE_URL}/roster/athletes`, { headers: authHeaders() });
        athletes = await res.json();
        renderAthletes();
    } catch {
        document.getElementById('athleteTableBody').innerHTML =
            '<tr><td colspan="6" class="empty-state">Failed to load athletes.</td></tr>';
    }
}

function renderAthletes() {
    const tbody = document.getElementById('athleteTableBody');
    if (!athletes.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No athletes yet. Click + Add Athlete to get started.</td></tr>';
        return;
    }
    tbody.innerHTML = athletes.map(a => `
        <tr data-id="${a._id}">
            <td>
                <div class="avatar-cell">
                    <div class="avatar-sm">${initials(a.name)}</div>
                    <span>${a.name}</span>
                </div>
            </td>
            <td>${a.email}</td>
            <td>${a.specialization || '—'}</td>
            <td>${a.phone || '—'}</td>
            <td>${a.batchAssigned || '—'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="openEditAthlete('${a._id}')">✏️ Edit</button>
                    <button class="btn-icon danger" onclick="deleteAthlete('${a._id}', '${a.name}')">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Athlete modal state
let editAthleteId = null;

function openAddAthlete() {
    editAthleteId = null;
    document.getElementById('athleteModalTitle').textContent = 'Add Athlete';
    ['a_name', 'a_email', 'a_password', 'a_phone', 'a_specialization', 'a_dob', 'a_batch']
        .forEach(id => document.getElementById(id).value = '');
    document.getElementById('a_password').placeholder = 'Min 6 characters';
    ['a_phone_error', 'a_password_error'].forEach(id => document.getElementById(id)?.classList.remove('show'));
    ['a_phone', 'a_password'].forEach(id => document.getElementById(id)?.classList.remove('invalid'));
    document.getElementById('athleteModal').classList.add('open');
}

function openEditAthlete(id) {
    const a = athletes.find(x => x._id === id);
    if (!a) return;
    editAthleteId = id;
    document.getElementById('athleteModalTitle').textContent = 'Edit Athlete';
    document.getElementById('a_name').value = a.name || '';
    document.getElementById('a_email').value = a.email || '';
    document.getElementById('a_password').value = '';
    document.getElementById('a_password').placeholder = 'Leave blank to keep current';
    document.getElementById('a_phone').value = a.phone || '';
    document.getElementById('a_specialization').value = a.specialization || '';
    document.getElementById('a_dob').value = a.dob || '';
    document.getElementById('a_batch').value = a.batchAssigned || '';
    ['a_phone_error', 'a_password_error'].forEach(id => document.getElementById(id)?.classList.remove('show'));
    ['a_phone', 'a_password'].forEach(id => document.getElementById(id)?.classList.remove('invalid'));
    document.getElementById('athleteModal').classList.add('open');
}

function closeAthleteModal() {
    document.getElementById('athleteModal').classList.remove('open');
}

async function saveAthlete() {
    const btn = document.getElementById('athleteModalSave');
    const body = {
        name: document.getElementById('a_name').value.trim(),
        email: document.getElementById('a_email').value.trim(),
        phone: document.getElementById('a_phone').value.trim(),
        specialization: document.getElementById('a_specialization').value.trim(),
        dob: document.getElementById('a_dob').value,
        batchAssigned: document.getElementById('a_batch').value.trim(),
    };
    const pw = document.getElementById('a_password').value;
    if (pw) body.password = pw;

    if (!body.name || !body.email) { showToast('Name and email are required', 'error'); return; }
    if (!editAthleteId && !pw) { showToast('Password is required for new athletes', 'error'); return; }

    // Phone validation
    if (!validatePhoneField('a_phone', 'a_phone_error')) { return; }

    // Password validation
    if (!validatePasswordField('a_password', 'a_password_error', false)) { return; }

    btn.disabled = true;
    try {
        const url = editAthleteId
            ? `${API_BASE_URL}/roster/athletes/${editAthleteId}`
            : `${API_BASE_URL}/roster/athletes`;
        const method = editAthleteId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) { showToast(data.message || 'Error saving athlete', 'error'); return; }
        showToast(editAthleteId ? 'Athlete updated' : 'Athlete added');
        closeAthleteModal();
        loadAthletes();
        loadBatchFormData();
    } catch { showToast('Network error', 'error'); }
    finally { btn.disabled = false; }
}

async function deleteAthlete(id, name) {
    if (!confirm(`Delete athlete "${name}"? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/roster/athletes/${id}`,
            { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) { showToast('Failed to delete', 'error'); return; }
        showToast('Athlete deleted');
        loadAthletes();
    } catch { showToast('Network error', 'error'); }
}

document.getElementById('addAthleteBtn').addEventListener('click', openAddAthlete);
document.getElementById('athleteModalCancel').addEventListener('click', closeAthleteModal);
document.getElementById('athleteModalSave').addEventListener('click', saveAthlete);
document.getElementById('athleteModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAthleteModal();
});

// ── Coaches ───────────────────────────────────────────────────────────────────
let coaches = [];

async function loadCoaches() {
    try {
        const res = await fetch(`${API_BASE_URL}/roster/coaches`, { headers: authHeaders() });
        coaches = await res.json();
        renderCoaches();
    } catch {
        document.getElementById('coachTableBody').innerHTML =
            '<tr><td colspan="6" class="empty-state">Failed to load coaches.</td></tr>';
    }
}

function renderCoaches() {
    const tbody = document.getElementById('coachTableBody');
    const role = getStoredUser()?.role;
    const canManageCoaches = role === 'owner' || role === 'head_coach';

    if (!coaches.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No coaches yet. Click + Add Coach to get started.</td></tr>';
        return;
    }
    tbody.innerHTML = coaches.map(c => `
        <tr data-id="${c._id}">
            <td>
                <div class="avatar-cell">
                    <div class="avatar-sm">${initials(c.name)}</div>
                    <span>${c.name}</span>
                </div>
            </td>
            <td>${c.email}</td>
            <td><span class="role-pill ${c.role}">${c.role === 'head_coach' ? 'Head Coach' : 'Coach'}</span></td>
            <td>${c.specialization || '—'}</td>
            <td>${c.phone || '—'}</td>
            <td>
                ${canManageCoaches ? `
                <div class="action-btns">
                    <button class="btn-icon" onclick="openEditCoach('${c._id}')">✏️ Edit</button>
                    <button class="btn-icon danger" onclick="deleteCoach('${c._id}', '${c.name}')">🗑️</button>
                </div>` : ''}
            </td>
        </tr>
    `).join('');
}

let editCoachId = null;

function openAddCoach() {
    editCoachId = null;
    document.getElementById('coachModalTitle').textContent = 'Add Coach';
    ['c_name', 'c_email', 'c_password', 'c_specialization', 'c_phone']
        .forEach(id => document.getElementById(id).value = '');
    document.getElementById('c_role').value = 'coach';
    document.getElementById('c_password').placeholder = 'Min 6 characters';
    ['c_phone_error', 'c_password_error'].forEach(id => document.getElementById(id)?.classList.remove('show'));
    ['c_phone', 'c_password'].forEach(id => document.getElementById(id)?.classList.remove('invalid'));
    document.getElementById('coachModal').classList.add('open');
}

function openEditCoach(id) {
    const c = coaches.find(x => x._id === id);
    if (!c) return;
    editCoachId = id;
    document.getElementById('coachModalTitle').textContent = 'Edit Coach';
    document.getElementById('c_name').value = c.name || '';
    document.getElementById('c_email').value = c.email || '';
    document.getElementById('c_password').value = '';
    document.getElementById('c_password').placeholder = 'Leave blank to keep current';
    document.getElementById('c_role').value = c.role || 'coach';
    document.getElementById('c_specialization').value = c.specialization || '';
    document.getElementById('c_phone').value = c.phone || '';
    ['c_phone_error', 'c_password_error'].forEach(id => document.getElementById(id)?.classList.remove('show'));
    ['c_phone', 'c_password'].forEach(id => document.getElementById(id)?.classList.remove('invalid'));
    document.getElementById('coachModal').classList.add('open');
}

function closeCoachModal() {
    document.getElementById('coachModal').classList.remove('open');
}

async function saveCoach() {
    const btn = document.getElementById('coachModalSave');
    const body = {
        name: document.getElementById('c_name').value.trim(),
        email: document.getElementById('c_email').value.trim(),
        role: document.getElementById('c_role').value,
        specialization: document.getElementById('c_specialization').value.trim(),
        phone: document.getElementById('c_phone').value.trim(),
    };
    const pw = document.getElementById('c_password').value;
    if (pw) body.password = pw;

    if (!body.name || !body.email) { showToast('Name and email are required', 'error'); return; }
    if (!editCoachId && !pw) { showToast('Password is required for new coaches', 'error'); return; }

    // Phone validation
    if (!validatePhoneField('c_phone', 'c_phone_error')) { return; }

    // Password validation
    if (!validatePasswordField('c_password', 'c_password_error', false)) { return; }

    btn.disabled = true;
    try {
        const url = editCoachId
            ? `${API_BASE_URL}/roster/coaches/${editCoachId}`
            : `${API_BASE_URL}/roster/coaches`;
        const method = editCoachId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) { showToast(data.message || 'Error saving coach', 'error'); return; }
        showToast(editCoachId ? 'Coach updated' : 'Coach added');
        closeCoachModal();
        loadCoaches();
        loadBatchFormData();
    } catch { showToast('Network error', 'error'); }
    finally { btn.disabled = false; }
}

async function deleteCoach(id, name) {
    if (!confirm(`Delete coach "${name}"? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/roster/coaches/${id}`,
            { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) { showToast('Failed to delete', 'error'); return; }
        showToast('Coach deleted');
        loadCoaches();
    } catch { showToast('Network error', 'error'); }
}

document.getElementById('addCoachBtn').addEventListener('click', openAddCoach);
document.getElementById('coachModalCancel').addEventListener('click', closeCoachModal);
document.getElementById('coachModalSave').addEventListener('click', saveCoach);
document.getElementById('coachModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCoachModal();
});

// ── Batches ───────────────────────────────────────────────────────────────────
let allCoachesForBatch = [];
let allAthletesForBatch = [];
let existingBatches = [];
let editBatchId = null;

async function loadBatchFormData() {
    try {
        const [coachRes, athleteRes, batchRes] = await Promise.all([
            fetch(`${API_BASE_URL}/roster/coaches`, { headers: authHeaders() }),
            fetch(`${API_BASE_URL}/roster/athletes`, { headers: authHeaders() }),
            fetch(`${API_BASE_URL}/batches`, { headers: authHeaders() }),
        ]);
        allCoachesForBatch = await coachRes.json();
        allAthletesForBatch = await athleteRes.json();
        existingBatches = await batchRes.json();
    } catch (err) {
        console.error('Error loading batch form data:', err);
        allCoachesForBatch = [];
        allAthletesForBatch = [];
        existingBatches = [];
    }
    renderBatchForm();
    renderExistingBatches();
}

function renderBatchForm() {
    const role = getStoredUser()?.role;

    const headCoachWrap = document.getElementById('headCoachFieldWrap');
    if (headCoachWrap) {
        headCoachWrap.style.display = role === 'owner' ? 'block' : 'none';
        if (role === 'owner') {
            const headCoaches = allCoachesForBatch.filter(c => c.role === 'head_coach');
            document.getElementById('b_headCoach').innerHTML =
                '<option value="">Select head coach</option>' +
                headCoaches.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        }
    }

    const coachesWrap = document.getElementById('coachesFieldWrap');
    if (coachesWrap) {
        const canPickCoaches = role === 'owner' || role === 'head_coach';
        coachesWrap.style.display = canPickCoaches ? 'block' : 'none';
        if (canPickCoaches) {
            const coachOnly = allCoachesForBatch.filter(c => c.role === 'coach');
            document.getElementById('b_coachesList').innerHTML = coachOnly.length
                ? coachOnly.map(c => `
                    <label class="checkbox-row">
                        <input type="checkbox" value="${c._id}" class="b-coach-checkbox">
                        <span>${c.name}</span>
                    </label>`).join('')
                : '<p class="empty-hint">No coaches available yet.</p>';
        }
    }

    document.getElementById('b_athletesList').innerHTML = allAthletesForBatch.length
        ? allAthletesForBatch.map(a => `
            <label class="checkbox-row">
                <input type="checkbox" value="${a._id}" class="b-athlete-checkbox">
                <span>${a.name}</span>
            </label>`).join('')
        : '<p class="empty-hint">No athletes available yet.</p>';
}

function getCoachJoinRequestHtml(b) {
    const user = getStoredUser();
    if (!user || user.role !== 'coach') return '';

    const headCoachId = b.coachId?._id || b.coachId;
    if (String(headCoachId) !== String(user.id || user._id)) return '';

    const alreadyCoach = (b.coaches || []).some(c => String(c._id || c) === String(user.id || user._id));
    if (alreadyCoach) return '';

    const pending = (b.pendingCoachRequests || []).some(
        r => String(r.coachId?._id || r.coachId) === String(user.id || user._id) && r.status === 'pending'
    );
    if (pending) {
        return '<span class="badge" style="background:#FEF3C7;color:#92400E;">Request pending</span>';
    }

    return `<button class="btn-icon" onclick="requestCoachJoin('${b._id}')">🙋 Request to join as Coach</button>`;
}

async function requestCoachJoin(batchId) {
    try {
        const res = await fetch(`${API_BASE_URL}/batches/${batchId}/request-coach`, {
            method: 'POST',
            headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) {
            showToast(data.message || 'Failed to send request', 'error');
            return;
        }
        showToast('Request sent to owner/head coach');
        loadBatchFormData();
    } catch (err) {
        console.error('Error requesting coach join:', err);
        showToast('Network error', 'error');
    }
}

function renderExistingBatches() {
    const tbody = document.getElementById('batchTableBody');
    if (!tbody) return;
    if (!existingBatches.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No batches created yet.</td></tr>';
        return;
    }
    tbody.innerHTML = existingBatches.map(b => `
        <tr>
            <td>${b.name}</td>
            <td>${b.coachId?.name || '—'}</td>
            <td>${(b.coaches || []).length}</td>
            <td>${(b.athletes || []).length}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="openEditBatch('${b._id}')">✏️ Edit</button>
                    <button class="btn-icon danger" onclick="deleteBatch('${b._id}', '${b.name}')">🗑️</button>
                    ${getCoachJoinRequestHtml(b)}
                </div>
            </td>
        </tr>
    `).join('');
}
function openEditBatch(id) {
    const b = existingBatches.find(x => x._id === id);
    if (!b) return;
    editBatchId = id;

    document.getElementById('batchFormTitle').textContent = `Edit Batch: ${b.name}`;
    document.getElementById('b_name').value = b.name || '';

    const role = getStoredUser()?.role;

    if (role === 'owner' && document.getElementById('b_headCoach')) {
        document.getElementById('b_headCoach').value = b.coachId?._id || b.coachId || '';
    }

    // Check the coaches that are already in this batch
    document.querySelectorAll('.b-coach-checkbox').forEach(cb => {
        const batchCoachIds = (b.coaches || []).map(c => c._id || c);
        cb.checked = batchCoachIds.includes(cb.value);
    });

    // Check the athletes that are already in this batch
    document.querySelectorAll('.b-athlete-checkbox').forEach(cb => {
        const batchAthleteIds = (b.athletes || []).map(a => a._id || a);
        cb.checked = batchAthleteIds.includes(cb.value);
    });

    document.getElementById('batchSaveBtn').textContent = 'Update Batch';
    document.getElementById('batchCancelEditBtn').style.display = 'inline-block';

    // Scroll up to the form so the user sees it
    document.querySelector('.batch-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEditBatch() {
    editBatchId = null;
    document.getElementById('batchFormTitle').textContent = 'Create New Batch';
    document.getElementById('b_name').value = '';
    if (document.getElementById('b_headCoach')) document.getElementById('b_headCoach').value = '';
    document.querySelectorAll('.b-coach-checkbox, .b-athlete-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('batchSaveBtn').textContent = 'Create Batch';
    document.getElementById('batchCancelEditBtn').style.display = 'none';
}

async function saveBatch() {
    const role = getStoredUser()?.role;
    const btn = document.getElementById('batchSaveBtn');
    const name = document.getElementById('b_name').value.trim();

    if (!name) { showToast('Batch name is required', 'error'); return; }

    const athleteIds = Array.from(document.querySelectorAll('.b-athlete-checkbox:checked')).map(cb => cb.value);
    const body = { name, athletes: athleteIds };

    if (role === 'owner') {
        const headCoachId = document.getElementById('b_headCoach').value;
        if (!headCoachId) { showToast('Please select a head coach', 'error'); return; }
        body.coachId = headCoachId;
        body.coaches = Array.from(document.querySelectorAll('.b-coach-checkbox:checked')).map(cb => cb.value);
    } else if (role === 'head_coach') {
        body.coaches = Array.from(document.querySelectorAll('.b-coach-checkbox:checked')).map(cb => cb.value);
    }

    btn.disabled = true;
    try {
        const url = editBatchId ? `${API_BASE_URL}/batches/${editBatchId}` : `${API_BASE_URL}/batches`;
        const method = editBatchId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.message || 'Failed to save batch', 'error'); return; }

        showToast(editBatchId ? 'Batch updated successfully' : 'Batch created successfully');
        cancelEditBatch();
        loadBatchFormData();
    } catch {
        showToast('Network error', 'error');
    } finally {
        btn.disabled = false;
    }
}
async function deleteBatch(id, name) {
    if (!confirm(`Delete batch "${name}"? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/batches/${id}`,
            { method: 'DELETE', headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) { showToast(data.message || 'Failed to delete batch', 'error'); return; }
        showToast('Batch deleted');
        if (editBatchId === id) cancelEditBatch();
        loadBatchFormData();
    } catch {
        showToast('Network error', 'error');
    }
}
document.getElementById('batchSaveBtn')?.addEventListener('click', saveBatch);
document.getElementById('batchCancelEditBtn')?.addEventListener('click', cancelEditBatch);
// Hide "Add Coach" button for plain coaches (only owner/head_coach can add)
(function () {
    const role = getStoredUser()?.role;
    if (role === 'coach') {
        document.getElementById('addCoachBtn')?.style.setProperty('display', 'none');
    }
})();
// ── Init ──────────────────────────────────────────────────────────────────────
loadAthletes();
loadCoaches();
loadBatchFormData();
document.getElementById('quickAddCoachBtn')?.addEventListener('click', openAddCoach);
document.getElementById('quickAddAthleteBtn')?.addEventListener('click', openAddAthlete);