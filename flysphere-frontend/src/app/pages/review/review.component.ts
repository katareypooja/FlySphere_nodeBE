import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookingNavbarComponent } from '../../shared/booking-navbar/booking-navbar.component';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, BookingNavbarComponent],
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
    const isRound = this.bookingData?.tripType === 'round';

    const outboundFlightId = isRound
      ? this.bookingData?.departure?.flight?.id
      : this.bookingData?.flight?.id;

    const payload: any = {
      user_id: 1, // TODO: replace with logged-in user id
      outbound_flight_id: outboundFlightId,
      passengers: this.passengers,
      total_amount: this.totals?.grandTotal,
      trip_type: this.bookingData?.tripType || (isRound ? 'round' : 'oneway')
    };

    if (isRound) {
      payload.return_flight_id = this.bookingData?.return?.flight?.id;

      // ✅ Send separate cabin classes for round trip
      payload.outbound_cabin_class =
        this.bookingData?.departure?.fare?.name || 'Economy';

      payload.return_cabin_class =
        this.bookingData?.return?.fare?.name || 'Economy';
    } else {
      // ✅ One way
      payload.outbound_cabin_class =
        this.bookingData?.fare?.name ||
        this.bookingData?.cabinClass ||
        'Economy';
    }

    console.log('🚀 Sending booking payload:', payload);

    this.http.post('http://localhost:5000/api/bookings', payload)
      .subscribe({
        next: (response: any) => {
          console.log('✅ Booking API response:', response);

          if (!response || !response.booking) {
            alert('Booking succeeded but response format is unexpected.');
            return;
          }

          // ✅ Navigate using route param (production-safe)
          this.router.navigate([
            '/confirmation',
            response.booking.booking_id
          ]);
        },
        error: (error) => {
          console.error('❌ Booking API failed:', error);
          alert('Booking failed. Please check backend server or try again.');
        }
      });
  }

  goBackToBooking() {
    this.router.navigate(['/booking'], {
      state: {
        bookingData: this.bookingData,
        passengers: this.passengers,
        contact: this.contact,
        totals: this.totals
      }
    });
  }
}
