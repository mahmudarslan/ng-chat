import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';

import { Localization } from '../../core/localization';
import { IChatOption } from '../../core/chat-option';
import { ChatParticipantStatus } from "../../core/chat-participant-status.enum";
import { IChatParticipant } from "../../core/chat-participant";
import { User } from "../../core/user";
import { Window } from "../../core/window";
import { ParticipantResponse } from "../../core/participant-response";

@Component({
    selector: 'ng-chat-friends-list',
    templateUrl: './ng-chat-friends-list.component.html',
    styleUrls: ['./ng-chat-friends-list.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class NgChatFriendsList implements OnChanges {
    constructor() { }

    @Input()
    public participants: IChatParticipant[];

    @Input()
    public participantsResponse: ParticipantResponse[];

    @Input()
    public windows: Window[];

    @Input()
    public userId: any;

    @Input()
    public localization: Localization;

    @Input()
    public shouldDisplay: boolean;

    @Input()
    public isCollapsed: boolean;

    @Input()
    public searchEnabled: boolean;

    @Input()
    public persistWindowsState: boolean;

    @Input()
    public currentActiveOption: IChatOption | null;

    @Output()
    public onParticipantClicked: EventEmitter<IChatParticipant> = new EventEmitter();

    @Output()
    public onOptionPromptCanceled: EventEmitter<any> = new EventEmitter();

    @Output()
    public onOptionPromptConfirmed: EventEmitter<any> = new EventEmitter();

    public selectedUsersFromFriendsList: User[] = [];

    public searchInput: string = '';

    // Exposes enums for the ng-template
    public ChatParticipantStatus = ChatParticipantStatus;

    private participantsInteractedWith: IChatParticipant[] = [];

    ngOnChanges(changes: SimpleChanges) {
        if (this.currentActiveOption) {
            const currentOptionTriggeredBy = this.currentActiveOption && this.currentActiveOption.chattingTo.participant.id;
            const isActivatedUserInSelectedList = (this.selectedUsersFromFriendsList.filter(item => item.id == currentOptionTriggeredBy)).length > 0;

            if (!isActivatedUserInSelectedList) {
                this.selectedUsersFromFriendsList = this.selectedUsersFromFriendsList.concat(this.currentActiveOption.chattingTo.participant as User);
            }
        }
    }

    get filteredParticipants(): IChatParticipant[]
    {
        if (this.searchInput.length > 0){
            // Searches in the friend list by the inputted search string
            return this.participants.filter(x => x.displayName.toUpperCase().includes(this.searchInput.toUpperCase()));
        }

        return this.participants;
    }

    isUserSelectedFromFriendsList(user: User) : boolean
    {
        return (this.selectedUsersFromFriendsList.filter(item => item.id == user.id)).length > 0
    }

    // [Localized] Returns the status descriptive title
    // TODO: this is duplicated, find a way to reuse it
    getStatusTitle(status: ChatParticipantStatus) : any
    {
        let currentStatus = status.toString().toLowerCase();

        return this.localization.statusDescription[currentStatus];
    }

    // TODO: this is duplicated, find a way to reuse it
    private formatUnreadMessagesTotal(totalUnreadMessages: number): string
    {
        if (totalUnreadMessages > 0){

            if (totalUnreadMessages > 99) 
                return  "99+";
            else
                return String(totalUnreadMessages); 
        }

        // Empty fallback.
        return "";
    }

    // TODO: this is duplicated, find a way to reuse it
    // Returns the total unread messages from a chat window. TODO: Could use some Angular pipes in the future 
    unreadMessagesTotal(window: Window): string
    {
        let totalUnreadMessages = 0;

        if (window){
            totalUnreadMessages = window.messages.filter(x => x.fromId != this.userId && !x.dateSeen).length;
        }
            
        return this.formatUnreadMessagesTotal(totalUnreadMessages);
    }

    unreadMessagesTotalByParticipant(participant: IChatParticipant): string
    {
        let openedWindow = this.windows.find(x => x.participant.id == participant.id);

        if (openedWindow){
            return this.unreadMessagesTotal(openedWindow);
        }
        else
        {
            let totalUnreadMessages = this.participantsResponse
                .filter(x => x.participant.id == participant.id && !this.participantsInteractedWith.find(u => u.id == participant.id) && x.metadata && x.metadata.totalUnreadMessages > 0)
                .map((participantResponse) => {
                    return participantResponse.metadata.totalUnreadMessages
                })[0];

            return this.formatUnreadMessagesTotal(totalUnreadMessages);
        }
    }

    cleanUpUserSelection = () => this.selectedUsersFromFriendsList = [];

    // Toggle friends list visibility
    onChatTitleClicked(): void
    {
        this.isCollapsed = !this.isCollapsed;
    }

    onFriendsListCheckboxChange(selectedUser: User, isChecked: boolean): void
    {
        if(isChecked) {
            this.selectedUsersFromFriendsList.push(selectedUser);
        } 
        else 
        {
            this.selectedUsersFromFriendsList.splice(this.selectedUsersFromFriendsList.indexOf(selectedUser), 1);
        }
    }

    onUserClick(clickedUser: User): void
    {
        this.onParticipantClicked.emit(clickedUser);
    }

    onFriendsListActionCancelClicked(): void
    {
        this.onOptionPromptCanceled.emit();
        this.cleanUpUserSelection();
    }

    onFriendsListActionConfirmClicked() : void
    {
        this.onOptionPromptConfirmed.emit(this.selectedUsersFromFriendsList);
        this.cleanUpUserSelection();
    }
}
