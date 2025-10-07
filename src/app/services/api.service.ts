import { inject, Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { BdService } from './bd.service';
import { Server } from '../models/server.model';
import { RebootTask, CreateRebootTaskDto } from '../models/reboot-task.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly bdService = inject(BdService);
  private readonly API_DELAY = 300;

  getServers(): Observable<Server[]> {
    return of(this.bdService.getServers()).pipe(delay(this.API_DELAY));
  }

  getRebootTasks(): Observable<RebootTask[]> {
    return of(this.bdService.getRebootTasks()).pipe(delay(this.API_DELAY));
  }

  createRebootTask(dto: CreateRebootTaskDto): Observable<RebootTask> {
    try {
      const task = this.bdService.createRebootTask(dto);
      return of(task).pipe(delay(this.API_DELAY));
    } catch (error: unknown) {
      return throwError(() => error instanceof Error ? error : new Error('Unknown error occurred')).pipe(delay(this.API_DELAY));
    }
  }

  updateRebootTask(id: string, dto: Partial<CreateRebootTaskDto>): Observable<RebootTask> {
    try {
      const task = this.bdService.updateRebootTask(id, dto);
      return of(task).pipe(delay(this.API_DELAY));
    } catch (error: unknown) {
      return throwError(() => error instanceof Error ? error : new Error('Unknown error occurred')).pipe(delay(this.API_DELAY));
    }
  }

  deleteRebootTask(id: string): Observable<boolean> {
    const result = this.bdService.deleteRebootTask(id);
    if (!result) {
      return throwError(() => new Error('Reboot task not found')).pipe(delay(this.API_DELAY));
    }
    return of(result).pipe(delay(this.API_DELAY));
  }
}
