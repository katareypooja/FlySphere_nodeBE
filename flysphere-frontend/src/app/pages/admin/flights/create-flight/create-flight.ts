import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AIRPORTS } from '../../../../shared/airports';

@Component({
  selector: 'app-create-flight',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule,
    HttpClientModule
  ],
  templateUrl: './create-flight.html',
  styleUrls: ['./create-flight.css'],
})
export class CreateFlight {

  airports = AIRPORTS;

  // ✅ Domestic Airlines Only
  airlines = [
    {
      category: 'Domestic Airlines',
      list: [
        { name: 'IndigoAir', code: 'IA' },
        { name: 'Bharat Wings', code: 'BW' },
        { name: 'SpiceSky', code: 'SS' },
        { name: 'VistaraX', code: 'VX' },
        { name: 'AkasaFly', code: 'AF' }
      ]
    }
  ];

  flightForm: FormGroup;
  today: Date = new Date();


  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {

      this.flightForm = this.fb.group({
        AirlineName: ['', Validators.required],
        FlightType: ['', Validators.required],
        // ✅ FlightNo auto-generated (do not block form submission)
        FlightNo: [''],
        // ✅ Flight status (required for edit/cancel flow stability)
        FlightStatus: ['Scheduled'],
        DepartureAirport: ['', Validators.required],
        ArrivalAirport: ['', Validators.required],
        DepartureDate: ['', Validators.required],
        ArrivalDate: [{ value: '', disabled: true }, Validators.required],
        // ✅ 12-hour time controls
        DepartureHour: ['', Validators.required],
        DepartureMinute: ['', Validators.required],
        DeparturePeriod: ['AM', Validators.required],

        // Hidden 24-hour value (internal use)
        DepartureTime: [''],

        ArrivalTime: [{ value: '', disabled: true }, Validators.required],
        DurationMinutes: [null, [Validators.required, Validators.min(1)]],
        TotalEconomySeats: [50, Validators.required],
        TotalBusinessSeats: [25, Validators.required],
        TotalFirstClassSeats: [10, Validators.required],

        // Economy fares
        EconomyAdultFare: [null, [Validators.required, Validators.min(0)]],
        EconomyChildFare: [{ value: null, disabled: true }],

        // Business fares (Auto-calculated)
        BusinessAdultFare: [{ value: null, disabled: true }],
        BusinessChildFare: [{ value: null, disabled: true }],

        // First class fares (Auto-calculated)
        FirstAdultFare: [{ value: null, disabled: true }],
        FirstChildFare: [{ value: null, disabled: true }]
      });


      // ✅ Single unified subscription for all derived calculations
      this.flightForm.valueChanges.subscribe(() => {
        this.generateFlightNumber();
        this.updateDepartureTime();
        this.autoCalculateArrival();
      });

      // ✅ Auto-calculate pricing based on Economy Adult Fare
      this.flightForm.get('EconomyAdultFare')?.valueChanges.subscribe((value) => {
        this.autoCalculatePricing(value);
      });
  }


  // Returns user-friendly minimum duration label for the selected route
  getMinDurationLabel(): string {
    const departure = this.flightForm.value.DepartureAirport;
    const arrival = this.flightForm.value.ArrivalAirport;
    if (!departure || !arrival) return '';

    const durationMap: any = {
      'DEL-MUM': { hours: 2, minutes: 30 },
      'DEL-KOL': { hours: 2, minutes: 25 },
      'BLR-MUM': { hours: 2, minutes: 15 },
      'BLR-KOL': { hours: 2, minutes: 20 }
    };

    const routeKey = `${departure}-${arrival}`;
    const d = durationMap[routeKey];
    if (!d) return '';

    const hours = d.hours;
    const minutes = d.minutes;
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    if (minutes) return `${minutes}m`;
    return '';
  }

  // Allow editing status via a small modal (fallback prompt). Validates allowed statuses and patches the form.
  editStatus() {
    const allowed = ['Scheduled','Delayed','Cancelled','Boarding','Departed','Arrived'];
    const current = this.flightForm.value.FlightStatus || 'Scheduled';
    const val = window.prompt('Edit Flight Status (allowed: ' + allowed.join(', ') + ')', current);
    if (val === null) return; // user cancelled
    const normalized = val.trim();
    if (allowed.includes(normalized)) {
      this.flightForm.patchValue({ FlightStatus: normalized }, { emitEvent: true });
      this.snackBar.open('Flight status updated to ' + normalized, 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('Invalid status. Allowed: ' + allowed.join(', '), 'Close', { duration: 3000 });
    }
  }

  generateFlightNumber() {
    const airline = this.flightForm.value.AirlineName;
    if (!airline) return;

    // ✅ Dynamic airline prefix (2 letters)
    const airlinePrefixMap: any = {};
    this.airlines.forEach(group => {
      group.list.forEach(a => {
        airlinePrefixMap[a.name] = a.code;
      });
    });

    const prefix = airlinePrefixMap[airline];
    if (!prefix) return;

    // ✅ Generate random 3-digit number (100–999)
    const randomNumber = Math.floor(100 + Math.random() * 900);

    const flightNo = `${prefix}${randomNumber}`;

    this.flightForm.patchValue({ FlightNo: flightNo }, { emitEvent: false });
  }

  // ✅ Convert 12h → 24h and trigger arrival calculation
  updateDepartureTime() {

    const hour = Number(this.flightForm.value.DepartureHour);
    const minute = this.flightForm.value.DepartureMinute;
    const period = this.flightForm.value.DeparturePeriod;

    if (!hour || minute === '' || !period) return;

    let hour24 = hour;

    if (period === 'PM' && hour !== 12) hour24 += 12;
    if (period === 'AM' && hour === 12) hour24 = 0;

    const formattedHour = hour24.toString().padStart(2, '0');
    const time24 = `${formattedHour}:${minute}`;

    this.flightForm.patchValue({ DepartureTime: time24 }, { emitEvent: false });
  }

  // ✅ Auto-calculate Pricing (Multiplier Logic)
  autoCalculatePricing(baseFare: number) {

    if (!baseFare || baseFare <= 0) return;

    const economyChild = Math.round(baseFare * 0.75);

    const businessAdult = Math.round(baseFare * 1.8);
    const businessChild = Math.round(businessAdult * 0.75);

    const firstAdult = Math.round(baseFare * 2.5);
    const firstChild = Math.round(firstAdult * 0.75);

    this.flightForm.patchValue(
      {
        EconomyChildFare: economyChild,
        BusinessAdultFare: businessAdult,
        BusinessChildFare: businessChild,
        FirstAdultFare: firstAdult,
        FirstChildFare: firstChild
      },
      { emitEvent: false }
    );
  }

  // ✅ Calculate Arrival = Departure + Duration (Safe Date Handling)
  autoCalculateArrival() {

    const departureDate: Date = this.flightForm.getRawValue().DepartureDate;
    const departureTime = this.flightForm.getRawValue().DepartureTime;
    const durationMinutes = this.flightForm.getRawValue().DurationMinutes;

    if (!departureDate || !departureTime || durationMinutes == null) return;

    const [hours, minutes] = departureTime.split(':').map(Number);

    // ✅ Construct date safely without re-wrapping existing Date
    const dep = new Date(
      departureDate.getFullYear(),
      departureDate.getMonth(),
      departureDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    dep.setMinutes(dep.getMinutes() + Number(durationMinutes));

    const arrivalDateObj = new Date(
      dep.getFullYear(),
      dep.getMonth(),
      dep.getDate()
    );

    const arrHours = dep.getHours().toString().padStart(2, '0');
    const arrMinutes = dep.getMinutes().toString().padStart(2, '0');

    this.flightForm.get('ArrivalDate')?.setValue(arrivalDateObj, { emitEvent: false });
    this.flightForm.get('ArrivalTime')?.setValue(`${arrHours}:${arrMinutes}`, { emitEvent: false });
  }

  onSubmit() {

    console.log('Submit clicked');
    console.log('Form valid:', this.flightForm.valid);

    if (!this.flightForm.valid) {
      console.log('Form invalid — marking all as touched');
      this.flightForm.markAllAsTouched();
      return;
    }

    const formData = this.flightForm.getRawValue();

    const {
      AirlineName,
      FlightType,
      FlightNo,
      DepartureAirport,
      ArrivalAirport,
      DepartureDate,
      ArrivalDate,
      DepartureTime,
      ArrivalTime,
      TotalEconomySeats,
      TotalBusinessSeats,
      TotalFirstClassSeats,
      EconomyAdultFare,
      EconomyChildFare,
      BusinessAdultFare,
      BusinessChildFare,
      FirstAdultFare,
      FirstChildFare
    } = formData;

      const payload = {
        AirlineName,
        FlightType,
        FlightNo,
        DepartureAirport,
        ArrivalAirport,
        DepartureDate: `${DepartureDate.getFullYear()}-${(DepartureDate.getMonth()+1).toString().padStart(2,'0')}-${DepartureDate.getDate().toString().padStart(2,'0')}`,
        ArrivalDate: `${ArrivalDate.getFullYear()}-${(ArrivalDate.getMonth()+1).toString().padStart(2,'0')}-${ArrivalDate.getDate().toString().padStart(2,'0')}`,
        DepartureTime: DepartureTime + ':00',
        ArrivalTime: ArrivalTime + ':00',
        TotalEconomySeats,
        TotalBusinessSeats,
        TotalFirstClassSeats,
        EconomyAdultFare,
        EconomyChildFare,
        BusinessAdultFare,
        BusinessChildFare,
        FirstAdultFare,
        FirstChildFare,
        FlightStatus: 'Scheduled'
      };

      console.log('Submitting payload:', payload);

    this.http.post('http://localhost:5000/api/flights', payload)
      .subscribe({
        next: () => {

          this.snackBar.open(
            'Flight successfully created',
            'Close',
            { duration: 3000, verticalPosition: 'top', horizontalPosition: 'center' }
          );

          this.router.navigate(['/admin/flights'], { replaceUrl: true });
        },
        error: (err) => {
          console.error(err);

          const message =
            err?.error?.error || 'Flight already exists';

          this.snackBar.open(
            message,
            'Close',
            { duration: 3000, verticalPosition: 'top', horizontalPosition: 'center' }
          );
        }
      });
  }
}
