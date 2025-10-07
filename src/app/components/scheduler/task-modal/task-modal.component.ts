import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { ApiService } from '../../../services/api.service';
import { CreateRebootTaskDto, ModalData } from '../../../models/reboot-task.model';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-task-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzSpinModule,
    NzIconModule,
    NzPopconfirmModule,
    NzBadgeModule,
    NzAlertModule
  ],
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskModalComponent {
  private readonly modal = inject(NzModalRef);
  readonly nzModalData: ModalData = inject(NZ_MODAL_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);

  protected readonly form: FormGroup;
  protected readonly submitting = signal(false);
  protected readonly mode = signal<'create' | 'edit'>('create');
  protected readonly isTaskCompleted = signal(false);

  protected readonly serversResource = rxResource({
    stream: () => this.apiService.getServers()
  });

  constructor() {
    this.form = this.fb.group({
      serverId: ['', [Validators.required]],
      date: [null, [Validators.required]],
      time: [null, [Validators.required]]
    }, {validators: this.dateTimeValidator()});

    this.mode.set(this.nzModalData.mode);

    if (this.nzModalData.mode === 'edit' && this.nzModalData.task) {
      const task = this.nzModalData.task;

      this.isTaskCompleted.set(task.status === 'completed');

      const [hours, minutes] = task.time.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      this.form.patchValue({
        serverId: task.serverId,
        date: new Date(task.date),
        time: timeDate
      });

      if (task.status === 'completed') {
        this.form.disable();
      }
    } else if (this.nzModalData.date) {
      this.form.patchValue({
        date: this.nzModalData.date
      });
    }
  }

  private dateTimeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const dateControl = control.get('date');
      const timeControl = control.get('time');

      if (!dateControl?.value || !timeControl?.value) {
        return null;
      }

      const selectedDate = new Date(dateControl.value);
      const selectedTime = new Date(timeControl.value);

      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

      const now = new Date();

      if (combinedDateTime <= now) {
        return {pastDateTime: true};
      }

      return null;
    };
  }


  onSubmit(): void {
    if (this.form.valid) {
      this.submitting.set(true);

      const formValue = this.form.value;
      const date = new Date(formValue.date);

      const timeDate = new Date(formValue.time);
      const hours = String(timeDate.getHours()).padStart(2, '0');
      const minutes = String(timeDate.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      const dto: CreateRebootTaskDto = {
        serverId: formValue.serverId,
        date: date,
        time: timeString
      };

      if (this.mode() === 'create') {
        this.apiService.createRebootTask(dto)
          .pipe(
            catchError((error) => {
              console.error('Error creating task:', error);
              return of(error);
            }),
            finalize(() => this.submitting.set(false))
          ).subscribe(() => {
          this.modal.close({action: 'create', success: true});
        });
      } else {
        this.apiService.updateRebootTask(this.nzModalData.task!.id, dto).subscribe({
          next: () => {
            this.submitting.set(false);
            this.modal.close({action: 'update', success: true});
          },
          error: (error) => {
            console.error('Error updating task:', error);
            this.submitting.set(false);
          }
        });
      }
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({onlySelf: true});
        }
      });
    }
  }

  onDelete(): void {
    if (this.nzModalData.task) {
      this.submitting.set(true);
      this.apiService.deleteRebootTask(this.nzModalData.task.id).subscribe({
        next: () => {
          this.submitting.set(false);
          this.modal.close({action: 'delete', success: true});
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.submitting.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.modal.close();
  }
}
