import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="booking-wrapper">
    <h2>Booking Page</h2>
    <p>Your selected fare is ready for booking.</p>

    <div class="form">
      <input placeholder="Passenger Name" />
      <input placeholder="Email Address" />
      <input placeholder="Mobile Number" />
      <button>CONFIRM BOOKING</button>
    </div>
  </div>
  `,
  styles: [`
    .booking-wrapper {
      padding: 40px;
      font-family: Segoe UI;
    }
    .form {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-width: 400px;
    }
    input {
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #ccc;
    }
    button {
      padding: 12px;
      border-radius: 20px;
      border: none;
      background: #1f66d1;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
  `]
})
export class BookingComponent {}
