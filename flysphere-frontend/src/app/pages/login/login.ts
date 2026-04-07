import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email: string = '';
  password: string = '';
  message: string = '';
  successMessage: string = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const registered = this.route.snapshot.queryParamMap.get('registered');
    if (registered === 'true') {
      this.successMessage = '✅ Account created successfully! You can now login.';
    }
  }

  onLogin() {
    const data = {
      email: this.email,
      password: this.password
    };

    this.auth.login(data).subscribe({
      next: (res: any) => {
        this.auth.saveToken(res.token);
        this.message = '✅ Login Successful';

        if (res.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/search']);
        }
      },
      error: (err: any) => {
        this.message = '❌ Login Failed';
        console.error(err);
      }
    });
  }
}
