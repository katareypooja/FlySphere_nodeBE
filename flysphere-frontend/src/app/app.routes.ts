import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { TermsComponent } from './pages/terms/terms';
import { PrivacyComponent } from './pages/privacy/privacy';

/* ✅ Admin Imports */
import { AdminLayout } from './pages/admin/layout/admin-layout';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { FlightsList } from './pages/admin/flights/flights-list/flights-list';
import { CreateFlight } from './pages/admin/flights/create-flight/create-flight';
import { EditFlight } from './pages/admin/flights/edit-flight/edit-flight';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  /* ✅ Admin Routes */
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'flights', component: FlightsList },
      { path: 'create-flight', component: CreateFlight },
      { path: 'edit-flight/:id', component: EditFlight }
    ]
  },

  /* ✅ Search Routes */
  {
    path: 'search',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/search/flight-search.component')
            .then(m => m.FlightSearchComponent)
      },
      {
        path: 'fare-details/:id',
        loadComponent: () =>
          import('./pages/search/fare-details.component')
            .then(m => m.FareDetailsComponent)
      },
      {
        path: 'booking',
        loadComponent: () =>
          import('./pages/search/booking.component')
            .then(m => m.BookingComponent)
      }
    ]
  },

  {
    path: 'booking',
    loadComponent: () =>
      import('./pages/booking/booking.component')
        .then(m => m.BookingComponent)
  },
  {
    path: 'review',
    loadComponent: () =>
      import('./pages/review/review.component')
        .then(m => m.ReviewComponent)
  },
  {
    path: 'confirmation',
    loadComponent: () =>
      import('./pages/confirmation/confirmation.component')
        .then(m => m.ConfirmationComponent)
  },
  { path: 'terms', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent }
];
