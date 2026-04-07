import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-fare-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="fare-wrapper">
    <h2>Flight Details and Fare Options available for you!</h2>

    <div class="fare-cards">
      <div class="fare-card">
        <h3>Economy</h3>
        <div class="price">₹ 7,031</div>
        <ul>
          <li>7 Kg Cabin Baggage</li>
          <li>15 Kg Check-in Baggage</li>
          <li>Cancellation fee applies</li>
        </ul>
        <button (click)="book()">BOOK NOW</button>
      </div>

      <div class="fare-card">
        <h3>Premium Economy</h3>
        <div class="price">₹ 7,765</div>
        <ul>
          <li>7 Kg Cabin Baggage</li>
          <li>20 Kg Check-in Baggage</li>
          <li>Lower cancellation charges</li>
        </ul>
        <button (click)="book()">BOOK NOW</button>
      </div>

      <div class="fare-card">
        <h3>Business</h3>
        <div class="price">₹ 8,810</div>
        <ul>
          <li>10 Kg Cabin Baggage</li>
          <li>25 Kg Check-in Baggage</li>
          <li>Free Meals & Seats</li>
        </ul>
        <button (click)="book()">BOOK NOW</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .fare-wrapper { padding:40px; font-family:Segoe UI; }
    .fare-cards { display:flex; gap:30px; margin-top:20px; }
    .fare-card {
      background:#fff;
      border-radius:20px;
      padding:25px;
      width:300px;
      box-shadow:0 10px 30px rgba(0,0,0,0.1);
    }
    .price { font-size:22px; font-weight:800; margin:10px 0; }
    button {
      margin-top:15px;
      padding:10px 20px;
      border:none;
      border-radius:20px;
      background:#1f66d1;
      color:white;
      font-weight:700;
      cursor:pointer;
    }
  `]
})
export class FareDetailsComponent {

  constructor(private router: Router) {}

  book() {
    this.router.navigate(['/booking']);
  }
}
