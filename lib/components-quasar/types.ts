export interface Option {
  value: string | number; // Adjust as per your options structure
}
export interface DraggableEvent {
  oldDraggableIndex: number;
  newDraggableIndex: number;
}
export interface ErrorMessage {
  $message: string;
}
