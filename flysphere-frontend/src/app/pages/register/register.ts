import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {


  userId = '';
  firstName = '';
  middleName = '';
  lastName = '';
  countryCode = '+91';
  phone = '';

  showCountryDropdown = false;
  countrySearch = '';

  countries = [
    { name: 'India', code: '+91', flag: 'https://flagcdn.com/w20/in.png', length: 10 },
    { name: 'United States', code: '+1', flag: 'https://flagcdn.com/w20/us.png', length: 10 },
    { name: 'United Kingdom', code: '+44', flag: 'https://flagcdn.com/w20/gb.png', length: 10 },
    { name: 'Australia', code: '+61', flag: 'https://flagcdn.com/w20/au.png', length: 9 },
    { name: 'United Arab Emirates', code: '+971', flag: 'https://flagcdn.com/w20/ae.png', length: 9 },
    { name: 'Japan', code: '+81', flag: 'https://flagcdn.com/w20/jp.png', length: 10 },
    { name: 'Germany', code: '+49', flag: 'https://flagcdn.com/w20/de.png', length: 11 },
    { name: 'France', code: '+33', flag: 'https://flagcdn.com/w20/fr.png', length: 9 },
    { name: 'Canada', code: '+1', flag: 'https://flagcdn.com/w20/ca.png', length: 10 },
    { name: 'Singapore', code: '+65', flag: 'https://flagcdn.com/w20/sg.png', length: 8 }
  ];

  get filteredCountries() {
    return this.countries.filter(c =>
      c.name.toLowerCase().includes(this.countrySearch.toLowerCase()) ||
      c.code.includes(this.countrySearch)
    );
  }

  toggleCountryDropdown() {
    this.showCountryDropdown = !this.showCountryDropdown;
  }

  selectCountry(country: any) {
    this.countryCode = country.code;
    this.showCountryDropdown = false;
    this.countrySearch = '';
  }

  get selectedCountry() {
    return this.countries.find(c => c.code === this.countryCode);
  }

  onPhoneInput(event: any) {
    const digits = event.target.value.replace(/[^0-9]/g, '');
    const maxLength = this.selectedCountry?.length || 12;
    const trimmed = digits.slice(0, maxLength);

    if (this.countryCode === '+91' && trimmed.length > 5) {
      this.phone = trimmed.slice(0, 5) + ' ' + trimmed.slice(5);
    } else {
      this.phone = trimmed;
    }
  }

  onPhoneKeyDown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

    if (allowedKeys.includes(event.key)) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPhonePaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pasted)) {
      event.preventDefault();
    }
  }

  get isPhoneLengthValid(): boolean {
    const expected = this.selectedCountry?.length;
    if (!expected) return true;
    return this.phone.replace(/\s/g, '').length === expected;
  }

  ngOnInit() {
    document.addEventListener('click', (event: any) => {
      const clickedInside = event.target.closest('.country-dropdown');
      if (!clickedInside) {
        this.showCountryDropdown = false;
      }
    });
  }
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  termsAccepted = false;
  loading = false;

  message = '';

  constructor(private auth: AuthService, private router: Router) {}

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  // ✅ Strict password validation helpers
  get hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  get hasLetter(): boolean {
    return /[A-Za-z]/.test(this.password);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.password);
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasLetter && this.hasNumber;
  }

  get strengthLevel(): number {
    let score = 0;
    if (this.hasMinLength) score++;
    if (this.hasLetter) score++;
    if (this.hasNumber) score++;
    return score;
  }

  get passwordStrength(): string {
    if (!this.password) return '';
    if (this.strengthLevel === 1) return 'Weak';
    if (this.strengthLevel === 2) return 'Medium';
    if (this.strengthLevel === 3) return 'Strong';
    return 'Weak';
  }

  get canRegister(): boolean {
    return Boolean(
      this.firstName &&
      this.lastName &&
      this.phone &&
      this.email &&
      this.password &&
      this.confirmPassword &&
      this.passwordsMatch &&
      this.isPasswordValid &&
      this.termsAccepted
    );
  }

  onRegister() {

    this.loading = true;

    if (!this.passwordsMatch) {
      this.message = 'Passwords do not match';
      return;
    }

    if (!this.termsAccepted) {
      this.message = 'Please accept Terms & Conditions';
      return;
    }

    const formattedPhone = (this.countryCode + this.phone).replace(/\s+/g, '');

    this.auth.register({
      userId: this.userId,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: formattedPhone,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.message = err?.error?.message || 'Registration failed';
      }
    });
  }
}
