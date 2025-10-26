import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
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
    MatProgressBarModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  hidePassword = true;
  hideConfirmPassword = true;
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
  passwordStrengthValue = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.signupForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );

    this.signupForm.get('password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (!password || !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 'weak';
      this.passwordStrengthValue = 0;
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password)) strength += 12.5;
    if (/[A-Z]/.test(password)) strength += 12.5;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    this.passwordStrengthValue = Math.min(strength, 100);
    if (this.passwordStrengthValue < 50) this.passwordStrength = 'weak';
    else if (this.passwordStrengthValue < 80) this.passwordStrength = 'medium';
    else this.passwordStrength = 'strong';
  }

  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) {
      this.markFormGroupTouched(this.signupForm);
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { email, password } = this.signupForm.value;

    try {
      const response = await this.authService.signUp(email, password);
      if (response.error) {
        this.errorMessage = response.error.message;
        this.loading = false;
        return;
      }

      this.successMessage = 'Account created successfully! Redirecting to login...';
      this.signupForm.reset();
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (_error) {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      this.loading = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  getEmailErrorMessage(): string {
    const email = this.signupForm.get('email');
    if (email?.hasError('required')) return 'Email is required';
    if (email?.hasError('email')) return 'Please enter a valid email address';
    return '';
  }

  getPasswordErrorMessage(): string {
    const password = this.signupForm.get('password');
    if (password?.hasError('required')) return 'Password is required';
    if (password?.hasError('minlength')) return 'Password must be at least 8 characters';
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmPassword = this.signupForm.get('confirmPassword');
    if (confirmPassword?.hasError('required')) return 'Please confirm your password';
    if (this.signupForm.hasError('passwordMismatch') && confirmPassword?.touched)
      return 'Passwords do not match';
    return '';
  }

  getPasswordStrengthColor(): string {
    switch (this.passwordStrength) {
      case 'weak':
        return 'warn';
      case 'medium':
        return 'accent';
      case 'strong':
        return 'primary';
      default:
        return 'warn';
    }
  }
}
