// Mock data (same as original)
const visitorData = [
  { month: "Jan", visitors: 12500, revenue: 850000 },
  { month: "Feb", visitors: 15200, revenue: 920000 },
  { month: "Mar", visitors: 18700, revenue: 1120000 },
  { month: "Apr", visitors: 22100, revenue: 1350000 },
  { month: "May", visitors: 19800, revenue: 1180000 },
  { month: "Jun", visitors: 16500, revenue: 980000 },
];

const regionData = [
  { name: "Ranchi", visitors: 25420, revenue: 1850000, growth: 12.5 },
  { name: "Deoghar", visitors: 18760, revenue: 1320000, growth: 8.3 },
  { name: "Netarhat", visitors: 12340, revenue: 890000, growth: 15.2 },
  { name: "Hazaribagh", visitors: 9870, revenue: 650000, growth: 6.7 },
  { name: "Jamshedpur", visitors: 14520, revenue: 980000, growth: 9.1 },
];

const tourismTypeData = [
  { name: "Eco Tourism", value: 35, color: "#10B981" },
  { name: "Cultural Tourism", value: 28, color: "#F59E0B" },
  { name: "Adventure Tourism", value: 20, color: "#EF4444" },
  { name: "Religious Tourism", value: 17, color: "#8B5CF6" },
];

const safetyMetrics = [
  { metric: "Verified Guides", value: 324, trend: "+12%", color: "green" },
  { metric: "Safety Incidents", value: 2, trend: "-50%", color: "red" },
  { metric: "Emergency Response Time", value: "8 min", trend: "-15%", color: "green" },
  { metric: "Tourist Complaints", value: 18, trend: "-23%", color: "green" },
];

const communityData = [
  { community: "Santhal Tribe", artisans: 45, bookings: 128, revenue: 89400 },
  { community: "Oraon Tribe", artisans: 32, bookings: 89, revenue: 67200 },
  { community: "Munda Tribe", artisans: 28, bookings: 76, revenue: 52800 },
  { community: "Ho Tribe", artisans: 21, bookings: 54, revenue: 38700 },
];

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "regions", label: "Regions" },
  { key: "safety", label: "Safety" },
  { key: "community", label: "Community" },
  { key: "sustainability", label: "Sustainability" },
];

let activeTab = "overview";
let charts = {}; // Store chart instances to prevent memory leaks

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("lastUpdated").textContent = new Date().toLocaleString();
  renderTabs();
  renderContent();
  
  // Add event listener for time selector
  document.getElementById("timeSelect").addEventListener('change', function() {
    renderContent();
  });
});

// SVG Icons with proper viewBox and paths
const Icons = {
  Users: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>`,
  DollarSign: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>`,
  Star: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>`,
  MapPin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`,
  TrendingUp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" fill="none" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  Shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>`,
};

function renderTabs() {
  const tabsContainer = document.getElementById("tabs");
  tabsContainer.innerHTML = "";
  tabs.forEach(t => {
    const btn = document.createElement("button");
    btn.textContent = t.label;
    btn.className = "nav-tab" + (activeTab === t.key ? " active" : "");
    btn.onclick = () => {
      activeTab = t.key;
      renderContent();
      renderTabs();
    };
    tabsContainer.appendChild(btn);
  });
}

function StatCard({title, value, trend, iconSVG, color = "blue"}) {
  return `<div class="stat-card stat-card-${color}">
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <div style="flex: 1;">
        <p class="stat-title">${title}</p>
        <p class="stat-value stat-value-${color}">${value}</p>
        ${trend ? `<p style="color: #059669; font-weight: 600; margin-top: 6px;">${trend}</p>` : ""}
      </div>
      <div class="stat-icon stat-icon-${color}">
        ${iconSVG}
      </div>
    </div>
  </div>`;
}

function destroyExistingCharts() {
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  charts = {};
}

function renderContent() {
  destroyExistingCharts(); // Clean up existing charts
  
  const main = document.getElementById("mainContent");
  
  if (activeTab === "overview") {
    main.innerHTML = `
      <section class="metrics-grid">
        ${StatCard({title:"Total Visitors",value:"104,660",trend:"+18.2%",iconSVG:Icons.Users,color:"blue"})}
        ${StatCard({title:"Revenue Generated",value:"₹6.3Cr",trend:"+22.5%",iconSVG:Icons.DollarSign,color:"green"})}
        ${StatCard({title:"Avg. Satisfaction",value:"4.2/5",trend:"+0.3",iconSVG:Icons.Star,color:"yellow"})}
        ${StatCard({title:"Active Destinations",value:"47",trend:"+3 this month",iconSVG:Icons.MapPin,color:"purple"})}
      </section>
      <section class="charts-grid">
        <div class="chart-card">
          <h3 class="chart-title">
            ${Icons.TrendingUp} Visitor Trends & Revenue
          </h3>
          <div style="position: relative; width: 100%; height: 300px;">
            <canvas id="areaChart1"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">
            ${Icons.MapPin} Tourism Distribution
          </h3>
          <div style="position: relative; width: 100%; height: 300px;">
            <canvas id="pieChart1"></canvas>
          </div>
        </div>
      </section>
      <section class="chart-card" style="margin-top:16px;">
        <h3 class="chart-title">Regional Performance</h3>
        <div style="position: relative; width: 100%; height: 320px;">
          <canvas id="barChart1"></canvas>
        </div>
      </section>
    `;
    setTimeout(renderOverviewCharts, 50);
    
  } else if (activeTab === "regions") {
    main.innerHTML = `
      <section class="section-card">
        <h3>Regional Performance Analytics</h3>
        <div style="width:100%; height:300px; margin-bottom: 20px;">
          <canvas id="barChartRegion"></canvas>
        </div>
        <div class="regions-list">
          ${regionData.map((region, i) => `
            <div class="region-card">
              <div class="region-row">
                <h4 style="margin:0">${region.name}</h4>
                <div class="region-growth ${
                  region.growth > 10 ? "high" : region.growth > 5 ? "medium" : "low"
                }">${region.growth > 0 ? "+" : ""}${region.growth}%</div>
              </div>
              <p style="margin: 6px 0 0 0; color: #6b7280;">
                Visitors: ${region.visitors.toLocaleString()}
              </p>
              <p style="margin: 6px 0 0 0; color: #6b7280;">
                Revenue: ₹${region.revenue.toLocaleString()}
              </p>
            </div>
          `).join("")}
        </div>
      </section>
    `;
    setTimeout(renderRegionBarChart, 50);
    
  } else if (activeTab === "safety") {
    main.innerHTML = `
      <section class="section-card">
        <h3>Safety & Security Metrics</h3>
        <div style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-top: 12px;">
          ${safetyMetrics.map(m => `
            <div class="metric-card">
              <div class="metric-label">${m.metric}</div>
              <div class="metric-value">${m.value}</div>
              <div class="metric-trend-${m.color}">${m.trend}</div>
            </div>
          `).join("")}
        </div>
      </section>
    `;
    
  } else if (activeTab === "community") {
    main.innerHTML = `
      <section class="section-card">
        <h3>Community Impact & Empowerment</h3>
        <div class="table-container" style="margin-top: 12px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Community</th>
                <th>Active Artisans</th>
                <th>Total Bookings</th>
                <th>Revenue</th>
                <th>Growth</th>
              </tr>
            </thead>
            <tbody>
              ${communityData.map(c => `
                <tr>
                  <td>${c.community}</td>
                  <td>${c.artisans}</td>
                  <td>${c.bookings}</td>
                  <td>₹${c.revenue.toLocaleString()}</td>
                  <td><span class="growth-chip">+${Math.floor(Math.random() * 20 + 10)}%</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
    
  } else if (activeTab === "sustainability") {
    main.innerHTML = `
      <section class="section-card">
        <h3>Sustainability</h3>
        <div class="metrics-grid" style="margin-top:12px;">
          ${StatCard({title:"Carbon Footprint Reduced",value:"23.4T",trend:"-12%",iconSVG:Icons.TrendingUp,color:"green"})}
          ${StatCard({title:"Eco-Friendly Routes",value:"28",trend:"+4",iconSVG:Icons.MapPin,color:"blue"})}
          ${StatCard({title:"Waste Reduction",value:"67%",trend:"+8%",iconSVG:Icons.Shield,color:"green"})}
          ${StatCard({title:"Local Sourcing",value:"89%",trend:"+5%",iconSVG:Icons.DollarSign,color:"purple"})}
        </div>
      </section>
    `;
  }
}

function renderOverviewCharts() {
  // Area chart
  const ctxArea = document.getElementById('areaChart1');
  if (ctxArea) {
    charts.areaChart = new Chart(ctxArea, {
      type: 'line',
      data: {
        labels: visitorData.map(d => d.month),
        datasets: [
          {
            label: "Visitors",
            data: visitorData.map(d => d.visitors),
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59,130,246,0.15)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Revenue (₹)",
            data: visitorData.map(d => d.revenue),
            borderColor: "#10B981",
            backgroundColor: "rgba(16,185,129,0.05)",
            fill: true,
            tension: 0.4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { position: 'bottom' }, 
          tooltip: { enabled: true } 
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Pie chart
  const ctxPie = document.getElementById('pieChart1');
  if (ctxPie) {
    charts.pieChart = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: tourismTypeData.map(d => d.name),
        datasets: [{
          data: tourismTypeData.map(d => d.value),
          backgroundColor: tourismTypeData.map(d => d.color)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { enabled: true }
        }
      }
    });
  }

  // Bar chart
  const ctxBar = document.getElementById('barChart1');
  if (ctxBar) {
    charts.barChart = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: regionData.map(d => d.name),
        datasets: [
          {
            label: 'Visitors',
            data: regionData.map(d => d.visitors),
            backgroundColor: "#3B82F6"
          },
          {
            label: 'Revenue (₹)',
            data: regionData.map(d => d.revenue),
            backgroundColor: "#10B981"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { 
          x: { beginAtZero: true }, 
          y: { beginAtZero: true } 
        }
      }
    });
  }
}

function renderRegionBarChart() {
  const ctxBar = document.getElementById('barChartRegion');
  if (ctxBar) {
    charts.regionChart = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: regionData.map(d => d.name),
        datasets: [
          {
            label: "Visitors",
            data: regionData.map(d => d.visitors),
            backgroundColor: "#3B82F6"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
          x: { beginAtZero: true }, 
          y: { beginAtZero: true } 
        }
      }
    });
  }
}