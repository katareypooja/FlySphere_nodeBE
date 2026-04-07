import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-edit-flight',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './edit-flight.html',
  styleUrls: ['./edit-flight.css']
})
export class EditFlight implements OnInit {

  flightId: number = 0;
  flight: any = {};
  // ✅ No longer needed (removed delay/reschedule logic)

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.flightId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadFlight();
  }

  loadFlight() {
    this.http.get<any>(`http://localhost:5000/api/flights/${this.flightId}`)
      .subscribe(response => {

        console.log('Edit flight API response:', response);

        // ✅ Handle different backend response shapes
        let data = response;

        if (Array.isArray(response)) {
          data = response[0];
        } else if (response?.rows) {
          data = response.rows[0];
        }

        if (!data) {
          console.error('No flight data found');
          return;
        }

        // ✅ Backend already returns lowercase keys (as seen in console)
        // Assign directly and only adjust date/time format for inputs

        this.flight = { ...data };
        // ✅ No original comparison needed

        // ✅ Normalize BOTH objects for accurate comparison
        if (this.flight.departuredate) {
          this.flight.departuredate = this.flight.departuredate.substring(0, 10);
        }

        if (this.flight.arrivaldate) {
          this.flight.arrivaldate = this.flight.arrivaldate.substring(0, 10);
        }

        if (this.flight.departuretime) {
          this.flight.departuretime = this.flight.departuretime.substring(0, 5);
        }

        if (this.flight.arrivaltime) {
          this.flight.arrivaltime = this.flight.arrivaltime.substring(0, 5);
        }

        // ✅ Force change detection in case router reuse prevents update
        this.cdr.detectChanges();

      });
  }

  // ✅ Minimum flight duration (in minutes)
  minDurationMinutes = 120; // 2 hours (adjust as needed)

  // ✅ Intelligent auto-calculation
  onDepartureChange() {
    if (!this.flight.departuredate || !this.flight.departuretime) {
      return;
    }

    const depDateTime = new Date(
      `${this.flight.departuredate}T${this.flight.departuretime}`
    );

    // Add minimum duration
    const arrivalDateTime = new Date(
      depDateTime.getTime() + this.minDurationMinutes * 60000
    );

    // Format date YYYY-MM-DD
    const yyyy = arrivalDateTime.getFullYear();
    const mm = String(arrivalDateTime.getMonth() + 1).padStart(2, '0');
    const dd = String(arrivalDateTime.getDate()).padStart(2, '0');

    this.flight.arrivaldate = `${yyyy}-${mm}-${dd}`;

    // Format time HH:mm
    const hh = String(arrivalDateTime.getHours()).padStart(2, '0');
    const min = String(arrivalDateTime.getMinutes()).padStart(2, '0');

    this.flight.arrivaltime = `${hh}:${min}`;
  }

  updateFlight() {

    // ✅ Always reset status to Scheduled on edit
    const payload = {
        AirlineName: this.flight.airlinename,
        FlightType: this.flight.flighttype,
        FlightNo: this.flight.flightno,
        DepartureAirport: this.flight.departureairport,
        ArrivalAirport: this.flight.arrivalairport,
        DepartureDate: this.flight.departuredate,
        ArrivalDate: this.flight.arrivaldate,
        DepartureTime: this.flight.departuretime,
        ArrivalTime: this.flight.arrivaltime,
        TotalEconomySeats: this.flight.totaleconomyseats,
        TotalBusinessSeats: this.flight.totalbusinessseats,
        TotalFirstClassSeats: this.flight.totalfirstclassseats,

        EconomyAdultFare: this.flight.economyadultfare,
        EconomyChildFare: this.flight.economychildfare,
        BusinessAdultFare: this.flight.businessadultfare,
        BusinessChildFare: this.flight.businesschildfare,
        FirstAdultFare: this.flight.firstadultfare,
        FirstChildFare: this.flight.firstchildfare,

        FlightStatus: 'Scheduled'
      };

    this.http.put(`http://localhost:5000/api/flights/${this.flightId}`, payload)
      .subscribe({
        next: () => {
          alert('Flight updated successfully');
          this.router.navigate(['/admin/flights']);
        },
        error: (err) => {
          console.error('Update failed:', err);
          alert('Update failed. Check console for details.');
        }
      });
  }
}
