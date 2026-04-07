import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {

  bookingData: any;
  passengers: any[] = [];
  contact: any;
  totals: any;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const state = history.state;

    if (!state || !state.bookingData) {
      this.router.navigate(['/search']);
      return;
    }

    this.bookingData = state.bookingData;
    this.passengers = state.passengers || [];
    this.contact = state.contact || {};
    this.totals = state.totals || {};
  }

  confirmBooking() {
    const payload = {
      user_id: 1, // TODO: replace with logged-in user id
      flight_id: this.bookingData?.flightId || this.bookingData?.id,
      passengers: this.passengers,
      total_amount: this.totals?.grandTotal
    };

    this.http.post('http://localhost:5000/api/bookings', payload)
      .subscribe((response: any) => {
        this.router.navigate(['/confirmation'], {
          state: {
            bookingId: response.booking.booking_id,
            bookingIdNumeric: response.booking.id,
            bookingData: this.bookingData,
            passengers: this.passengers,
            totals: this.totals
          }
        });
      });
  }
}
