import { Component, Input, OnInit, ViewChildren, HostListener } from '@angular/core';
import { ChatAdapter } from './core/chat-adapter';
import { DemoAdapter } from './core/demo-adapter';
import { User } from "./core/user";
import { Message } from "./core/message";
import { Window } from "./core/window";

@Component({
    selector: 'ng4-chat',
    templateUrl: 'ng4-chat.component.html',
    styleUrls: ['ng4-chat.component.css']
})

export class NgChat implements OnInit {
    constructor() { }

    @Input()
    public title: string = "Friends";

    @Input()
    public adapter: ChatAdapter = new DemoAdapter(); // TODO: Remove this, testing purposes only

    @Input()
    public userId: any = 123; // The user id that is using the chat instance

    @Input()
    public messagePlaceholder: string = "Type a message";

    public isCollapsed: boolean = false;

    private searchInput: string = "";

    private users: User[];

    get filteredUsers(): User[]
    {
        if (this.searchInput.length > 0){
            // Searches in the friend list by the inputted search string
            return this.users.filter(x => x.displayName.toUpperCase().includes(this.searchInput.toUpperCase()));
        }

        return this.users;
    }

    // Defines the size of each opened window to calculate how many windows can be opened on the viewport at the same time.
    private windowSizeFactor: number = 320;

    // Total width size of the friends list section
    private friendsListWidth: number = 262;

    // Available area to render the plugin
    private viewPortTotalArea: number = window.innerWidth;

    private windows: Window[] = [];

    @ViewChildren('chatMessages') chatMessageClusters: any;

    ngOnInit() { 
        this.bootstrapChat();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any){
       this.viewPortTotalArea = event.target.innerWidth;

       this.NormalizeWindows();
    }

    // Checks if there are more opened windows than the view port can display
    private NormalizeWindows(): void
    {
        let maxSupportedOpenedWindows = Math.floor(this.viewPortTotalArea / this.windowSizeFactor);
        let difference = this.windows.length - maxSupportedOpenedWindows;

        if (difference >= 0){
            this.windows.splice(this.windows.length - 1 - difference);
        }
    }

    // Initializes the chat plugin and the messaging adapter
    private bootstrapChat(): void
    {
        if (this.adapter != null)
        {
            // Binding event listeners
            this.adapter.onMessageReceived((msg) => this.onMessageReceived(msg));

            // Loading current users list
            this.users = this.adapter.listFriends();
        }
    }

    // Handles received messages by the adapter
    private onMessageReceived(message: Message)
    {
        let chatWindow = this.windows.find(x => x.chattingTo.id == message.fromId);

        if (chatWindow){
            chatWindow.messages.push(message);

            this.scrollChatWindowToBottom(chatWindow);
        }
    }

    // Opens a new chat whindow. Takes care of available viewport
    private openChatWindow(user: User): void
    {
        // Is this window opened?
        if (this.windows.findIndex(x => x.chattingTo.id == user.id) < 0)
        {
            let history = this.adapter.getMessageHistory(); // TODO Should this be a promise?

            if (history == null)
                history = [];

            let newChatWindow: Window = {
                chattingTo: user,
                messages:  history
            };

            this.windows.unshift(newChatWindow);

            // Is there enough space left in the view port ?
            if (this.windows.length * this.windowSizeFactor >= this.viewPortTotalArea - this.friendsListWidth){                
                this.windows.pop();
            }
        }
    }

    // Monitors pressed keys on a chat window and dispatch a message when the enter key is typed
    protected onChatInputTyped(event: any, window: Window): void
    {
        if (event.keyCode == 13)
        {
            let message = new Message();
             
            message.fromId = this.userId;
            message.toId = window.chattingTo.id;
            message.message = window.newMessage;

            window.messages.push(message);

            this.adapter.sendMessage(message);

            window.newMessage = ""; // Resets the new message input

            this.scrollChatWindowToBottom(window);
        }
    }

    // Closes a chat window via the close 'X' button
    protected onCloseChatWindow(window: Window): void 
    {
        let index = this.windows.indexOf(window);

        this.windows.splice(index, 1);
    }

    // Toggle friends list visibility
    protected onChatTitleClicked(event: any): void
    {
        this.isCollapsed = !this.isCollapsed;
    }

    // Asserts if a user avatar is visible in a chat cluster
    protected isAvatarVisible(window: Window, message: Message, index: number): boolean
    {
        if (message.fromId != this.userId){
            if (index == 0){
                return true; // First message, good to show the thumbnail
            }
            else{
                // Check if the previous message belongs to the same user, if it belongs there is no need to show the avatar again to form the message cluster
                if (window.messages[index - 1].fromId != message.fromId){
                    return true;
                }
            }
        }

        return false;
    }

    // Scrolls a chat window message flow to the bottom
    private scrollChatWindowToBottom(window: Window): void
    {
        let windowIndex = this.windows.indexOf(window);

        setTimeout(() => {
            this.chatMessageClusters.toArray()[windowIndex].nativeElement.scrollTop = this.chatMessageClusters.toArray()[windowIndex].nativeElement.scrollHeight;
        }); 
    }
}