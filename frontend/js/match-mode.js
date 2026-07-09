const API_BASE_URL = `${window.location.origin}/api`;

function getToken() {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.token || localStorage.getItem("token");
}

const token = getToken();

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
            // Fill inputs with timetable data
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
    // Collect data using correct field names for the Match model
    const body = {
        title: document.getElementById("activityName").value,
        opponent: document.getElementById("batch").value, // Using batch as opponent/team name
        date: document.getElementById("matchDate").value,
        time: `${document.getElementById("startTime").value} - ${document.getElementById("endTime").value}`,
        venue: document.getElementById("sessionLocation").value,
        notes: document.getElementById("coachNotes").value
    };

    if (!body.title) {
        alert("Please enter an activity name.");
        return;
    }

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
