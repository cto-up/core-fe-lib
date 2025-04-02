export enum EventType {
  INFO = 'INFO',
  MSG = 'MSG',
  ERROR = 'ERROR',
}

export interface ReceivedEvent {
  eventType: EventType;
  message: string;
}

export interface ReceivedProgressEvent extends ReceivedEvent {
  progress: number;
}

//   const rawData = "event:message\ndata:{\"eventType\":\"INFO\",\"message\":\"File received\",\"progress\":10}\n";
export function ExtractJSONObject(rawData: string): ReceivedProgressEvent[] {
  // Step 1: Split the string into lines
  const lines = rawData.split(/[\n\r]/g);

  // Step 2: Identify the JSON data line
  const eventArray = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => JSON.parse(line.replace('data:', '')));
  if (eventArray.length <= 0) {
    throw new Error('Unable to locate JSON data.');
  }

  return eventArray;
}
