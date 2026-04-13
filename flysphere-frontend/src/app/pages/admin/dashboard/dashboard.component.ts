import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  template: `
  <div class="dashboard-wrapper">

    <div class="dashboard-card">

      <div class="dashboard-header">
        <h2>Operations Dashboard</h2>
        <p>Live overview of airline performance</p>
      </div>

      <!-- ✅ First Row: Fleet Summary -->
      <div class="fleet-row-wrapper">

        <!-- Total Flights -->
        <div class="total-modern">
          <div>
            <div class="total-title">Total Flights</div>
            <div class="total-value">{{ total }}</div>
          </div>
          <img class="total-image"
               src="https://freepngimg.com/thumb/map/81058-blue-earth-airplane-flight-map-free-hd-image.png"
               alt="world-map">
        </div>

        <!-- Airbus -->
        <div class="fleet-modern airbus-modern">
          <div>
            <div class="fleet-title">Airbus A320</div>
            <div class="fleet-label">Economy: {{ airbusSeats.economy }}</div>
            <div class="fleet-label">Business: {{ airbusSeats.business }}</div>
            <div class="fleet-label">First: {{ airbusSeats.first }}</div>
          </div>
          <img class="fleet-plane"
               src="https://freepngimg.com/download/airplane/125940-flying-airplane-vector-hd-image-free.png"
               alt="airbus">
        </div>

        <!-- Boeing -->
        <div class="fleet-modern boeing-modern">
          <div>
            <div class="fleet-title">Boeing 737</div>
            <div class="fleet-label">Economy: {{ boeingSeats.economy }}</div>
            <div class="fleet-label">Business: {{ boeingSeats.business }}</div>
            <div class="fleet-label">First: {{ boeingSeats.first }}</div>
          </div>
          <img class="fleet-plane"
               src="https://freepngimg.com/download/airplane/125940-flying-airplane-vector-hd-image-free.png"
               alt="boeing">
        </div>

      </div>

      <!-- ✅ Second Row: KPI Cards -->
      <div class="kpi-grid">

        <div class="kpi-card success">
          <div class="kpi-title">Completed Flights</div>
          <div class="kpi-value">{{ completed }}</div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-title">Upcoming Flights</div>
          <div class="kpi-value">{{ active }}</div>
        </div>

        <div class="kpi-card danger">
          <div class="kpi-title">Cancelled Flights</div>
          <div class="kpi-value">{{ cancelled }}</div>
        </div>

        <div class="kpi-card primary">
          <div class="kpi-title">All Bookings</div>
          <div class="kpi-value">{{ bookingCount }}</div>
        </div>


      </div>

      <!-- ✅ Third Row: Chart + Upcoming Side by Side -->
      <div class="bottom-row">

        <!-- Left: Monthly Chart -->
        <div class="analytics-card">
          <h3>Monthly Activity (All Months)</h3>
          <canvas id="monthlyChart" style="width:100%; height:300px;"></canvas>
        </div>

        <!-- Right: Upcoming Flights -->
        <div *ngIf="upcomingFlights.length > 0" class="upcoming-wrapper side-upcoming">
          <div class="upcoming-header">
            <h3>Upcoming Flights</h3>
            <a class="see-all" routerLink="/admin/flights">See All</a>
          </div>

          <div class="upcoming-list">
            <div *ngFor="let flight of upcomingFlights" class="upcoming-card">

            <!-- Left Info -->
            <div class="flight-left">
              <div class="flight-no">{{ flight.flightno }}</div>
              <div class="flight-date">
                {{ flight.departuredate }}
              </div>
            </div>

            <!-- Middle Timeline -->
            <div class="flight-middle">
              <div class="flight-time">{{ flight.departuretime }}</div>

              <div class="flight-route">
                <span class="airport-code">{{ flight.departureairport }}</span>
                <div class="route-line"></div>
                <span class="airport-code">{{ flight.arrivalairport }}</span>
              </div>
            </div>

            <!-- Right Info -->
            <div class="flight-right">
              <div class="flight-time">{{ flight.arrivaltime }}</div>
              <div class="flight-status">Scheduled</div>
            </div>

          </div>
        </div>
      </div>


    </div>

  </div>
  `,
  styles: [`
    .dashboard-wrapper {
      padding: 30px 20px;
    }

    /* Main white container to fix visibility */
    .dashboard-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 18px;
      padding: 30px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }

    .dashboard-header h2 {
      margin: 0;
      font-size: 26px;
      color: #1e3a8a;
    }

    .dashboard-header p {
      margin-top: 6px;
      color: #6b7280;
      font-size: 14px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .kpi-card {
      background: #ffffff;
      padding: 22px;
      border-radius: 14px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
      transition: transform 0.2s ease;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
    }

    .kpi-title {
      font-size: 13px;
      color: #6b7280;
    }

    .kpi-value {
      font-size: 30px;
      font-weight: 700;
      margin-top: 8px;
      color: #111827;
    }

    .primary { border-left: 5px solid #3b82f6; }
    .success { border-left: 5px solid #16a34a; }
    .warning { border-left: 5px solid #f59e0b; }
    .danger  { border-left: 5px solid #ef4444; }

    /* ✅ Modern Total Flights Card (Reference Style) */
    .total-modern {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 22px;
      border-radius: 18px;
      background: linear-gradient(135deg, #5b5fdc, #7c3aed);
      color: #ffffff;
      min-height: 110px;
      box-shadow: 0 12px 30px rgba(91,95,220,0.25);
    }

    .total-title {
      font-size: 16px;
      font-weight: 700;
      opacity: 1;
    }

    .total-value {
      font-size: 30px;
      font-weight: 700;
      margin-top: 6px;
    }

    .total-image {
      width: 195px;
      height: auto;
      opacity: 0.85;
      background: transparent;
      filter: brightness(1.3) contrast(1.15);
    }

    /* ✅ Fleet Summary Single Row */
    .fleet-row-wrapper {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin-top: 30px;
    }

    @media (max-width: 1024px) {
      .fleet-row-wrapper {
        grid-template-columns: 1fr;
      }
    }

    .fleet-summary-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin-top: 30px;
    }

    /* ✅ Bottom Row: Chart + Upcoming Side by Side */
    .bottom-row {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      margin-top: 40px;
      align-items: start;
    }

    @media (max-width: 1100px) {
      .bottom-row {
        grid-template-columns: 1fr;
      }
    }

    .analytics-card {
      background: #ffffff;
      padding: 22px;
      border-radius: 14px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
    }

    /* ✅ Modern Fleet Cards (Reference Style) */
    .fleet-modern {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 18px;
      border-radius: 16px;
      color: #ffffff;
      min-height: 95px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
    }

    .airbus-modern {
      background: linear-gradient(135deg, #6cc28a, #4ea86e);
    }

    .boeing-modern {
      background: linear-gradient(135deg, #4f6bdc, #3b4fbf);
    }

    .fleet-title {
      font-size: 16px;
      font-weight: 700;
      opacity: 1;
    }

    .fleet-price {
      font-size: 20px;
      font-weight: 700;
      margin: 4px 0;
    }

    .fleet-label {
      font-size: 11px;
      opacity: 0.85;
    }

    .fleet-plane {
      width: 150px;
      transform: rotate(-22deg);
      opacity: 0.98;
      margin-right: -20px;
      margin-top: -10px;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3));
    }

    .analytics-card h3 {
      margin-top: 0;
      color: #1e3a8a;
      font-size: 18px;
    }

    /* ✅ Upcoming Flights Modern Style */
    .upcoming-wrapper {
      margin-top: 35px;
    }

    .upcoming-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .upcoming-header h3 {
      margin: 0;
      color: #1e3a8a;
    }

    .see-all {
      font-size: 13px;
      color: #6b7280;
      cursor: pointer;
    }

    .upcoming-list {
      display: grid;
      gap: 14px;
    }

    .upcoming-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 6px 18px rgba(0,0,0,0.06);
      transition: transform 0.2s ease;
    }

    .upcoming-card:hover {
      transform: translateY(-3px);
    }

    .flight-left {
      min-width: 120px;
    }

    .flight-no {
      font-weight: 600;
      font-size: 15px;
      color: #111827;
    }

    .flight-date {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .flight-middle {
      flex: 1;
      text-align: center;
    }

    .flight-time {
      font-weight: 600;
      font-size: 14px;
      color: #111827;
    }

    .flight-route {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 6px;
    }

    .airport-code {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }

    .route-line {
      flex: 1;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
      border-radius: 10px;
      max-width: 120px;
    }

    .flight-right {
      text-align: right;
      min-width: 100px;
    }

    .flight-status {
      font-size: 12px;
      margin-top: 4px;
      color: #16a34a;
    }

    .fleet-row {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      font-size: 14px;
      color: #374151;
    }

    /* ✅ Monthly Chart Styles */
    .month-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 10px;
      margin-top: 15px;
      height: 180px;
    }

    .month-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .bar {
      width: 100%;
      background: linear-gradient(180deg, #3b82f6, #1e3a8a);
      border-radius: 6px 6px 0 0;
      transition: height 0.3s ease;
    }

    .month-label {
      margin-top: 6px;
      font-size: 12px;
      color: #6b7280;
    }

    .month-count {
      font-size: 12px;
      font-weight: 600;
      color: #111827;
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {

  total = 0;
  completed = 0;
  cancelled = 0;
  active = 0;
  monthWise = 0;
  upcomingFlights: any[] = [];

  // ✅ Placeholder for future booking integration
  bookingCount = 0;

  airbusCount = 0;
  boeingCount = 0;

  // ✅ Dynamic Seat Availability Per Aircraft Type
  airbusSeats = { economy: 0, business: 0, first: 0 };
  boeingSeats = { economy: 0, business: 0, first: 0 };

  // ✅ Monthly data (separate for Airbus & Boeing)
  monthlyDataAirbus: number[] = new Array(12).fill(0);
  monthlyDataBoeing: number[] = new Array(12).fill(0);
  chart: any;

  // ✅ Calculate bar height safely (Airbus + Boeing)
  getBarHeight(count: number): number {
    const max = Math.max(
      ...this.monthlyDataAirbus,
      ...this.monthlyDataBoeing
    );
    if (!max || max === 0) return 0;
    return (count / max) * 100;
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadStats();

    // ✅ Auto refresh every 30 seconds so updates reflect immediately
    setInterval(() => {
      this.loadStats();
    }, 30000);
  }

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  initializeChart() {
    const ctx = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [
          {
            label: 'Airbus',
            data: this.monthlyDataAirbus,
            backgroundColor: '#6cc28a',
            borderRadius: 8,
            barThickness: 18
          },
          {
            label: 'Boeing',
            data: this.monthlyDataBoeing,
            backgroundColor: '#4f6bdc',
            borderRadius: 8,
            barThickness: 18
          }
        ]
      },
      options: {
        responsive: true,
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  updateChart() {
    if (this.chart) {
      this.chart.data.datasets[0].data = this.monthlyDataAirbus;
      this.chart.data.datasets[1].data = this.monthlyDataBoeing;
      this.chart.update();
    }
  }

  loadStats() {

    /* ✅ Fetch Flights Data */
    this.http.get<any[]>('http://localhost:5000/api/flights')
      .subscribe(data => {

        this.total = data.length;

        const now = new Date();

        // ✅ Completed = Arrival date & time are in the past
        this.completed = data.filter(f => {
          if (f.flightstatus === 'Cancelled') return false;
          if (!f.arrivaldate || !f.arrivaltime) return false;

          const arrivalDate = new Date(f.arrivaldate);
          const [hours, minutes, seconds] = f.arrivaltime.split(':').map(Number);

          arrivalDate.setHours(hours, minutes, seconds || 0, 0);

          return arrivalDate < now;
        }).length;

        this.cancelled = data.filter(f => f.flightstatus === 'Cancelled').length;

        // ✅ Upcoming = Flights whose arrival date & time are in present or future
        const upcoming = data.filter(f => {
          if (f.flightstatus === 'Cancelled') return false;
          if (!f.arrivaldate || !f.arrivaltime) return false;

          const arrivalDate = new Date(f.arrivaldate);
          const [hours, minutes, seconds] = f.arrivaltime.split(':').map(Number);

          arrivalDate.setHours(hours, minutes, seconds || 0, 0);

          return arrivalDate >= now;
        });

        // ✅ Limit to only 3 upcoming flights for dashboard preview
        this.upcomingFlights = upcoming.slice(0, 3);

        this.active = upcoming.length;

        // ✅ Calculate Airbus & Boeing flights per month
        const airbusMonthly = new Array(12).fill(0);
        const boeingMonthly = new Array(12).fill(0);

        data.forEach(f => {
          const dep = new Date(f.departuredate);
          const month = dep.getMonth();
          if (isNaN(month)) return;

          if (f.flighttype.includes('Airbus')) {
            airbusMonthly[month]++;
          }
          if (f.flighttype.includes('Boeing')) {
            boeingMonthly[month]++;
          }
        });

        this.monthlyDataAirbus = airbusMonthly;
        this.monthlyDataBoeing = boeingMonthly;
        this.updateChart();

        const currentMonth = new Date().getMonth();
        this.monthWise = airbusMonthly[currentMonth] + boeingMonthly[currentMonth];

        const airbus = data.filter(f => f.flighttype.includes('Airbus'));
        const boeing = data.filter(f => f.flighttype.includes('Boeing'));

        this.airbusCount = airbus.length;
        this.boeingCount = boeing.length;

        // ✅ Get seat availability dynamically (from first matching flight)
        // ✅ Fixed Seat Configuration (Independent of flights data)
        this.airbusSeats = {
          economy: 60,
          business: 30,
          first: 10
        };

        this.boeingSeats = {
          economy: 50,
          business: 25,
          first: 10
        };

        // ✅ Calculate average fare across ALL adult & child fares (Economy + Business + First)

        const calculateAverageFare = (flights: any[]) => {
          if (!flights.length) return '0';

          const total = flights.reduce((sum, f) => {
            return sum +
              Number(f.economyadultfare || 0) +
              Number(f.economychildfare || 0) +
              Number(f.businessadultfare || 0) +
              Number(f.businesschildfare || 0) +
              Number(f.firstadultfare || 0) +
              Number(f.firstchildfare || 0);
          }, 0);

          // 6 fare fields per flight
          const divisor = flights.length * 6;

          return divisor ? (total / divisor).toFixed(0) : '0';
        };


        // ✅ Stabilize Angular change detection for dashboard
        this.cdr.detectChanges();
      });

    /* ✅ Fetch All Bookings Count (User Side) */
    this.http.get<any[]>('http://localhost:5000/api/bookings')
      .subscribe(bookings => {
        this.bookingCount = bookings.length;
        this.cdr.detectChanges();
      });
  }
}
