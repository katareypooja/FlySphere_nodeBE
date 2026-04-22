import { Component, HostListener, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AIRPORTS } from '../../shared/airports';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.css']
})
export class FlightSearchComponent implements OnInit {

  @ViewChild('resultsSection') resultsSection!: ElementRef;
  @ViewChild('departureInput') departureInput!: ElementRef;
  @ViewChild('returnInput') returnInput!: ElementRef;

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.airports = AIRPORTS.map(a => `${a.name} (${a.code})`);
  }

  /* ================= USER ================= */
  user: any = null;

  ngOnInit(): void {

    // ✅ Set today's date as default departure
    const today = new Date();
    this.departureDate = today.toISOString().split('T')[0];

    this.auth.getProfile().subscribe({
      next: (res) => {
        this.user = res;
        this.cdr.detectChanges();
      },
      error: () => this.logout()
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /* ================= SUPPORT ================= */
  supportOpen = false;
  toggleSupport() {
    this.supportOpen = !this.supportOpen;
  }

  /* ================= TRIP ================= */
  tripType: 'oneway' | 'round' = 'oneway';

  setTripType(type: 'oneway' | 'round') {
    this.tripType = type;

    // ✅ Reset results when switching trip type
    this.searched = false;
    this.flights = [];
    this.returnFlights = [];
    this.selectedDeparture = null;
    this.selectedReturn = null;

    if (type === 'round') {
      if (!this.returnDate && this.departureDate) {
        const dep = new Date(this.departureDate);
        dep.setDate(dep.getDate() + 1);
        this.returnDate = dep.toISOString().split('T')[0];
      }
    }
  }

  airports: string[] = [];
  from = 'Delhi (DEL)';
  to = 'Bengaluru (BLR)';
  today: string = new Date().toISOString().split('T')[0];

  private _departureDate = '';
  returnDate = '';

  get departureDate(): string {
    return this._departureDate;
  }

  set departureDate(value: string) {
    this._departureDate = value;
    this.adjustReturnDate();
  }
  travelClass: string = 'Economy';

  /* ✅ City Display Helpers */
  get fromCityName(): string {
    return this.from?.split('(')[0]?.trim() || '';
  }

  get fromCityCode(): string {
    return this.from?.split('(')[1]?.replace(')', '')?.trim() || '';
  }

  get toCityName(): string {
    return this.to?.split('(')[0]?.trim() || '';
  }

  get toCityCode(): string {
    return this.to?.split('(')[1]?.replace(')', '')?.trim() || '';
  }

  /* ================= PREMIUM SEARCH STATE ================= */
  fromOpen: boolean = false;
  toOpen: boolean = false;
  airportSearch: string = '';

  swapLocations() {
    const temp = this.from;
    this.from = this.to;
    this.to = temp;
  }

  /* ================= TRAVELLERS ================= */
  adults = 1;
  children = 0;

  increase(type: string) {
    if (type === 'adult' && this.adults < 2) this.adults++;
    if (type === 'child' && this.children < 2) this.children++;
  }

  decrease(type: string) {
    if (type === 'adult' && this.adults > 1) this.adults--;
    if (type === 'child' && this.children > 0) this.children--;
  }

  get travellerSummary(): string {
    return `${this.adults} Adult · ${this.children} Children`;
  }

  /* ✅ Airline Style Date Formatting */
  openDatePicker() {
    if (this.departureInput?.nativeElement?.showPicker) {
      this.departureInput.nativeElement.showPicker();
    } else {
      this.departureInput.nativeElement.click();
    }
  }

  get formattedDepartureDay(): string {
    if (!this.departureDate) return '';
    const d = new Date(this.departureDate);
    return d.getDate().toString();
  }

  get formattedDepartureMonthYear(): string {
    if (!this.departureDate) return '';
    const d = new Date(this.departureDate);
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${month}'${year}`;
  }

  get formattedDepartureWeekday(): string {
    if (!this.departureDate) return '';
    const d = new Date(this.departureDate);
    return d.toLocaleString('default', { weekday: 'long' });
  }

  // ✅ Reliable auto-adjust return date (setter-based)
  private adjustReturnDate() {

    if (this.tripType !== 'round') return;
    if (!this._departureDate) return;

    const dep = new Date(this._departureDate);

    // If no return date → set to next day
    if (!this.returnDate) {
      dep.setDate(dep.getDate() + 1);
      this.returnDate = dep.toISOString().split('T')[0];
      return;
    }

    const ret = new Date(this.returnDate);

    // If return is same or before departure → reset
    if (ret <= dep) {
      dep.setDate(dep.getDate() + 1);
      this.returnDate = dep.toISOString().split('T')[0];
    }
  }

  /* ✅ Return Date Formatting */
  get formattedReturnDay(): string {
    if (!this.returnDate) return '';
    const d = new Date(this.returnDate);
    return d.getDate().toString();
  }

  get formattedReturnMonthYear(): string {
    if (!this.returnDate) return '';
    const d = new Date(this.returnDate);
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${month}'${year}`;
  }

  get formattedReturnWeekday(): string {
    if (!this.returnDate) return '';
    const d = new Date(this.returnDate);
    return d.toLocaleString('default', { weekday: 'long' });
  }

  /* ✅ Activate Return from One Way */
  activateReturn() {
    if (this.tripType === 'oneway') {
      this.tripType = 'round';

      // ✅ Auto-set return to tomorrow (based on departure)
      if (!this.returnDate && this.departureDate) {
        const dep = new Date(this.departureDate);
        dep.setDate(dep.getDate() + 1);
        this.returnDate = dep.toISOString().split('T')[0];
      }

      setTimeout(() => {
        this.openReturnPicker();
      }, 0);
    }
  }

  /* ✅ Open Return Picker (Same behaviour as Departure) */
  openReturnPicker() {
    if (this.returnInput?.nativeElement?.showPicker) {
      this.returnInput.nativeElement.showPicker();
    } else {
      this.returnInput?.nativeElement?.click();
    }
  }

  @HostListener('document:click', ['$event'])
  closeOutside(event: any) {

    // Close airport dropdowns
    if (!event.target.closest('.search-item') &&
        !event.target.closest('.airport-dropdown')) {
      this.fromOpen = false;
      this.toOpen = false;
    }

    // (Traveller popup removed – no close logic needed)
  }

  /* ================= AIRPORT FILTER ================= */
  get filteredAirports(): string[] {
    if (!this.airportSearch) return this.airports;

    return this.airports.filter(a =>
      a.toLowerCase().includes(this.airportSearch.toLowerCase())
    );
  }

  get isFormValid(): boolean {
    if (this.tripType === 'oneway') {
      return !!(this.from && this.to && this.departureDate);
    }
    if (this.tripType === 'round') {
      return !!(this.from && this.to && this.departureDate && this.returnDate);
    }
    return false;
  }

  /* ================= SEARCH STATE ================= */
  searched = false;
  isLoading = false;
  flights: any[] = [];
  returnFlights: any[] = [];
  lowestFare: number = 0;
  bestValueFare: number = 0;
  lowestFareReturn: number = 0;
  bestValueFareReturn: number = 0;
  sortOption: string = 'price';

  errorMessage: string = '';

  selectedDeparture: any = null;
  selectedReturn: any = null;

  /* ================= SEARCH ================= */
  searchFlights() {

    // ✅ Extra safety validation for round trip
    if (this.tripType === 'round' && this.returnDate && this.departureDate) {
      if (this.returnDate <= this.departureDate) {
        alert('Return date cannot be before departure date');
        return;
      }
    }

    // ✅ reset message + selection on every search
    this.errorMessage = '';

    this.selectedDeparture = null;
    this.selectedReturn = null;

    this.isLoading = true;
    this.returnFlights = [];

    const fromCode = this.from.split('(')[1]?.replace(')', '').trim();
    const toCode = this.to.split('(')[1]?.replace(')', '').trim();

    const departureUrl = `http://localhost:5000/api/flights?from=${fromCode}&to=${toCode}&date=${this.departureDate}`;

    this.http.get<any[]>(departureUrl).subscribe(data => {

      // ✅ Only allow Scheduled flights (case-insensitive safety)
      data = data.filter(f => 
        f.flightstatus && f.flightstatus.toLowerCase() === 'scheduled'
      );

      const calculateDuration = (dep: string, arr: string) => {
        const [dh, dm] = dep.split(':').map(Number);
        const [ah, am] = arr.split(':').map(Number);
        let diff = (ah * 60 + am) - (dh * 60 + dm);
        if (diff < 0) diff += 24 * 60;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
      };

      this.flights = data.map(f => {

        // ✅ Dynamic pricing based on selected class & passenger count
        let adultFare = 0;
        let childFare = 0;
        let availableSeats = 0;

        if (this.travelClass === 'Business') {
          adultFare = f.businessadultfare;
          childFare = f.businesschildfare;
          availableSeats = f.totalbusinessseats;
        } else if (this.travelClass === 'First Class') {
          adultFare = f.firstadultfare;
          childFare = f.firstchildfare;
          availableSeats = f.totalfirstclassseats;
        } else {
          // Default Economy
          adultFare = f.economyadultfare;
          childFare = f.economychildfare;
          availableSeats = f.totaleconomyseats;
        }

        const totalPrice =
          (adultFare * this.adults) +
          (childFare * this.children);

        return {
          id: f.flightid,
          airline: f.airlinename,

        // ✅ Added for display
        flightno: f.flightno,
        flighttype: f.flighttype,

        code: f.flightno,
        departTime: f.departuretime?.substring(0, 5),
        departCity: f.departureairport,
        arriveTime: f.arrivaltime?.substring(0, 5),
        arriveCity: f.arrivalairport,
        duration: calculateDuration(f.departuretime, f.arrivaltime),

        // ✅ Store full fare structure from DB
        economyAdultFare: f.economyadultfare,
        economyChildFare: f.economychildfare,
        businessAdultFare: f.businessadultfare,
        businessChildFare: f.businesschildfare,
        firstAdultFare: f.firstadultfare,
        firstChildFare: f.firstchildfare,

        totalEconomySeats: f.totaleconomyseats,
        totalBusinessSeats: f.totalbusinessseats,
        totalFirstSeats: f.totalfirstclassseats,

        // ✅ Dynamic calculated price
        price: totalPrice,
        seats: availableSeats
        };
      });

      if (this.flights.length > 0) {
        this.lowestFare = Math.min(...this.flights.map(f => f.price));

        const scored = this.flights.map(f => ({
          ...f,
          score: f.price + this.parseDuration(f.duration) * 10
        }));

        const best = scored.sort((a, b) => a.score - b.score)[0];
        this.bestValueFare = best.price;
      }

      this.applySorting();

      // ✅ If round trip → fetch return flights
      if (this.tripType === 'round' && this.returnDate) {

        const returnUrl = `http://localhost:5000/api/flights?from=${toCode}&to=${fromCode}&date=${this.returnDate}`;

        this.http.get<any[]>(returnUrl).subscribe(returnData => {

          // ✅ Only allow Scheduled flights for return (case-insensitive safety)
          returnData = returnData.filter(f => 
            f.flightstatus && f.flightstatus.toLowerCase() === 'scheduled'
          );

          const calculateDuration = (dep: string, arr: string) => {
            const [dh, dm] = dep.split(':').map(Number);
            const [ah, am] = arr.split(':').map(Number);
            let diff = (ah * 60 + am) - (dh * 60 + dm);
            if (diff < 0) diff += 24 * 60;
            return `${Math.floor(diff / 60)}h ${diff % 60}m`;
          };

          this.returnFlights = returnData.map(f => {

            let adultFare = 0;
            let childFare = 0;
            let availableSeats = 0;

            if (this.travelClass === 'Business') {
              adultFare = f.businessadultfare;
              childFare = f.businesschildfare;
              availableSeats = f.totalbusinessseats;
            } else if (this.travelClass === 'First Class') {
              adultFare = f.firstadultfare;
              childFare = f.firstchildfare;
              availableSeats = f.totalfirstclassseats;
            } else {
              adultFare = f.economyadultfare;
              childFare = f.economychildfare;
              availableSeats = f.totaleconomyseats;
            }

            const totalPrice =
              (adultFare * this.adults) +
              (childFare * this.children);

            return {
              id: f.flightid,
              airline: f.airlinename,

            // ✅ Added for display
            flightno: f.flightno,
            flighttype: f.flighttype,

            code: f.flightno,
            departTime: f.departuretime?.substring(0, 5),
            departCity: f.departureairport,
            arriveTime: f.arrivaltime?.substring(0, 5),
            arriveCity: f.arrivalairport,
            duration: calculateDuration(f.departuretime, f.arrivaltime),

            // ✅ FULL FARE STRUCTURE (same as departure)
            economyAdultFare: f.economyadultfare,
            economyChildFare: f.economychildfare,
            businessAdultFare: f.businessadultfare,
            businessChildFare: f.businesschildfare,
            firstAdultFare: f.firstadultfare,
            firstChildFare: f.firstchildfare,

            totalEconomySeats: f.totaleconomyseats,
            totalBusinessSeats: f.totalbusinessseats,
            totalFirstSeats: f.totalfirstclassseats,

            price: totalPrice,
            seats: availableSeats
            };
          });

          if (this.returnFlights.length > 0) {
            this.lowestFareReturn = Math.min(...this.returnFlights.map(f => f.price));

            const scoredReturn = this.returnFlights.map(f => ({
              ...f,
              score: f.price + this.parseDuration(f.duration) * 10
            }));

            const bestReturn = scoredReturn.sort((a, b) => a.score - b.score)[0];
            this.bestValueFareReturn = bestReturn.price;
          }

          this.searched = true;
          this.isLoading = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.resultsSection?.nativeElement.scrollIntoView({
              behavior: 'smooth'
            });
          }, 100);
        });

      } else {
        // ✅ One way
        this.searched = true;
        this.isLoading = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.resultsSection?.nativeElement.scrollIntoView({
            behavior: 'smooth'
          });
        }, 100);
      }

    });
  }

  applySorting() {
    if (this.sortOption === 'price') {
      this.flights.sort((a, b) => a.price - b.price);
    }
    if (this.sortOption === 'duration') {
      this.flights.sort((a, b) =>
        this.parseDuration(a.duration) - this.parseDuration(b.duration)
      );
    }
    if (this.sortOption === 'departure') {
      this.flights.sort((a, b) =>
        a.departTime.localeCompare(b.departTime)
      );
    }
  }

  parseDuration(duration: string): number {
    const parts = duration.split(' ');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    return hours * 60 + minutes;
  }

  /* ================= AIRLINE HELPERS ================= */
  getAirlineLogo(airline: string): string {
    const map: any = {
      'IndiGo': '6E',
      'Air India Express': 'AI',
      'SpiceJet': 'SG'
    };
    return map[airline] || '✈';
  }

  getAirlineColor(airline: string): string {
    const colors: any = {
      'IndiGo': '#1f55c4',
      'Air India Express': '#ff6b00',
      'SpiceJet': '#d91e18'
    };
    return colors[airline] || '#1f55c4';
  }

  /* ================= ROUND TOTAL ================= */
  get adultRoundTotal(): number {
    if (!this.selectedDeparture || !this.selectedReturn) return 0;
    return (this.selectedDeparture.price + this.selectedReturn.price) * this.adults;
  }

  get childRoundTotal(): number {
    if (!this.selectedDeparture || !this.selectedReturn) return 0;
    return (this.selectedDeparture.price + this.selectedReturn.price) * 0.75 * this.children;
  }

  get totalRoundPrice(): number {
    return this.adultRoundTotal + this.childRoundTotal;
  }

  selectDeparture(flight: any) {
    this.selectedDeparture = flight;
  }

  selectReturn(flight: any) {
    this.selectedReturn = flight;
  }

  /* ================= MODAL ================= */
  showFareModal = false;
  selectedFlight: any = null;
  fareOptions: any[] = [];
  selectedFare: any = null; // ✅ one-way
  selectedDepartureFare: any = null; // ✅ round-trip departure
  selectedReturnFare: any = null;    // ✅ round-trip return

  openFareModal(flight: any) {
    this.selectedFlight = flight;
    this.selectedFare = null; // ✅ reset selection

    // ✅ Lock body scroll
    document.body.style.overflow = 'hidden';

    // ✅ Fully DB-driven fare structure
    this.fareOptions = [
      {
        name: 'Economy',
        adultFare: flight.economyAdultFare,
        childFare: flight.economyChildFare,
        seats: flight.totalEconomySeats,
        baggage: ['7 Kgs Cabin Baggage', '15 Kgs Check-in Baggage'],
        flexibility: ['Cancellation fee applicable', 'Date change fee applicable'],
        extras: ['Chargeable Seats', 'Chargeable Meals']
      },
      {
        name: 'Business',
        adultFare: flight.businessAdultFare,
        childFare: flight.businessChildFare,
        seats: flight.totalBusinessSeats,
        baggage: ['10 Kgs Cabin Baggage', '20 Kgs Check-in Baggage'],
        flexibility: ['Lower cancellation fee', 'Lower date change fee'],
        extras: ['Free Seats', 'Complimentary Meals', 'Priority Boarding']
      },
      {
        name: 'First Class',
        adultFare: flight.firstAdultFare,
        childFare: flight.firstChildFare,
        seats: flight.totalFirstSeats,
        baggage: ['15 Kgs Cabin Baggage', '30 Kgs Check-in Baggage'],
        flexibility: ['Free cancellation', 'Free date change'],
        extras: ['Luxury Seats', 'Premium Meals', 'Lounge Access']
      }
    ];

    this.showFareModal = true;
  }

  closeFareModal() {
    this.showFareModal = false;

    // ✅ Unlock body scroll
    document.body.style.overflow = 'auto';
  }

  viewPrices(id: number) {
    const flight = this.flights.find(f => f.id === id);
    if (flight) this.openFareModal(flight);
  }

  selectFare(fare: any) {
    this.selectedFare = fare;
  }

  /* ✅ Open Dual Fare Modal for Round Trip */
  openRoundFareModal() {

    if (!this.selectedDeparture || !this.selectedReturn) return;

    document.body.style.overflow = 'hidden';

    this.selectedDepartureFare = null;
    this.selectedReturnFare = null;

    this.showFareModal = true;
  }

  bookNow(selectedFare?: any) {

    // ✅ ROUND TRIP FLOW
    if (this.tripType === 'round' && 
        this.selectedDeparture && 
        this.selectedReturn &&
        this.selectedDepartureFare &&
        this.selectedReturnFare) {

      const bookingData = {
        tripType: 'round',
        departure: {
          flight: this.selectedDeparture,
          fare: this.selectedDepartureFare
        },
        return: {
          flight: this.selectedReturn,
          fare: this.selectedReturnFare
        },
        cabinClass: this.selectedDepartureFare?.name || 'Economy',
        adults: this.adults,
        children: this.children
      };

      sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

      this.router.navigate(['/booking'], {
        state: { bookingData }
      });

      return;
    }

    // ✅ ONE WAY FLOW (normalized structure)
    const fareToBook = selectedFare || this.selectedFare;
    if (!fareToBook) return;

    const bookingData = {
      tripType: 'oneway',
      flight: this.selectedFlight,   // ✅ wrapped inside flight (consistent with round-trip)
      fare: fareToBook,
      cabinClass: fareToBook?.name || 'Economy',
      adults: this.adults,
      children: this.children
    };

    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

    this.router.navigate(['/booking'], {
      state: { bookingData }
    });
  }
}
