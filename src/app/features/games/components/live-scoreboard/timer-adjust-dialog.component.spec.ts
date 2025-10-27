import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { TimerAdjustDialogComponent } from './timer-adjust-dialog.component';
import { GameTimerService } from '../../../../core/services/game-timer.service';

describe('TimerAdjustDialogComponent', () => {
  let component: TimerAdjustDialogComponent;
  let fixture: ComponentFixture<TimerAdjustDialogComponent>;
  let mockTimerService: jasmine.SpyObj<GameTimerService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<TimerAdjustDialogComponent>>;

  // Mock signals that we can update during tests
  let mockCurrentMinute: WritableSignal<number>;
  let mockIsRunning: WritableSignal<boolean>;
  let mockIsHalfTime: WritableSignal<boolean>;

  const mockDialogData = { gameId: 'test-game-id' };

  beforeEach(async () => {
    // Initialize mock signals
    mockCurrentMinute = signal(0);
    mockIsRunning = signal(false);
    mockIsHalfTime = signal(false);

    // Create mock services
    mockTimerService = jasmine.createSpyObj('GameTimerService',
      ['pauseTimer', 'resumeTimer', 'setMinute', 'stopTimer'],
      {
        currentMinute: mockCurrentMinute.asReadonly(),
        isRunning: mockIsRunning.asReadonly(),
        isHalfTime: mockIsHalfTime.asReadonly()
      }
    );

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        TimerAdjustDialogComponent,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: GameTimerService, useValue: mockTimerService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimerAdjustDialogComponent);
    component = fixture.componentInstance;
  });

  // =============================================================================
  // 1. Component Creation Tests
  // =============================================================================

  describe('Component Creation', () => {
    it('should create successfully', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should receive dialog data with gameId', () => {
      fixture.detectChanges();
      expect(component.data).toEqual({ gameId: 'test-game-id' });
      expect(component.data.gameId).toBe('test-game-id');
    });

    it('should initialize newMinute with current minute', () => {
      mockCurrentMinute.set(25);
      const newComponent = new TimerAdjustDialogComponent(
        mockTimerService,
        mockDialogRef,
        mockDialogData
      );
      expect(newComponent.newMinute).toBe(25);
    });

    it('should have access to timerService', () => {
      fixture.detectChanges();
      expect(component.timerService).toBe(mockTimerService);
    });
  });

  // =============================================================================
  // 2. Timer Controls Tests
  // =============================================================================

  describe('Timer Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('Pause/Resume Button Display', () => {
      it('should show pause button when timer is running', () => {
        mockIsRunning.set(true);
        fixture.detectChanges();

        const pauseButton = fixture.debugElement.query(
          By.css('button[color="warn"]')
        );
        expect(pauseButton).toBeTruthy();
        expect(pauseButton.nativeElement.textContent.trim()).toContain('Pause Timer');
      });

      it('should show resume button when timer is paused', () => {
        mockIsRunning.set(false);
        fixture.detectChanges();

        const resumeButton = fixture.debugElement.query(
          By.css('button[color="primary"]')
        );
        expect(resumeButton).toBeTruthy();
        expect(resumeButton.nativeElement.textContent.trim()).toContain('Resume Timer');
      });

      it('should not show pause button when timer is paused', () => {
        mockIsRunning.set(false);
        fixture.detectChanges();

        const buttons = fixture.debugElement.queryAll(By.css('button'));
        const pauseButton = buttons.find(
          btn => btn.nativeElement.textContent.includes('Pause Timer')
        );
        expect(pauseButton).toBeFalsy();
      });

      it('should not show resume button when timer is running', () => {
        mockIsRunning.set(true);
        fixture.detectChanges();

        const buttons = fixture.debugElement.queryAll(By.css('button'));
        const resumeButton = buttons.find(
          btn => btn.nativeElement.textContent.includes('Resume Timer')
        );
        expect(resumeButton).toBeFalsy();
      });
    });

    describe('Pause Timer', () => {
      it('should call timerService.pauseTimer() on pause', () => {
        component.pause();
        expect(mockTimerService.pauseTimer).toHaveBeenCalled();
      });

      it('should call pauseTimer when pause button is clicked', () => {
        mockIsRunning.set(true);
        fixture.detectChanges();

        const pauseButton = fixture.debugElement.query(
          By.css('button[color="warn"]')
        );
        pauseButton.nativeElement.click();

        expect(mockTimerService.pauseTimer).toHaveBeenCalled();
      });
    });

    describe('Resume Timer', () => {
      it('should call timerService.resumeTimer() on resume', () => {
        component.resume();
        expect(mockTimerService.resumeTimer).toHaveBeenCalled();
      });

      it('should call resumeTimer when resume button is clicked', () => {
        mockIsRunning.set(false);
        fixture.detectChanges();

        const resumeButton = fixture.debugElement.query(
          By.css('button[color="primary"]')
        );
        resumeButton.nativeElement.click();

        expect(mockTimerService.resumeTimer).toHaveBeenCalled();
      });
    });

    describe('Set Minute', () => {
      it('should call timerService.setMinute() with value', () => {
        component.newMinute = 45;
        component.setMinute();

        expect(mockTimerService.setMinute).toHaveBeenCalledWith(45);
      });

      it('should validate minute range - accept valid value', () => {
        component.newMinute = 60;
        component.setMinute();

        expect(mockTimerService.setMinute).toHaveBeenCalledWith(60);
      });

      it('should validate minute range - reject negative value', () => {
        component.newMinute = -5;
        component.setMinute();

        expect(mockTimerService.setMinute).not.toHaveBeenCalled();
      });

      it('should validate minute range - reject value over 120', () => {
        component.newMinute = 125;
        component.setMinute();

        expect(mockTimerService.setMinute).not.toHaveBeenCalled();
      });

      it('should validate minute range - accept 0', () => {
        component.newMinute = 0;
        component.setMinute();

        expect(mockTimerService.setMinute).toHaveBeenCalledWith(0);
      });

      it('should validate minute range - accept 120', () => {
        component.newMinute = 120;
        component.setMinute();

        expect(mockTimerService.setMinute).toHaveBeenCalledWith(120);
      });

      it('should call setMinute when Set Minute button is clicked', () => {
        component.newMinute = 30;
        fixture.detectChanges();

        const buttons = fixture.debugElement.queryAll(By.css('button'));
        const setMinuteButton = buttons.find(
          btn => btn.nativeElement.textContent.includes('Set Minute')
        );

        expect(setMinuteButton).toBeTruthy();
        setMinuteButton!.nativeElement.click();

        expect(mockTimerService.setMinute).toHaveBeenCalledWith(30);
      });
    });

    describe('Stop Timer', () => {
      it('should call timerService.stopTimer() on stop', () => {
        component.stop();
        expect(mockTimerService.stopTimer).toHaveBeenCalled();
      });

      it('should close dialog after stop', () => {
        component.stop();
        expect(mockDialogRef.close).toHaveBeenCalled();
      });

      it('should call both stopTimer and close in correct order', () => {
        const callOrder: string[] = [];

        mockTimerService.stopTimer.and.callFake(async () => {
          callOrder.push('stopTimer');
        });

        mockDialogRef.close.and.callFake(() => {
          callOrder.push('close');
        });

        component.stop();

        expect(callOrder).toEqual(['stopTimer', 'close']);
      });

      it('should call stop when Stop Timer button is clicked', () => {
        spyOn(component, 'stop');
        fixture.detectChanges();

        const buttons = fixture.debugElement.queryAll(By.css('button'));
        const stopButton = buttons.find(
          btn => btn.nativeElement.textContent.includes('Stop Timer') &&
                 !btn.nativeElement.textContent.includes('Pause')
        );

        expect(stopButton).toBeTruthy();
        stopButton!.nativeElement.click();

        expect(component.stop).toHaveBeenCalled();
      });
    });
  });

  // =============================================================================
  // 3. Minute Input Tests
  // =============================================================================

  describe('Minute Input', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize with current minute', () => {
      mockCurrentMinute.set(35);
      const newComponent = new TimerAdjustDialogComponent(
        mockTimerService,
        mockDialogRef,
        mockDialogData
      );
      expect(newComponent.newMinute).toBe(35);
    });

    it('should have input field with min attribute of 0', () => {
      const input = fixture.debugElement.query(By.css('input[type="number"]'));
      expect(input.nativeElement.getAttribute('min')).toBe('0');
    });

    it('should have input field with max attribute of 120', () => {
      const input = fixture.debugElement.query(By.css('input[type="number"]'));
      expect(input.nativeElement.getAttribute('max')).toBe('120');
    });

    it('should update newMinute when input changes', async () => {
      const input = fixture.debugElement.query(By.css('input[type="number"]'));
      const inputElement = input.nativeElement as HTMLInputElement;

      inputElement.value = '75';
      inputElement.dispatchEvent(new Event('input'));
      inputElement.dispatchEvent(new Event('change'));

      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.newMinute).toBe(75);
    });

    it('should bind newMinute to input value', () => {
      component.newMinute = 42;
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input[type="number"]'));
      expect(input.nativeElement.value).toBe('42');
    });

    it('should have mat-label for input', () => {
      const label = fixture.debugElement.query(By.css('mat-label'));
      expect(label).toBeTruthy();
      expect(label.nativeElement.textContent.trim()).toBe('Set Minute');
    });

    it('should have outlined appearance for form field', () => {
      const formField = fixture.debugElement.query(By.css('mat-form-field'));
      expect(formField.nativeElement.getAttribute('appearance')).toBe('outline');
    });
  });

  // =============================================================================
  // 4. Display Tests
  // =============================================================================

  describe('Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display current minute', () => {
      mockCurrentMinute.set(28);
      fixture.detectChanges();

      const content = fixture.debugElement.nativeElement.textContent;
      expect(content).toContain("28'");
    });

    it('should display "Running" status when timer is running', () => {
      mockIsRunning.set(true);
      fixture.detectChanges();

      const content = fixture.debugElement.nativeElement.textContent;
      expect(content).toContain('Status: Running');
    });

    it('should display "Paused" status when timer is paused', () => {
      mockIsRunning.set(false);
      fixture.detectChanges();

      const content = fixture.debugElement.nativeElement.textContent;
      expect(content).toContain('Status: Paused');
    });

    it('should update displayed minute when signal changes', () => {
      mockCurrentMinute.set(15);
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.textContent).toContain("15'");

      mockCurrentMinute.set(20);
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.textContent).toContain("20'");
    });

    it('should update status display when isRunning changes', () => {
      mockIsRunning.set(true);
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.textContent).toContain('Running');

      mockIsRunning.set(false);
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.textContent).toContain('Paused');
    });

    it('should have dialog title', () => {
      const title = fixture.debugElement.query(By.css('h2[mat-dialog-title]'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Timer Controls');
    });

    it('should have Close button in dialog actions', () => {
      const closeButton = fixture.debugElement.query(By.css('button[mat-dialog-close]'));
      expect(closeButton).toBeTruthy();
      expect(closeButton.nativeElement.textContent.trim()).toBe('Close');
    });

    it('should display timer status section', () => {
      const timerStatus = fixture.debugElement.query(By.css('.timer-status'));
      expect(timerStatus).toBeTruthy();
    });

    it('should display controls section', () => {
      const controls = fixture.debugElement.query(By.css('.controls'));
      expect(controls).toBeTruthy();
    });
  });

  // =============================================================================
  // 5. Dialog Integration Tests
  // =============================================================================

  describe('Dialog Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have mat-dialog-content', () => {
      const dialogContent = fixture.debugElement.query(By.css('mat-dialog-content'));
      expect(dialogContent).toBeTruthy();
    });

    it('should have mat-dialog-actions', () => {
      const dialogActions = fixture.debugElement.query(By.css('mat-dialog-actions'));
      expect(dialogActions).toBeTruthy();
    });

    it('should align dialog actions to end', () => {
      const dialogActions = fixture.debugElement.query(By.css('mat-dialog-actions'));
      expect(dialogActions.nativeElement.getAttribute('align')).toBe('end');
    });

    it('should close dialog when Close button is clicked', () => {
      const closeButton = fixture.debugElement.query(By.css('button[mat-dialog-close]'));
      closeButton.nativeElement.click();

      // mat-dialog-close directive handles closing automatically
      expect(closeButton.nativeElement.hasAttribute('mat-dialog-close')).toBe(true);
    });
  });

  // =============================================================================
  // 6. Button Styling Tests
  // =============================================================================

  describe('Button Styling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have raised buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button[mat-raised-button]'));
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have warn color on pause button', () => {
      mockIsRunning.set(true);
      fixture.detectChanges();

      const pauseButton = fixture.debugElement.query(
        By.css('button[color="warn"]')
      );
      expect(pauseButton).toBeTruthy();
    });

    it('should have primary color on resume button', () => {
      mockIsRunning.set(false);
      fixture.detectChanges();

      const resumeButton = fixture.debugElement.query(
        By.css('button[color="primary"]')
      );
      expect(resumeButton).toBeTruthy();
    });

    it('should have warn color on stop button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button[color="warn"]'));
      const stopButton = buttons.find(
        btn => btn.nativeElement.textContent.includes('Stop Timer')
      );
      expect(stopButton).toBeTruthy();
    });
  });

  // =============================================================================
  // 7. Edge Cases and Validation Tests
  // =============================================================================

  describe('Edge Cases and Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle boundary value 0 correctly', () => {
      component.newMinute = 0;
      component.setMinute();
      expect(mockTimerService.setMinute).toHaveBeenCalledWith(0);
    });

    it('should handle boundary value 120 correctly', () => {
      component.newMinute = 120;
      component.setMinute();
      expect(mockTimerService.setMinute).toHaveBeenCalledWith(120);
    });

    it('should not call setMinute for value just below 0', () => {
      component.newMinute = -1;
      component.setMinute();
      expect(mockTimerService.setMinute).not.toHaveBeenCalled();
    });

    it('should not call setMinute for value just above 120', () => {
      component.newMinute = 121;
      component.setMinute();
      expect(mockTimerService.setMinute).not.toHaveBeenCalled();
    });

    it('should handle multiple pause calls', () => {
      component.pause();
      component.pause();
      expect(mockTimerService.pauseTimer).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple resume calls', () => {
      component.resume();
      component.resume();
      expect(mockTimerService.resumeTimer).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid setMinute calls', () => {
      component.newMinute = 10;
      component.setMinute();
      component.newMinute = 20;
      component.setMinute();
      component.newMinute = 30;
      component.setMinute();

      expect(mockTimerService.setMinute).toHaveBeenCalledTimes(3);
      expect(mockTimerService.setMinute).toHaveBeenCalledWith(10);
      expect(mockTimerService.setMinute).toHaveBeenCalledWith(20);
      expect(mockTimerService.setMinute).toHaveBeenCalledWith(30);
    });
  });

  // =============================================================================
  // 8. Service Method Call Tests
  // =============================================================================

  describe('Service Method Call Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should only call pauseTimer from pause method', () => {
      component.pause();
      expect(mockTimerService.pauseTimer).toHaveBeenCalled();
      expect(mockTimerService.resumeTimer).not.toHaveBeenCalled();
      expect(mockTimerService.setMinute).not.toHaveBeenCalled();
      expect(mockTimerService.stopTimer).not.toHaveBeenCalled();
    });

    it('should only call resumeTimer from resume method', () => {
      component.resume();
      expect(mockTimerService.resumeTimer).toHaveBeenCalled();
      expect(mockTimerService.pauseTimer).not.toHaveBeenCalled();
      expect(mockTimerService.setMinute).not.toHaveBeenCalled();
      expect(mockTimerService.stopTimer).not.toHaveBeenCalled();
    });

    it('should only call setMinute from setMinute method', () => {
      component.newMinute = 50;
      component.setMinute();
      expect(mockTimerService.setMinute).toHaveBeenCalled();
      expect(mockTimerService.pauseTimer).not.toHaveBeenCalled();
      expect(mockTimerService.resumeTimer).not.toHaveBeenCalled();
      expect(mockTimerService.stopTimer).not.toHaveBeenCalled();
    });

    it('should call stopTimer and close from stop method', () => {
      component.stop();
      expect(mockTimerService.stopTimer).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockTimerService.pauseTimer).not.toHaveBeenCalled();
      expect(mockTimerService.resumeTimer).not.toHaveBeenCalled();
    });
  });
});
