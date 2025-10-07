import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SchedulerComponent } from './components/scheduler/scheduler.component';

@Component({
  selector: 'app-root',
  imports: [SchedulerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
}
