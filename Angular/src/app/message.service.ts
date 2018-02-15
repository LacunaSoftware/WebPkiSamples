import { Injectable } from '@angular/core';

@Injectable()
export class MessageService {

  messages: Message[] = [];

  add(message: string, type: MessageTypes = MessageTypes.Information) {
    this.messages.push({
      text: message,
      type: type
    });
  }

  clear() {
    this.messages = [];
  }
}

export enum MessageTypes {
  Information,
  Success,
  Warning,
  Error,
}

export class Message {
  text: string;
  type: MessageTypes;
}
