import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookingNavbarComponent } from '../../shared/booking-navbar/booking-navbar.component';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, BookingNavbarComponent],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {
  bookingData: any;
  bookingId: string = '';

  passengers: any[] = [];
  totals: any;

  tripType?: string;
  outboundFlight: any;
  returnFlight: any | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef   // ✅ add this
  ) {}

  ngOnInit(): void {
    console.log('✅ Confirmation component loaded');
    const bookingIdParam = this.route.snapshot.paramMap.get('bookingId');
    console.log('✅ bookingId from route:', bookingIdParam);

    if (!bookingIdParam) {
      console.warn('No bookingId param, redirecting to /search');
      this.router.navigate(['/search']);
      return;
    }

    this.bookingId = bookingIdParam;

    const url = `http://localhost:5000/api/bookings/${this.bookingId}`;
    console.log('✅ Fetching booking from:', url);

    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('✅ Booking API response:', response);

        if (!response || response.success !== true || !response.booking) {
          console.warn('Unexpected response or success!=true, redirecting');
          this.router.navigate(['/search']);
          return;
        }

        const b = response.booking;

        this.bookingData = b;
        this.passengers = response.passengers || [];
        this.totals = { grandTotal: b.total_amount };

        this.tripType = b.trip_type;
        this.outboundFlight = b.outbound_flight;
        this.returnFlight = b.return_flight || null;

        console.log('✅ bookingData set in component:', this.bookingData);
        console.log('✅ passengers set in component:', this.passengers);
        console.log('✅ totals set in component:', this.totals);
        console.log('✅ outboundFlight:', this.outboundFlight);
        console.log('✅ returnFlight:', this.returnFlight);

        // ✅ Force Angular to update the view now that data is set
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Booking fetch error', err);
        this.router.navigate(['/search']);
      }
    });
  }

  printTicket() { window.print(); }

  downloadTicket() {
    if (!this.bookingData?.id) return;
    window.open(
      `http://localhost:5000/api/bookings/${this.bookingData.id}/ticket`,
      '_blank'
    );
  }

  goHome() { this.router.navigate(['/search']); }
}
