import { Component, OnInit } from '@angular/core';
import { MessageService, MessageTypes } from '../message.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  MessageTypes = MessageTypes;

  constructor(public messageService: MessageService) {
  }

  ngOnInit() {
  }

}
