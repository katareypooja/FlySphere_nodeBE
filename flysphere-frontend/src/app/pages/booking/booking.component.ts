import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingNavbarComponent } from '../../shared/booking-navbar/booking-navbar.component';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, BookingNavbarComponent],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit, AfterViewInit {

  bookingData: any = null;
  passengers: any[] = [];
  maxPassengers = 4;

  baggagePrice = 799;
  insurancePrice = 199;
  travelInsurance = false;

  contact = {
    email: '',
    phone: ''
  };

  validationErrors: string[] = [];
  formSubmitted = false;
  shakeForm = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);

    this.bookingData = history.state?.bookingData;

    if (!this.bookingData) {
      const stored = sessionStorage.getItem('bookingData');
      if (stored) {
        this.bookingData = JSON.parse(stored);
      }
    } else {
      sessionStorage.setItem('bookingData', JSON.stringify(this.bookingData));
    }

    if (!this.bookingData) {
      this.router.navigate(['/search']);
      return;
    }

    const state = history.state;

    if (state?.passengers?.length) {
      this.passengers = state.passengers;
    }

    if (state?.contact) {
      this.contact = state.contact;
    }

    Promise.resolve().then(() => {
      if (this.passengers.length === 0) {
        const adults = Number(this.bookingData?.adults) || 0;
        const children = Number(this.bookingData?.children) || 0;

        for (let i = 0; i < adults; i++) {
          this.passengers.push(this.createPassenger('adult'));
        }

        for (let i = 0; i < children; i++) {
          this.passengers.push(this.createPassenger('child'));
        }
      }
    });
  }

  private createPassenger(type: 'adult' | 'child') {
    return {
      title: '',
      firstName: '',
      lastName: '',
      dob: '',
      age: 0,
      type,
      seatPreference: '',
      baggage: false,
      mealPreference: ''
    };
  }

  addPassenger() {
    if (this.passengers.length >= this.maxPassengers) return;
    this.passengers.push(this.createPassenger('adult'));
  }

  removePassenger(index: number) {
    this.passengers.splice(index, 1);
  }

  onDobChange(passenger: any) {
    if (!passenger.dob) return;
    passenger.age = this.calculateAge(passenger.dob);
    passenger.type = passenger.age < 10 ? 'child' : 'adult';
  }

  calculateAge(dob: string): number {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  get adultCount(): number {
    return this.passengers.filter(p => p.type === 'adult').length;
  }

  get childCount(): number {
    return this.passengers.filter(p => p.type === 'child').length;
  }

  get totalFromSearch(): number {
    const adults = Number(this.bookingData?.adults) || 0;
    const children = Number(this.bookingData?.children) || 0;
    return adults + children;
  }

  get baseTotal(): number {
    if (this.bookingData?.tripType === 'round') {
      const depAdult = Number(this.bookingData?.departure?.fare?.adultFare) || 0;
      const depChild = Number(this.bookingData?.departure?.fare?.childFare) || 0;
      const retAdult = Number(this.bookingData?.return?.fare?.adultFare) || 0;
      const retChild = Number(this.bookingData?.return?.fare?.childFare) || 0;

      const adults = Number(this.bookingData?.adults) || 0;
      const children = Number(this.bookingData?.children) || 0;

      return Math.round(
        (depAdult + retAdult) * adults +
        (depChild + retChild) * children
      );
    }

    const adultFare = Number(this.bookingData?.fare?.adultFare) || 0;
    const childFare = Number(this.bookingData?.fare?.childFare) || 0;
    const adults = Number(this.bookingData?.adults) || 0;
    const children = Number(this.bookingData?.children) || 0;

    return Math.round(adultFare * adults + childFare * children);
  }

  getSeatPrice(type: string): number {
    if (type === 'middle') return 299;
    if (type === 'aisle') return 399;
    if (type === 'window') return 499;
    return 0;
  }

  getMealPrice(type: string): number {
    if (type === 'veg') return 199;
    if (type === 'jain') return 249;
    if (type === 'nonveg') return 299;
    return 0;
  }

  get addonsTotal(): number {
    let total = 0;

    this.passengers.forEach(p => {
      total += this.getSeatPrice(p.seatPreference);
      total += this.getMealPrice(p.mealPreference);
      if (p.baggage) total += this.baggagePrice;
    });

    if (this.travelInsurance) {
      total += this.insurancePrice * this.passengers.length;
    }

    return Math.round(total);
  }

  get taxAmount(): number {
    return Math.round((this.baseTotal + this.addonsTotal) * 0.12);
  }

  get convenienceFee(): number {
    return this.passengers.length > 0 ? 249 : 0;
  }

  get grandTotal(): number {
    return Math.round(
      this.baseTotal +
      this.addonsTotal +
      this.taxAmount +
      this.convenienceFee
    );
  }

  validateBooking(): boolean {
    this.validationErrors = [];
    this.formSubmitted = true;
    this.shakeForm = false;

    if (this.passengers.length === 0) {
      this.validationErrors.push('At least one passenger is required.');
    }

    if (this.childCount > 0 && this.adultCount === 0) {
      this.validationErrors.push('At least one adult is required to book a child ticket.');
    }

    this.passengers.forEach((p, index) => {
      if (!p.firstName) {
        this.validationErrors.push(`Passenger ${index + 1}: First name is required.`);
      }
      if (!p.lastName) {
        this.validationErrors.push(`Passenger ${index + 1}: Last name is required.`);
      }
      if (!p.dob) {
        this.validationErrors.push(`Passenger ${index + 1}: Date of birth is required.`);
      }
      if (!p.age || p.age <= 0) {
        this.validationErrors.push(`Passenger ${index + 1}: Please provide valid date of birth.`);
      }
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.contact.email || !emailRegex.test(this.contact.email)) {
      this.validationErrors.push('Please enter a valid email address.');
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!this.contact.phone || !phoneRegex.test(this.contact.phone)) {
      this.validationErrors.push('Please enter a valid 10-digit phone number.');
    }

    if (this.validationErrors.length > 0) {
      this.shakeForm = true;

      setTimeout(() => {
        this.shakeForm = false;
      }, 400);

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }

    return this.validationErrors.length === 0;
  }

  getPassengerSubtotal(p: any): number {
    let fareTotal = 0;

    if (this.bookingData?.tripType === 'round') {
      const depAdult = Number(this.bookingData?.departure?.fare?.adultFare) || 0;
      const depChild = Number(this.bookingData?.departure?.fare?.childFare) || 0;
      const retAdult = Number(this.bookingData?.return?.fare?.adultFare) || 0;
      const retChild = Number(this.bookingData?.return?.fare?.childFare) || 0;

      fareTotal = p.type === 'adult'
        ? depAdult + retAdult
        : depChild + retChild;
    } else {
      const adultFare = Number(this.bookingData?.fare?.adultFare) || 0;
      const childFare = Number(this.bookingData?.fare?.childFare) || 0;
      fareTotal = p.type === 'adult' ? adultFare : childFare;
    }

    const addons =
      this.getSeatPrice(p.seatPreference) +
      this.getMealPrice(p.mealPreference) +
      (p.baggage ? this.baggagePrice : 0);

    return Math.round(fareTotal + addons);
  }

  isPassengerFieldInvalid(value: any): boolean {
    return this.formSubmitted && (!value || value === '');
  }

  isDobInvalid(p: any): boolean {
    return this.formSubmitted && (!p.dob || !p.age || p.age <= 0);
  }

  isEmailInvalid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.formSubmitted &&
           (!this.contact.email || !emailRegex.test(this.contact.email));
  }

  isPhoneInvalid(): boolean {
    const phoneRegex = /^[0-9]{10}$/;
    return this.formSubmitted &&
           (!this.contact.phone || !phoneRegex.test(this.contact.phone));
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });

      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }, 0);
  }

  goBackToSearch(): void {
    this.router.navigate(['/search']);
  }

  confirmBooking() {
    if (!this.validateBooking()) return;

    this.router.navigate(['/review'], {
      state: {
        bookingData: this.bookingData,
        passengers: this.passengers,
        contact: this.contact,
        totals: {
          baseTotal: this.baseTotal,
          addonsTotal: this.addonsTotal,
          taxAmount: this.taxAmount,
          convenienceFee: this.convenienceFee,
          grandTotal: this.grandTotal
        }
      }
    });
  }
}
