const API_BASE_URL = `${window.location.origin}/api`;

function getUser() {
    try { return JSON.parse(localStorage.getItem('user')) || null; }
    catch { return null; }
}

function getToken() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
}

function getSport() {
    const user = getUser();
    return user?.sport || 'cricket';
}

function redirectToLogin() { window.location.href = 'login.html'; }

// ── Sport-based facility config ───────────────────────────────────────────────
const SPORT_FACILITIES = {
    cricket: [
        {
            name: 'Net 1 (Pace)', key: 'pace-1',
            slots: [
                { time: '08:00', name: 'Open', badge: 'free', label: 'FREE' },
                { time: '09:30', name: 'Open', badge: 'free', label: 'FREE' },
                { time: '11:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['PACE', 'FREE'],
        },
        {
            name: 'Net 2 (Spin)', key: 'spin-2',
            slots: [
                { time: '08:00', name: 'Open', badge: 'free', label: 'FREE' },
                { time: '09:30', name: 'Open', badge: 'free', label: 'FREE' },
                { time: '11:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['SPIN', 'FREE'],
        },
        {
            name: 'Center Wicket', key: 'center-3',
            slots: [
                { time: '08:00', name: 'U-16 Sim', badge: 'match', label: 'MATCH' },
                { time: '10:00', name: 'U-19 Sim', badge: 'match', label: 'MATCH' },
                { time: '12:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['MATCH', 'FREE'],
        },
    ],
    tennis: [
        {
            name: 'Court 1 (Singles)', key: 'court-1',
            slots: [
                { time: '07:00', name: 'Serve Practice', badge: 'pace', label: 'SERVE' },
                { time: '09:00', name: 'Baseline Rally', badge: 'match', label: 'RALLY' },
                { time: '11:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['SERVE', 'RALLY', 'FREE'],
        },
        {
            name: 'Court 2 (Doubles)', key: 'court-2',
            slots: [
                { time: '08:00', name: 'Net Play Drills', badge: 'spin', label: 'NET' },
                { time: '10:00', name: 'Match Simulation', badge: 'match', label: 'MATCH' },
                { time: '12:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['NET', 'MATCH', 'FREE'],
        },
        {
            name: 'Practice Wall', key: 'wall-3',
            slots: [
                { time: '07:00', name: 'Footwork Drills', badge: 'fitness', label: 'FITNESS' },
                { time: '09:00', name: 'Return Practice', badge: 'batting', label: 'RETURN' },
                { time: '11:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['FITNESS', 'RETURN', 'FREE'],
        },
    ],
    kabaddi: [
        {
            name: 'Main Mat (Raid)', key: 'mat-1',
            slots: [
                { time: '07:00', name: 'Raid Drills', badge: 'pace', label: 'RAID' },
                { time: '09:00', name: 'Do-or-Die Practice', badge: 'match', label: 'DOD' },
                { time: '11:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['RAID', 'DOD', 'FREE'],
        },
        {
            name: 'Side Mat (Tackle)', key: 'mat-2',
            slots: [
                { time: '08:00', name: 'Tackle Practice', badge: 'spin', label: 'TACKLE' },
                { time: '10:00', name: 'Defense Formation', badge: 'match', label: 'DEFENSE' },
                { time: '12:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['TACKLE', 'DEFENSE', 'FREE'],
        },
        {
            name: 'Fitness Zone', key: 'fitness-3',
            slots: [
                { time: '06:00', name: 'Strength Training', badge: 'fitness', label: 'FITNESS' },
                { time: '08:00', name: 'Agility Drills', badge: 'batting', label: 'AGILITY' },
                { time: '10:00', name: 'Open', badge: 'free', label: 'FREE' },
            ],
            options: ['FITNESS', 'AGILITY', 'FREE'],
        },
    ],
};

function renderFacilities() {

    const facilities = customFacilities;
    const grid = document.getElementById("facilityGrid");

    if (!grid) return;

    if (facilities.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                No facilities available.
                Please add a facility.
            </div>`;
        return;
    }

    grid.innerHTML = facilities.map(facility => `

        <div class="facility-card">

            <div class="facility-card-inner">

                <div class="facility-header">

                    <div class="facility-info">

                        <h3>${facility.name}</h3>

                        <p class="facility-type">
                            🏟 ${facility.type || "General"}
                        </p>

                        <p class="facility-location">
                            📍 ${facility.location || "Not Specified"}
                        </p>

                    </div>


                    <button
                        class="delete-facility-btn"
                        data-name="${facility.name}">
                        🗑
                    </button>

                </div>


                <div class="slots-container">

                ${(facility.slots || []).map((slot, index) => `

                    <div class="slot-row">

                        <span class="slot-time">
                            ${slot.time}
                        </span>

                        <span class="slot-name">
                            ${slot.name}
                        </span>

                        <span class="slot-badge ${slot.badge}">
                            ${slot.label}
                        </span>


                        <button
                            class="delete-slot-btn"
                            data-facility="${facility.name}"
                            data-index="${index}">
                            🗑
                        </button>

                    </div>

                `).join("")}

                </div>


                <button 
                    class="add-slot-btn"
                    data-net="${facility.key}">
                    + Add Slot
                </button>


                <form 
                    class="slot-form"
                    data-net-form="${facility.key}"
                    style="display:none;">


                    <div class="slot-form-row">

                        <input
                            type="time"
                            class="slot-input"
                            required>


                        <input
                            type="text"
                            class="slot-input"
                            placeholder="Name"
                            required>


                        <select class="slot-select">

                            <option>FREE</option>
                            <option>MATCH</option>
                            <option>TRAINING</option>

                        </select>


                    </div>


                    <button
                        type="button"
                        class="btn-primary slot-submit">
                        Save Slot
                    </button>


                </form>


            </div>

        </div>


    `).join("");


    setupSlotForms();
    setupDeleteButtons();
    setupDeleteFacilityButtons();
}

const resourcesState = { equipment: [] };
const customFacilities = JSON.parse(localStorage.getItem("facilities")) || [];

function openResourceForm() { document.getElementById('resourceForm').style.display = 'block'; }
function closeResourceForm() {
    document.getElementById('resourceForm').style.display = 'none';
    document.getElementById('resourceFormSubmit').reset();
}

async function createResource(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) { redirectToLogin(); return; }

    const name = document.getElementById('resourceName').value;
    const type = document.getElementById('resourceType').value;
    const description = document.getElementById('resourceDescription').value;
    const url = document.getElementById('resourceURL').value;
    const quantity = Number(document.getElementById('resourceQuantity').value || 0);

    try {
        const response = await fetch(`${API_BASE_URL}/resources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                name,
                type: "equipment",
                description,
                url,
                quantity,
                equipmentName: name,
                resourceType: "Equipment",
                sport: getSport(),
                available: quantity,
                inUse: 0,
                category: type,
            })
        });
        if (!response.ok) throw new Error('Failed to create resource');
        closeResourceForm();
        fetchResources();
    } catch (error) {
        console.error('Error creating resource:', error);
        alert('Unable to add resource. Please try again.');
    }
}

function buildEquipmentCard(item) {

    const statusClass =
        item.status === "LOW"
            ? "low"
            : item.status === "OUT"
                ? "out"
                : "in-stock";

    return `
    <div class="equipment-card" data-equipment-id="${item._id}">

        <div class="equipment-top">

            <div>
                <h3>🏏 ${item.name}</h3>
                <p class="equipment-category">
                    ${item.category || "General Equipment"}
                </p>
            </div>

            <button
                class="delete-equipment-btn"
                data-id="${item._id}">
                🗑
            </button>

        </div>

        <span class="equipment-status ${statusClass}">
            ${item.status}
        </span>

        <p class="equipment-condition">
            Condition:
            <strong>${item.condition}</strong>
        </p>

        <div class="qty-control">

            <button
                class="qty-btn decrement"
                data-id="${item._id}">
                −
            </button>

            <span
                class="qty-value"
                id="qty-${item._id}">
                ${item.quantity}
            </span>

            <button
                class="qty-btn increment"
                data-id="${item._id}">
                +
            </button>

        </div>

    </div>
    `;
}

function renderEquipment() {
    const equipmentGrid = document.getElementById('equipmentGrid');
    if (!resourcesState.equipment.length) {
        equipmentGrid.innerHTML = `
    <p class="empty-message">
        No equipment resources have been added yet.
    </p>
`;
        return;
    }
    equipmentGrid.innerHTML = resourcesState.equipment.map(buildEquipmentCard).join('');


    document.querySelectorAll('.qty-btn.increment').forEach(button => {
        button.addEventListener('click', async () => {
            const id = button.dataset.id;
            const item = resourcesState.equipment.find(e => e._id === id);
            if (!item) return;
            item.quantity = (item.quantity || 0) + 1;

            document.getElementById(`qty-${id}`).textContent = item.quantity;

            await patchResource(id, {
                quantity: item.quantity,
            });
        });
    });
    document.querySelectorAll(".delete-equipment-btn").forEach(btn => {

        btn.addEventListener("click", () => {

            const id = btn.dataset.id;

            deleteEquipment(id);

        });

    });
    document.querySelectorAll(".qty-btn.decrement").forEach(button => {
        button.addEventListener("click", async () => {
            const id = button.dataset.id;
            const item = resourcesState.equipment.find(e => e._id === id);

            if (!item) return;

            item.quantity = Math.max(0, (item.quantity || 0) - 1);

            document.getElementById(`qty-${id}`).textContent = item.quantity;

            await patchResource(id, {
                quantity: item.quantity
            });
        });
    });

}
function setupSlotForms() {

    document.querySelectorAll(".add-slot-btn").forEach(button => {
        button.addEventListener("click", () => {

            const net = button.dataset.net;
            const form = document.querySelector(
                `.slot-form[data-net-form="${net}"]`
            );

            if (!form) return;

            form.style.display =
                form.style.display === "none" ? "block" : "none";
        });
    });

    document.querySelectorAll(".slot-submit").forEach(button => {
        button.addEventListener("click", event => {

            const form = event.target.closest(".slot-form");

            const timeInput = form.querySelector('.slot-input[type="time"]');
            const nameInput = form.querySelector('.slot-input[type="text"]');
            const select = form.querySelector(".slot-select");

            if (!timeInput.value || !nameInput.value) return;

            const parentCard = form.closest(".facility-card-inner");
            const facilityName = parentCard.querySelector("h3").textContent;

            const facility = customFacilities.find(
                f => f.name === facilityName
            );

            if (!facility) return;

            facility.slots.push({
                time: timeInput.value,
                name: nameInput.value,
                badge: select.value.toLowerCase(),
                label: select.value
            });

            localStorage.setItem(
                "facilities",
                JSON.stringify(customFacilities)
            );

            renderFacilities();
        });
    });

}
function setupDeleteButtons() {

    document.querySelectorAll(".delete-slot-btn").forEach(button => {

        button.addEventListener("click", () => {

            const facilityName = button.dataset.facility;
            const index = Number(button.dataset.index);

            const facility = customFacilities.find(
                f => f.name === facilityName
            );

            if (!facility) return;

            facility.slots.splice(index, 1);

            localStorage.setItem(
                "facilities",
                JSON.stringify(customFacilities)
            );

            renderFacilities();

        });

    });

}

function setupDeleteFacilityButtons() {

    document.querySelectorAll(".delete-facility-btn").forEach(button => {

        button.addEventListener("click", () => {

            if (!confirm("Delete this facility?")) return;

            const facilityName = button.dataset.name;

            const index = customFacilities.findIndex(
                f => f.name === facilityName
            );

            if (index === -1) return;

            customFacilities.splice(index, 1);

            localStorage.setItem(
                "facilities",
                JSON.stringify(customFacilities)
            );

            renderFacilities();

        });

    });

}

async function fetchResources() {
    const token = getToken();
    if (!token) { redirectToLogin(); return; }

    try {
        const equipRes = await fetch(
            `${API_BASE_URL}/resources?type=equipment&sport=${getSport()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const equipData = await equipRes.json();
        if (!equipRes.ok) throw new Error('Unable to load equipment data');
        resourcesState.equipment = equipData;
        console.log(resourcesState.equipment);
        renderEquipment();
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('equipmentGrid').innerHTML = '<div class="empty-state">Unable to load equipment resources.</div>';
    }
}

async function patchResource(id, update) {
    const token = getToken();
    if (!token) { redirectToLogin(); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(update),
        });
        if (!response.ok) throw new Error('Failed to update resource');
        const updatedResource = await response.json();
        if (updatedResource.resourceType === "Equipment") {
            const index = resourcesState.equipment.findIndex(
                e => e._id === updatedResource._id
            );

            if (index !== -1) {
                resourcesState.equipment[index] = updatedResource;
                renderEquipment();
            }
        }
    } catch (error) {
        console.error('Error updating resource:', error);
    }
}

function saveFacility() {

    const name = document.getElementById("facilityName").value.trim();
    const type = document.getElementById("facilityType").value;
    const location = document.getElementById("facilityLocation").value.trim();

    if (!name) {
        alert("Please enter a facility name");
        return;
    }

    customFacilities.push({

        name,
        type,
        location,

        key: name.toLowerCase().replace(/\s+/g, "-"),

        slots: [],

        options: ["FREE"]

    });

    // Clear form
    document.getElementById("facilityName").value = "";
    document.getElementById("facilityType").value = "";
    document.getElementById("facilityLocation").value = "";

    // Hide form
    document.getElementById("facilityForm").style.display = "none";

    // Refresh cards
    renderFacilities();

}
// New function starts here
async function saveEquipment() {
    console.log("saveEquipment called");
    const token = getToken();
    if (!token) {
        redirectToLogin();
        return;
    }

    const name = document.getElementById("equipmentName").value.trim();
    const condition = document.getElementById("equipmentCondition").value;
    const quantity = Number(document.getElementById("equipmentQty").value);
    const category = document.getElementById("equipmentCategory").value;
    let status;

    if (quantity === 0) {
        status = "OUT";
    } else if (quantity <= 10) {
        status = "LOW";
    } else {
        status = "IN STOCK";
    }
    if (!name || quantity < 0) {
        alert("Please fill all fields.");
        return;
    }

    try {

        const response = await fetch(`${API_BASE_URL}/resources`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                type: "equipment",
                category,
                quantity,
                condition,
                status
            })
        });

        if (!response.ok) {
            throw new Error("Failed to save equipment");
        }

        document.getElementById("equipmentForm").style.display = "none";

        document.getElementById("equipmentName").value = "";
        document.getElementById("equipmentQty").value = "";

        fetchResources();

    } catch (err) {
        console.error(err);
        alert("Unable to save equipment.");
    }
}

function getTodayHeader() {
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    return `${weekday} · ${day} ${month}`;
}

document.addEventListener('DOMContentLoaded', () => {

    const token = getToken();
    if (!token) {
        redirectToLogin();
        return;
    }

    document.getElementById('pageDate').textContent = getTodayHeader();

    // Old Resource Form (keep only if you still use it)
    document.getElementById('addResourceBtn')?.addEventListener('click', openResourceForm);
    document.getElementById('cancelResourceBtn')?.addEventListener('click', closeResourceForm);
    document.getElementById('resourceFormSubmit')?.addEventListener('submit', createResource);

    // ---------- Facility ----------

    const facilityForm = document.getElementById("facilityForm");

    document.getElementById("addFacilityBtn")?.addEventListener("click", () => {
        facilityForm.style.display =
            facilityForm.style.display === "block" ? "none" : "block";
    });

    document.getElementById("cancelFacility")?.addEventListener("click", () => {
        facilityForm.style.display = "none";

        document.getElementById("facilityName").value = "";
        document.getElementById("facilityType").value = "";
        document.getElementById("facilityLocation").value = "";
    });

    document.getElementById("saveFacility")?.addEventListener("click", saveFacility);

    // ---------- Equipment ----------

    const equipmentForm = document.getElementById("equipmentForm");

    document.getElementById("addEquipmentBtn")?.addEventListener("click", () => {
        equipmentForm.style.display =
            equipmentForm.style.display === "block" ? "none" : "block";
    });

    document.getElementById("cancelEquipment")?.addEventListener("click", () => {
        equipmentForm.style.display = "none";

        document.getElementById("equipmentName").value = "";
        document.getElementById("equipmentCategory").value = "";
        document.getElementById("equipmentCondition").value = "Excellent";
        document.getElementById("equipmentQty").value = "";
    });

    document.getElementById("saveEquipment")?.addEventListener("click", saveEquipment);

    renderFacilities();
    fetchResources();

});
async function deleteEquipment(id) {

    const token = getToken();

    if (!confirm("Delete this equipment?")) return;

    try {

        const response = await fetch(`${API_BASE_URL}/resources/${id}`, {

            method: "DELETE",

            headers: {
                Authorization: `Bearer ${token}`
            }

        });

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        fetchResources();

    } catch (err) {

        console.error(err);

        alert("Unable to delete equipment.");

    }

}