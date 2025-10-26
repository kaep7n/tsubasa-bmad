import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;

    try {
      const response = await this.authService.signIn(email, password);

      if (response.error) {
        this.errorMessage = response.error.message;
        this.loading = false;
        return;
      }

      // Successful login - check for team and redirect appropriately
      this.authService.checkAndRedirectAfterLogin();
    } catch (_error) {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      this.loading = false;
    }
  }

  async onGoogleSignIn(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;

    try {
      const response = await this.authService.signInWithGoogle();

      if (response.error) {
        this.errorMessage = response.error.message;
        this.loading = false;
      }

      // OAuth flow will redirect automatically
    } catch (_error) {
      this.errorMessage = 'An unexpected error occurred with Google sign-in. Please try again.';
      this.loading = false;
    }
  }

  /**
   * Mark all fields in a form group as touched
   * Triggers validation error display
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get error message for email field
   */
  getEmailErrorMessage(): string {
    const email = this.loginForm.get('email');
    if (email?.hasError('required')) {
      return 'Email is required';
    }
    if (email?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  /**
   * Get error message for password field
   */
  getPasswordErrorMessage(): string {
    const password = this.loginForm.get('password');
    if (password?.hasError('required')) {
      return 'Password is required';
    }
    if (password?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }
}
