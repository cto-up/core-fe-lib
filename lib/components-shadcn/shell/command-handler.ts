// Moved from: src/handlers/CommandHandler.ts

export interface Command {
  key: string;
  entity: string;
  entityId?: string;
  temporary?: boolean;
  cmd: string;
  content: unknown;
}

export interface PostAction {
  action: "OK" | "OK_MAP_TEMP" | "KO" | "KO_CLEAR_TEMP";
  key?: string;
  entityId?: string;
}

export interface CommandHandler {
  /** Determines whether this handler can handle the given command */
  canHandle(command: Command): boolean;

  /** Executes the command */
  execute(command: Command): Promise<PostAction | undefined>;
}
