import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '../../services/api.service';
import { RebootTask } from '../../models/reboot-task.model';
import { TaskModalComponent } from './task-modal/task-modal.component';
import { TaskListModalComponent } from './task-list-modal/task-list-modal.component';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-scheduler',
  imports: [
    CommonModule,
    FormsModule,
    NzCalendarModule,
    NzBadgeModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
  ],
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchedulerComponent {
  private readonly apiService = inject(ApiService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);

  protected readonly selectedDate = signal(new Date());
  protected readonly tasksResource = rxResource({
    stream: () => this.apiService.getRebootTasks()
  });

  private readonly tasksByDate = computed(() => {
    const taskMap = new Map<string, RebootTask[]>();
    const tasks = this.tasksResource.value() ?? [];

    tasks.forEach(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      const dateKey = taskDate.toISOString();

      if (!taskMap.has(dateKey)) {
        taskMap.set(dateKey, []);
      }
      taskMap.get(dateKey)!.push(task);
    });

    return taskMap;
  });

  private reloadTasks(): void {
    this.tasksResource.reload();
  }

  getTasksForDate(date: Date): RebootTask[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const dateKey = targetDate.toISOString();

    return this.tasksByDate().get(dateKey) ?? [];
  }

  openCreateTaskModal(date: Date): void {
    const modalRef = this.modal.create({
      nzTitle: 'Create Reboot Task',
      nzContent: TaskModalComponent,
      nzData: {
        date: date,
        mode: 'create'
      },
      nzWidth: '600px',
      nzFooter: null
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) {
        this.reloadTasks();
        this.message.success('Task created successfully');
      }
    });
  }

  openEditTaskModal(task: RebootTask): void {
    const modalRef = this.modal.create({
      nzTitle: 'Edit Task',
      nzContent: TaskModalComponent,
      nzData: {
        task: task,
        mode: 'edit'
      },
      nzWidth: '600px',
      nzFooter: null
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) {
        this.reloadTasks();
        if (result.action === 'update') {
          this.message.success('Task updated successfully');
        } else if (result.action === 'delete') {
          this.message.success('Task deleted successfully');
        }
      }
    });
  }

  showTaskSelectionModal(tasks: RebootTask[], date: Date): void {
    const modalRef = this.modal.create({
      nzTitle: 'Tasks for Day',
      nzContent: TaskListModalComponent,
      nzData: {
        tasks: tasks,
        date: date
      },
      nzWidth: '600px',
      nzFooter: null
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) {
        if (result.action === 'create') {
          this.openCreateTaskModal(date);
        } else if (result.action === 'edit' && result.task) {
          this.openEditTaskModal(result.task);
        }
      }
    });
  }

  onTaskClick(event: Event, task: RebootTask): void {
    event.stopPropagation();
    this.openEditTaskModal(task);
  }

  onCalendarClick(event: PointerEvent): void {
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const cell = target.closest('.ant-picker-cell');
    if (!cell || !cell.classList.contains('ant-picker-cell-in-view')) {
      return;
    }

    const tasksForDate = this.getTasksForDate(this.selectedDate());

    tasksForDate.length
      ? this.openCreateTaskModal(this.selectedDate())
      : this.showTaskSelectionModal(tasksForDate, this.selectedDate());
  }
}
