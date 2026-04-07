import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {

  bookingId: string = '';
  bookingData: any;
  passengers: any[] = [];
  totals: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const state = history.state;

    if (!state || !state.bookingId) {
      this.router.navigate(['/search']);
      return;
    }

    this.bookingId = state.bookingId;
    this.bookingData = state.bookingData;
    this.passengers = state.passengers || [];
    this.totals = state.totals || {};
  }

  printTicket() {
    window.print();
  }

  downloadTicket() {
    if (!this.bookingId) return;

    const bookingNumericId = history.state?.bookingIdNumeric || null;

    if (!bookingNumericId) {
      alert('Unable to download ticket.');
      return;
    }

    window.open(
      `http://localhost:5000/api/bookings/${bookingNumericId}/ticket`,
      '_blank'
    );
  }

  goHome() {
    this.router.navigate(['/search']);
  }
}
