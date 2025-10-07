export type TaskStatus = 'pending' | 'completed';

export interface RebootTask {
  id: string;
  serverId: string;
  serverName: string;
  date: Date;
  time: string;
  status: TaskStatus;
}

export interface CreateRebootTaskDto {
  serverId: string;
  date: Date;
  time: string;
}

export interface ModalData {
  date?: Date;
  task?: RebootTask;
  mode: 'create' | 'edit';
}
