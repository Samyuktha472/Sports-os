const API_BASE_URL = `${window.location.origin}/api`;

if (typeof getToken !== 'function') {
    window.getToken = function() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token || localStorage.getItem('token');
    };
}

const token = getToken();
let currentBatchId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadTodaySession();

    document.getElementById("saveSessionBtn")
        ?.addEventListener("click", saveSession);
});

async function loadTodaySession() {
    try {
        const res = await fetch(`${API_BASE_URL}/timetable`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) return;

        const slots = await res.json();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = days[new Date().getDay()];
        const slot = slots.find(s => s.dayOfWeek === today);

        if (slot) {
            currentBatchId = slot.batch?._id;
            if (document.getElementById("activityName")) document.getElementById("activityName").value = slot.activityType || "";
            if (document.getElementById("batch")) document.getElementById("batch").value = slot.batch?.name || "";
            if (document.getElementById("coach")) document.getElementById("coach").value = slot.coach?.name || "";
            if (document.getElementById("startTime")) document.getElementById("startTime").value = slot.startTime || "";
            if (document.getElementById("endTime")) document.getElementById("endTime").value = slot.endTime || "";
            if (document.getElementById("sessionLocation")) document.getElementById("sessionLocation").value = slot.location || "";
            if (document.getElementById("matchDate")) document.getElementById("matchDate").value = new Date().toISOString().split('T')[0];

            document.getElementById("sessionSubtitle").textContent = `${slot.batch?.name || 'Academy'} • ${slot.startTime}`;
        } else {
            document.getElementById("sessionTitle").textContent = "No session scheduled today";
            document.getElementById("sessionSubtitle").textContent = "Manual session entry";
            if (document.getElementById("matchDate")) document.getElementById("matchDate").value = new Date().toISOString().split('T')[0];
        }
    } catch (err) {
        console.error("Error loading today's session:", err);
    }
}

async function saveSession() {
    const user = JSON.parse(localStorage.getItem('user'));
    const sport = user?.sport || 'cricket';

    const title = document.getElementById("activityName").value.trim();
    const batchName = document.getElementById("batch").value.trim();
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const date = document.getElementById("matchDate").value;
    const venue = document.getElementById("sessionLocation").value.trim();
    const notes = document.getElementById("coachNotes").value.trim();

    if (!title) {
        alert("Please enter an activity name.");
        return;
    }

    if (!currentBatchId) {
        alert("No batch selected. Please ensure you are logged into a session.");
        return;
    }

    const body = {
        opponent: batchName || "Academy Session",
        format: title,
        sport: sport,
        batch: currentBatchId,
        matchDate: date,
        startTime: startTime,
        endTime: endTime,
        location: venue,
        notes: notes
    };

    try {
        const res = await fetch(`${API_BASE_URL}/matches`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("Session Saved Successfully!");
            localStorage.setItem("dashboardUpdated", "true");
            window.location.href = "dashboard.html";
        } else {
            const data = await res.json();
            alert("Unable to save session: " + (data.message || "Server error"));
        }
    } catch (err) {
        console.error("Error saving session:", err);
        alert("Failed to save session. Check your connection.");
    }
}
