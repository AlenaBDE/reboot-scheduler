import { Injectable } from '@angular/core';
import { Server } from '../models/server.model';
import { RebootTask, CreateRebootTaskDto } from '../models/reboot-task.model';

@Injectable({
  providedIn: 'root'
})
export class BdService {
  private readonly STORAGE_KEY_TASKS = 'rebootTasks';
  private readonly STORAGE_KEY_COUNTER = 'taskIdCounter';

  private readonly defaultServers: Server[] = [
    { id: '1', name: 'Production Server 1', ipAddress: '192.168.1.10', status: 'online' },
    { id: '2', name: 'Production Server 2', ipAddress: '192.168.1.11', status: 'online' },
    { id: '3', name: 'Development Server 1', ipAddress: '192.168.2.10', status: 'online' },
    { id: '4', name: 'Development Server 2', ipAddress: '192.168.2.11', status: 'offline' },
    { id: '5', name: 'Testing Server 1', ipAddress: '192.168.3.10', status: 'online' },
    { id: '6', name: 'Testing Server 2', ipAddress: '192.168.3.11', status: 'maintenance' },
    { id: '7', name: 'Staging Server 1', ipAddress: '192.168.4.10', status: 'online' },
    { id: '8', name: 'Staging Server 2', ipAddress: '192.168.4.11', status: 'online' },
    { id: '9', name: 'Database Server 1', ipAddress: '192.168.5.10', status: 'online' },
    { id: '10', name: 'Database Server 2', ipAddress: '192.168.5.11', status: 'online' },
  ];

  private servers: Server[] = [...this.defaultServers];
  private rebootTasks: RebootTask[] = [];
  private taskIdCounter = 1;

  constructor() {
    this.loadFromLocalStorage();
    this.initializeMockTasks();
  }

  private initializeMockTasks(): void {
    if (this.rebootTasks.length > 0) {
      return;
    }

    const now = new Date();
    const mockTasks: RebootTask[] = [];

    const tasksData = [
      { daysAgo: 14, time: '02:00', serverId: '1' },
      { daysAgo: 13, time: '03:30', serverId: '3' },
      { daysAgo: 11, time: '01:00', serverId: '5' },
      { daysAgo: 10, time: '04:15', serverId: '7' },
      { daysAgo: 9, time: '02:30', serverId: '9' },
      { daysAgo: 7, time: '03:00', serverId: '2' },
      { daysAgo: 5, time: '01:30', serverId: '4' },
      { daysAgo: 3, time: '02:45', serverId: '6' },
      { daysAgo: 2, time: '04:00', serverId: '8' },
      { daysAgo: 1, time: '03:15', serverId: '10' },
    ];

    tasksData.forEach((data, index) => {
      const taskDate = new Date(now);
      taskDate.setDate(taskDate.getDate() - data.daysAgo);
      taskDate.setHours(0, 0, 0, 0);

      const server = this.getServerById(data.serverId);
      if (server) {
        const task: RebootTask = {
          id: String(this.taskIdCounter++),
          serverId: data.serverId,
          serverName: server.name,
          date: taskDate,
          time: data.time,
          status: 'completed',
        };
        mockTasks.push(task);
      }
    });

    this.rebootTasks = mockTasks;
    this.saveToLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const storedTasks = localStorage.getItem(this.STORAGE_KEY_TASKS);
      const storedCounter = localStorage.getItem(this.STORAGE_KEY_COUNTER);

      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        this.rebootTasks = tasks.map((task: RebootTask) => ({
          ...task,
          date: new Date(task.date),
          status: task.status || 'pending' // Backward compatibility
        }));
      }

      if (storedCounter) {
        this.taskIdCounter = parseInt(storedCounter, 10);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      this.rebootTasks = [];
      this.taskIdCounter = 1;
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_TASKS, JSON.stringify(this.rebootTasks));
      localStorage.setItem(this.STORAGE_KEY_COUNTER, String(this.taskIdCounter));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }

  getServers(): Server[] {
    return [...this.servers];
  }

  getServerById(id: string): Server | undefined {
    return this.servers.find(server => server.id === id);
  }

  getRebootTasks(): RebootTask[] {
    this.checkAndCompleteExpiredTasks();
    return [...this.rebootTasks];
  }

  private checkAndCompleteExpiredTasks(): void {
    const now = new Date();
    let hasChanges = false;

    this.rebootTasks.forEach(task => {
      if (task.status === 'pending') {
        const taskDateTime = new Date(task.date);
        const [hours, minutes] = task.time.split(':');
        taskDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (taskDateTime <= now) {
          task.status = 'completed';
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      this.saveToLocalStorage();
    }
  }

  createRebootTask(dto: CreateRebootTaskDto): RebootTask {
    const server = this.getServerById(dto.serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    const newTask: RebootTask = {
      id: String(this.taskIdCounter++),
      serverId: dto.serverId,
      serverName: server.name,
      date: dto.date,
      time: dto.time,
      status: 'pending',
    };

    this.rebootTasks.push(newTask);
    this.saveToLocalStorage();
    return { ...newTask };
  }

  updateRebootTask(id: string, dto: Partial<CreateRebootTaskDto>): RebootTask {
    const taskIndex = this.rebootTasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      throw new Error('Reboot task not found');
    }

    const task = this.rebootTasks[taskIndex];

    if (dto.serverId) {
      const server = this.getServerById(dto.serverId);
      if (!server) {
        throw new Error('Server not found');
      }
      task.serverId = dto.serverId;
      task.serverName = server.name;
    }

    if (dto.date) {
      task.date = dto.date;
    }

    if (dto.time) {
      task.time = dto.time;
    }

    this.saveToLocalStorage();
    return { ...task };
  }

  deleteRebootTask(id: string): boolean {
    const taskIndex = this.rebootTasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return false;
    }

    const task = this.rebootTasks[taskIndex];

    if (task.status === 'completed') {
      throw new Error('Cannot delete completed tasks');
    }

    this.rebootTasks.splice(taskIndex, 1);
    this.saveToLocalStorage();
    return true;
  }
}
