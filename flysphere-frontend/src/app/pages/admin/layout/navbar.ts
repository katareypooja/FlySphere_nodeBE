import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {

  adminName: string = '';
  adminEmail: string = '';

  constructor(private router: Router) {
    this.loadUserFromToken();
  }

  loadUserFromToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.adminEmail = payload.email;
        this.adminName = payload.role === 'ADMIN' ? 'Admin User' : 'User';
      } catch (error) {
        console.error('Invalid token format');
      }
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
