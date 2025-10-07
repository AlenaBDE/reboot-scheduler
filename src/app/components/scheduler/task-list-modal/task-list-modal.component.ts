import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { RebootTask } from '../../../models/reboot-task.model';

interface ModalData {
  tasks: RebootTask[];
  date: Date;
}

@Component({
  selector: 'app-task-list-modal',
  imports: [
    CommonModule,
    NzListModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzDividerModule,
    NzTagModule
  ],
  templateUrl: './task-list-modal.component.html',
  styleUrls: ['./task-list-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListModalComponent {
  private readonly modal = inject(NzModalRef);
  readonly nzModalData: ModalData = inject(NZ_MODAL_DATA);

  onTaskSelect(task: RebootTask): void {
    if (task.status === 'completed') {
      return;
    }
    this.modal.close({ action: 'edit', task });
  }

  onCreateNew(): void {
    this.modal.close({ action: 'create' });
  }

  onCancel(): void {
    this.modal.close();
  }
}
