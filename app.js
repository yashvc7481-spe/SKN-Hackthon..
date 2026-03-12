const API_BASE_URL = 'http://localhost:5000/api';

// Page Management
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`${pageName}-page`);
  if (page) {
    page.classList.add('active');
    if (pageName === 'tracking') setTimeout(() => initMap(), 100);
    else if (pageName === 'hospitals') loadHospitals();
    else if (pageName === 'admin') loadDashboard();
  }
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('navMenu').classList.remove('active');
}

// Mobile Menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
if (hamburger) hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));

// Socket.IO
let socket = io(API_BASE_URL, { reconnection: true, reconnectionDelay: 1000 });

socket.on('connect', () => {
  console.log('✅ Connected');
  displayAlert('Connected to system', 'success');
});

socket.on('ambulance_location', (data) => updateAmbulanceOnMap(data));
socket.on('signal_changed', (data) => updateSignalStatus(data));

// Alert System
function displayAlert(message, type = 'info') {
  const alertsList = document.getElementById('alertsList');
  if (!alertsList) return;
  const alertItem = document.createElement('div');
  alertItem.className = `alert-item ${type}`;
  alertItem.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${message}<br><small>${new Date().toLocaleTimeString()}</small>`;
  alertsList.insertBefore(alertItem, alertsList.firstChild);
  while (alertsList.children.length > 10) alertsList.removeChild(alertsList.lastChild);
}

// Map & Tracking
let map, ambulanceMarker, signalMarkers = {};

function initMap() {
  if (map) return;
  map = L.map('map').setView([28.6139, 77.2090], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);
  loadAmbulances();
  loadTrafficSignals();
}

async function loadAmbulances() {
  try {
    const response = await fetch(`${API_BASE_URL}/ambulance`);
    const ambulances = await response.json();
    ambulances.forEach(a => {
      if (a.status === 'en_route' && a.location) updateAmbulanceOnMap(a);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

function updateAmbulanceOnMap(ambulance) {
  if (!map) return;
  if (ambulanceMarker) map.removeLayer(ambulanceMarker);
  
  const { latitude, longitude } = ambulance.location;
  const icon = L.divIcon({
    html: `<div style="font-size: 2rem;">🚑</div>`,
    iconSize: [40, 40]
  });
  
  ambulanceMarker = L.marker([latitude, longitude], { icon })
    .addTo(map)
    .bindPopup(`<strong>Ambulance ${ambulance.ambulanceId}</strong><br>Status: ${ambulance.status}`);
  
  map.setView([latitude, longitude], 14);
  updateAmbulanceInfo(ambulance);
  checkTrafficSignalsProximity(ambulance);
}

function updateAmbulanceInfo(ambulance) {
  const infoDiv = document.getElementById('ambulanceInfo');
  if (!infoDiv) return;
  infoDiv.innerHTML = `
    <div style="line-height: 1.8;">
      <div><strong>ID:</strong> ${ambulance.ambulanceId}</div>
      <div><strong>Status:</strong> <span class="badge badge-${ambulance.status === 'en_route' ? 'info' : 'success'}">${ambulance.status}</span></div>
      <div><strong>Driver:</strong> ${ambulance.driverName || 'N/A'}</div>
      <div><strong>Patient:</strong> ${ambulance.patientInfo?.name || 'N/A'}</div>
      <div><strong>Distance:</strong> ${ambulance.currentRoute?.distance?.toFixed(2) || '0'} km</div>
    </div>
  `;
}

async function loadTrafficSignals() {
  try {
    const response = await fetch(`${API_BASE_URL}/traffic`);
    const signals = await response.json();
    signals.forEach(s => addSignalToMap(s));
  } catch (error) {
    console.error('Error:', error);
  }
}

function addSignalToMap(signal) {
  if (!map) return;
  const { latitude, longitude, status } = signal;
  const color = status === 'green' ? '#27ae60' : status === 'yellow' ? '#f39c12' : '#e74c3c';
  
  const icon = L.divIcon({
    html: `<div style="font-size: 1.5rem; color: ${color}; background: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">🚦</div>`,
    iconSize: [35, 35]
  });
  
  L.marker([latitude, longitude], { icon }).addTo(map).bindPopup(`<strong>Signal</strong><br>Status: ${status}`);
}

async function checkTrafficSignalsProximity(ambulance) {
  if (!ambulance.location) return;
  try {
    const { latitude, longitude } = ambulance.location;
    const response = await fetch(`${API_BASE_URL}/traffic/nearby?latitude=${latitude}&longitude=${longitude}&radius=1`);
    const signals = await response.json();
    updateSignalsInfo(signals);
  } catch (error) {
    console.error('Error:', error);
  }
}

function updateSignalStatus(signal) {
  if (!map) return;
  addSignalToMap(signal);
}

function updateSignalsInfo(signals) {
  const signalsDiv = document.getElementById('signalsInfo');
  if (!signalsDiv) return;
  if (signals.length === 0) {
    signalsDiv.innerHTML = '<p>No nearby signals</p>';
    return;
  }
  signalsDiv.innerHTML = signals.map(s => {
    const statusColor = s.status === 'green' ? 'success' : s.status === 'yellow' ? 'warning' : 'danger';
    return `<div class="signal-status"><span>Signal ${s.signalId}</span><span class="signal-indicator ${s.status}"></span><span class="badge badge-${statusColor}">${s.status}</span></div>`;
  }).join('');
}

// Hospitals
let hospitalsList = [];

async function loadHospitals() {
  try {
    const response = await fetch(`${API_BASE_URL}/hospital`);
    hospitalsList = await response.json();
    displayHospitals(hospitalsList);
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayHospitals(hospitals) {
  const container = document.getElementById('hospitalsList');
  if (!hospitals || hospitals.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:2rem;">No hospitals found</p>';
    return;
  }
  container.innerHTML = hospitals.map(h => `
    <div class="hospital-card">
      <div class="hospital-header"><h2>${h.name}</h2></div>
      <div class="hospital-body">
        <div class="hospital-info-row"><span class="hospital-info-label">City</span><span>${h.location?.city || 'N/A'}</span></div>
        <div class="hospital-info-row"><span class="hospital-info-label">Available Beds</span><span>${h.availability?.availableBeds || 0}/${h.availability?.totalBeds || 0}</span></div>
        <div class="hospital-info-row"><span class="hospital-info-label">ICU Beds</span><span>${h.availability?.availableICUBeds || 0}/${h.availability?.icuBeds || 0}</span></div>
        <div class="hospital-info-row"><span class="hospital-info-label">Contact</span><span>${h.contactNumber || 'N/A'}</span></div>
      </div>
    </div>
  `).join('');
}

document.getElementById('searchInput')?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = hospitalsList.filter(h => (h.name || '').toLowerCase().includes(term) || (h.location?.city || '').toLowerCase().includes(term));
  displayHospitals(filtered);
});

document.getElementById('filterSelect')?.addEventListener('change', (e) => {
  const type = e.target.value;
  let filtered = hospitalsList;
  if (type === 'available') filtered = hospitalsList.filter(h => (h.availability?.availableBeds || 0) > 0);
  else if (type === 'icu') filtered = hospitalsList.filter(h => (h.availability?.availableICUBeds || 0) > 0);
  displayHospitals(filtered);
});

// Admin Dashboard
async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`);
    const data = await response.json();
    document.getElementById('ambulanceCount').textContent = data.stats.ambulances;
    document.getElementById('activeCount').textContent = data.stats.activeAmbulances;
    document.getElementById('hospitalCount').textContent = data.stats.hospitals;
    document.getElementById('signalCount').textContent = data.stats.signals;
    displayRecentAlerts(data.recentAlerts);
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayRecentAlerts(alerts) {
  const container = document.getElementById('recentAlerts');
  if (!alerts || alerts.length === 0) {
    container.innerHTML = '<p>No recent alerts</p>';
    return;
  }
  container.innerHTML = alerts.map(a => `
    <div class="log-item">
      <div class="log-time">${new Date(a.createdAt).toLocaleTimeString()}</div>
      <div class="log-message">${a.message}</div>
    </div>
  `).join('');
}

async function loadAmbulancesList() {
  try {
    const response = await fetch(`${API_BASE_URL}/ambulance`);
    const ambulances = await response.json();
    const container = document.getElementById('ambulancesList');
    container.innerHTML = `
      <table>
        <thead><tr><th>ID</th><th>Driver</th><th>Status</th><th>Patient</th></tr></thead>
        <tbody>${ambulances.map(a => `<tr><td>${a.ambulanceId}</td><td>${a.driverName || 'N/A'}</td><td><span class="badge badge-${a.status === 'en_route' ? 'info' : 'success'}">${a.status}</span></td><td>${a.patientInfo?.name || 'N/A'}</td></tr>`).join('')}</tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadHospitalsList() {
  try {
    const response = await fetch(`${API_BASE_URL}/hospital`);
    const hospitals = await response.json();
    const container = document.getElementById('hospitalsList');
    container.innerHTML = `
      <table>
        <thead><tr><th>Name</th><th>City</th><th>Available Beds</th><th>Contact</th></tr></thead>
        <tbody>${hospitals.map(h => `<tr><td>${h.name}</td><td>${h.location?.city || 'N/A'}</td><td>${h.availability?.availableBeds || 0}/${h.availability?.totalBeds || 0}</td><td>${h.contactNumber || 'N/A'}</td></tr>`).join('')}</tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadSignalsList() {
  try {
    const response = await fetch(`${API_BASE_URL}/traffic`);
    const signals = await response.json();
    const container = document.getElementById('signalsList');
    container.innerHTML = `
      <table>
        <thead><tr><th>Signal ID</th><th>Status</th><th>Ambulance Mode</th></tr></thead>
        <tbody>${signals.map(s => `<tr><td>${s.signalId}</td><td><span class="badge badge-${s.status === 'green' ? 'success' : 'danger'}">${s.status}</span></td><td><span class="badge ${s.ambulanceMode ? 'badge-info' : 'badge-danger'}">${s.ambulanceMode ? 'ON' : 'OFF'}</span></td></tr>`).join('')}</tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    if (tabName === 'ambulances') loadAmbulancesList();
    else if (tabName === 'hospitals') loadHospitalsList();
    else if (tabName === 'signals') loadSignalsList();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized');
});