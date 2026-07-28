const NTF_API_BASE_URL = window.API_BASE_URL || `${window.location.origin}/api`;

function ntf_getToken() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
}

function ntf_timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

async function ntf_fetchUnreadCount() {
    try {
        const res = await fetch(`${NTF_API_BASE_URL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${ntf_getToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;
        if (data.count > 0) {
            badge.textContent = data.count > 9 ? '9+' : data.count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error('Error fetching unread count:', err);
    }
}

async function ntf_loadList() {
    const listEl = document.getElementById('notificationList');
    if (!listEl) return;

    try {
        const res = await fetch(`${NTF_API_BASE_URL}/notifications`, {
            headers: { Authorization: `Bearer ${ntf_getToken()}` },
        });
        if (!res.ok) throw new Error('Failed to load notifications');
        const notifications = await res.json();

        if (!notifications.length) {
            listEl.innerHTML = '<p style="color:#6B7280;font-size:13px;padding:16px;text-align:center;">No notifications yet.</p>';
            return;
        }

        listEl.innerHTML = notifications.map(n => {
            const actionsHtml = !n.isRead ? `
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button class="ntf-approve-btn" data-id="${n._id}" data-type="${n.type}" data-ref="${n.referenceId}" data-from="${n.fromUserId?._id || n.fromUserId}"
                        style="flex:1;background:#16A34A;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;">Approve</button>
                    <button class="ntf-reject-btn" data-id="${n._id}" data-type="${n.type}" data-ref="${n.referenceId}" data-from="${n.fromUserId?._id || n.fromUserId}"
                        style="flex:1;background:#F3F4F6;color:#374151;border:none;border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;">Reject</button>
                </div>` : '<p style="font-size:11px;color:#16A34A;margin-top:6px;">Resolved</p>';

            return `
                <div class="ntf-item" style="padding:10px 12px;border-bottom:1px solid #F5F5F5;${n.isRead ? 'opacity:0.6;' : ''}">
                    <p style="font-size:13px;margin:0;color:#111827;">${n.message}</p>
                    <p style="font-size:11px;color:#9CA3AF;margin:4px 0 0;">${ntf_timeAgo(n.createdAt)}</p>
                    ${actionsHtml}
                </div>`;
        }).join('');

        listEl.querySelectorAll('.ntf-approve-btn').forEach(btn => {
            btn.addEventListener('click', () => ntf_resolve(btn, 'approve'));
        });
        listEl.querySelectorAll('.ntf-reject-btn').forEach(btn => {
            btn.addEventListener('click', () => ntf_resolve(btn, 'reject'));
        });
    } catch (err) {
        console.error('Error loading notifications:', err);
        listEl.innerHTML = '<p style="color:#DC2626;font-size:13px;padding:16px;text-align:center;">Unable to load notifications.</p>';
    }
}

async function ntf_resolve(btn, action) {
    const { type, ref, from } = btn.dataset;
    const token = ntf_getToken();
    btn.disabled = true;
    btn.textContent = '...';

    try {
        let url;
        if (type === 'coach_join_request') {
            url = `${NTF_API_BASE_URL}/batches/${ref}/coach-requests/${from}/${action}`;
        } else if (type === 'batch_change_request') {
            url = `${NTF_API_BASE_URL}/batch-change-requests/${ref}/${action}`;
        } else {
            return;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.message || 'Action failed');
            btn.disabled = false;
            btn.textContent = action === 'approve' ? 'Approve' : 'Reject';
            return;
        }

        await ntf_loadList();
        await ntf_fetchUnreadCount();
    } catch (err) {
        console.error(`Error on ${action}:`, err);
        alert('Network error, please try again.');
        btn.disabled = false;
        btn.textContent = action === 'approve' ? 'Approve' : 'Reject';
    }
}

async function ntf_markAllRead() {
    try {
        await fetch(`${NTF_API_BASE_URL}/notifications/mark-all-read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${ntf_getToken()}` },
        });
        await ntf_loadList();
        await ntf_fetchUnreadCount();
    } catch (err) {
        console.error('Error marking all as read:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const bellBtn = document.getElementById('notificationBellBtn');
    const dropdown = document.getElementById('notificationDropdown');
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (!bellBtn || !dropdown) return;

    // Move dropdown to <body> so sidebar's CSS transform doesn't break its fixed positioning
    document.body.appendChild(dropdown);

    ntf_fetchUnreadCount();
    setInterval(ntf_fetchUnreadCount, 60000);

    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        if (!isOpen) {
            const rect = bellBtn.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + 8}px`;
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.display = 'block';
            ntf_loadList();
        } else {
            dropdown.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== bellBtn) {
            dropdown.style.display = 'none';
        }
    });

    markAllBtn?.addEventListener('click', ntf_markAllRead);
});