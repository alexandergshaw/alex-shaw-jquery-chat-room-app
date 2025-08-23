// Professional Chat Application with modern features and enhanced UX

$(document).ready(function() {
    // Application state
    const ChatApp = {
        state: {
            username: 'User',
            userStatus: 'online',
            theme: 'dark',
            fontSize: 'medium',
            soundEnabled: true,
            notificationsEnabled: false,
            messageHistory: [],
            messageCount: 0,
            sessionStartTime: Date.now(),
            isTyping: false,
            typingTimeout: null
        },
        
        // Enhanced bot responses with more variety
        botResponses: {
            casual: [
                "That's really interesting! 🤔",
                "I see what you mean there.",
                "Tell me more about that topic!",
                "How do you feel about that?",
                "That reminds me of something similar I heard.",
                "Great perspective! 👍",
                "I hadn't thought of it that way before.",
                "What would you do in that situation?",
                "That's a really good question to ask.",
                "I totally agree with your point!"
            ],
            supportive: [
                "That sounds challenging, but you've got this! 💪",
                "I believe in your ability to handle this.",
                "You're making great progress!",
                "That's a smart approach to the problem.",
                "Keep up the excellent work!",
                "Your perspective is really valuable."
            ],
            curious: [
                "Can you elaborate on that idea?",
                "What inspired you to think about this?",
                "That's fascinating! What happened next?",
                "How did you come to that conclusion?",
                "What are your thoughts on the bigger picture?",
                "I'm curious about your experience with this."
            ]
        },

        // Emoji sets for quick access
        emojis: ['😊', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '😎', '🙌'],

        init() {
            this.setupEventHandlers();
            this.initializeDialogs();
            this.loadSettings();
            this.startSessionTimer();
            this.addWelcomeMessage();
            this.requestNotificationPermission();
            this.initializeTheme();
            this.setupKeyboardShortcuts();
        },

        setupEventHandlers() {
            // Message sending
            $('#send-btn').click(() => this.sendMessage());
            
            // Input handling with enhanced features
            $('#message-input')
                .on('input', (e) => this.handleInput(e))
                .on('keydown', (e) => this.handleKeyDown(e))
                .on('paste', (e) => this.handlePaste(e));
            
            // UI actions
            $('#settings-btn').click(() => this.openSettings());
            $('#theme-toggle').click(() => this.toggleTheme());
            $('#clear-chat').click(() => this.clearChat());
            $('#search-btn').click(() => this.openSearch());
            $('#emoji-btn').click(() => this.showEmojiPicker());
            
            // Window events
            $(window).on('beforeunload', () => this.saveSession());
            
            // Auto-save settings
            setInterval(() => this.saveSettings(), 30000);
        },

        initializeDialogs() {
            $('#settings-dialog').dialog({
                autoOpen: false,
                width: 500,
                height: 600,
                modal: true,
                resizable: false,
                draggable: true,
                buttons: {
                    "Save Settings": () => {
                        this.saveSettings();
                        $('#settings-dialog').dialog("close");
                        this.showNotification('Settings saved successfully!', 'success');
                    },
                    "Cancel": () => {
                        $('#settings-dialog').dialog("close");
                    }
                }
            });

            $('#search-dialog').dialog({
                autoOpen: false,
                width: 400,
                height: 500,
                modal: true,
                resizable: false,
                buttons: {
                    "Close": () => {
                        $('#search-dialog').dialog("close");
                    }
                }
            });

            // Search functionality
            $('#search-input').on('input', (e) => this.performSearch(e.target.value));
        },

        handleInput(e) {
            const input = e.target;
            const value = input.value;
            
            // Update character count
            $('#chat-input-container .char-count').text(`${value.length}/500`);
            
            // Enable/disable send button
            $('#send-btn').prop('disabled', value.trim().length === 0);
            
            // Auto-resize textarea
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            
            // Show typing indicator
            this.showTypingIndicator();
        },

        handleKeyDown(e) {
            // Send on Enter (without Shift)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
            
            // Command shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        this.openSearch();
                        break;
                    case ',':
                        e.preventDefault();
                        this.openSettings();
                        break;
                }
            }
        },

        handlePaste(e) {
            // Handle pasted content (could add image support later)
            setTimeout(() => {
                this.handleInput(e);
            }, 0);
        },

        sendMessage() {
            const messageText = $('#message-input').val().trim();
            if (messageText === '') return;

            // Check for commands
            if (this.handleCommand(messageText)) {
                $('#message-input').val('');
                return;
            }

            // Add user message with enhanced styling
            this.addMessage({
                user: this.state.username,
                text: messageText,
                type: 'own',
                timestamp: new Date()
            });
            
            // Clear input and reset height
            const input = $('#message-input')[0];
            input.value = '';
            input.style.height = 'auto';
            $('#send-btn').prop('disabled', true);
            $('#chat-input-container .char-count').text('0/500');
            
            // Store in history
            this.state.messageHistory.push({
                user: this.state.username,
                text: messageText,
                timestamp: new Date(),
                type: 'own'
            });

            this.state.messageCount++;
            this.updateStats();
            
            // Play send sound
            if (this.state.soundEnabled) {
                this.playSound('send');
            }
        },

        addMessage(messageData) {
            const { user, text, type, timestamp } = messageData;
            const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const userInitial = user.charAt(0).toUpperCase();
            
            const messageHtml = `
                <div class="message ${type}" data-timestamp="${timestamp.getTime()}">
                    <div class="message-avatar">${userInitial}</div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-sender">${this.escapeHtml(user)}</span>
                            <span class="message-time">${time}</span>
                        </div>
                        <div class="message-bubble">
                            ${this.formatMessage(text)}
                        </div>
                    </div>
                </div>
            `;
            
            $('#chat-messages').append(messageHtml);
            this.scrollToBottom();
            
            // Add entrance animation
            $('.message').last().hide().fadeIn(300);
            
            // Show desktop notification for received messages
            if (type === 'other' && this.state.notificationsEnabled && document.hidden) {
                this.showDesktopNotification(user, text);
            }
        },

        formatMessage(text) {
            // Enhanced message formatting
            let formatted = this.escapeHtml(text);
            
            // Convert URLs to links
            formatted = formatted.replace(
                /(https?:\/\/[^\s]+)/g,
                '<a href="$1" target="_blank" rel="noopener">$1</a>'
            );
            
            // Convert newlines to br tags
            formatted = formatted.replace(/\n/g, '<br>');
            
            // Basic emoji support
            formatted = formatted.replace(/:\)/g, '😊');
            formatted = formatted.replace(/:\(/g, '😞');
            formatted = formatted.replace(/:D/g, '😃');
            formatted = formatted.replace(/;-?\)/g, '😉');
            
            return formatted;
        },

        simulateBotResponse(userMessage) {
            $('#typing-indicator').addClass('active');
            
            setTimeout(() => {
                $('#typing-indicator').removeClass('active');
                
                const responseType = this.getBotResponseType(userMessage);
                const responses = this.botResponses[responseType];
                const response = responses[Math.floor(Math.random() * responses.length)];
                
                this.addMessage({
                    user: 'AI Assistant',
                    text: response,
                    type: 'other',
                    timestamp: new Date()
                });
                
                this.state.messageHistory.push({
                    user: 'AI Assistant',
                    text: response,
                    timestamp: new Date(),
                    type: 'other'
                });

                this.state.messageCount++;
                this.updateStats();
                
                // Play receive sound
                if (this.state.soundEnabled) {
                    this.playSound('receive');
                }
            }, 1500 + Math.random() * 2000);
        },

        getBotResponseType(message) {
            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('help') || lowerMessage.includes('problem') || lowerMessage.includes('difficult')) {
                return 'supportive';
            } else if (lowerMessage.includes('?') || lowerMessage.includes('think') || lowerMessage.includes('what')) {
                return 'curious';
            } else {
                return 'casual';
            }
        },

        handleCommand(text) {
            const command = text.toLowerCase().trim();
            
            switch(command) {
                case '/help':
                    this.showHelpMessage();
                    return true;
                case '/time':
                    this.addMessage({
                        user: 'System',
                        text: `Current time: ${new Date().toLocaleString()}`,
                        type: 'other',
                        timestamp: new Date()
                    });
                    return true;
                case '/clear':
                    this.clearChat();
                    return true;
                case '/stats':
                    this.showStats();
                    return true;
                case '/theme':
                    this.toggleTheme();
                    return true;
                default:
                    if (command.startsWith('/emoji ')) {
                        const emoji = command.substring(7);
                        $('#message-input').val($('#message-input').val() + emoji);
                        return true;
                    }
                    return false;
            }
        },

        showHelpMessage() {
            const helpText = `
Available Commands:
• /help - Show this help message
• /time - Display current time
• /clear - Clear chat history
• /stats - Show session statistics
• /theme - Toggle dark/light theme
• /emoji [emoji] - Add emoji to input

Keyboard Shortcuts:
• Ctrl+K - Open search
• Ctrl+, - Open settings
• Enter - Send message
• Shift+Enter - New line
            `;
            
            this.addMessage({
                user: 'System',
                text: helpText.trim(),
                type: 'other',
                timestamp: new Date()
            });
        },

        showStats() {
            const sessionTime = this.formatSessionTime();
            const statsText = `
Session Statistics:
• Messages sent: ${this.state.messageCount}
• Session time: ${sessionTime}
• Username: ${this.state.username}
• Theme: ${this.state.theme}
• Status: ${this.state.userStatus}
            `;
            
            this.addMessage({
                user: 'System',
                text: statsText.trim(),
                type: 'other',
                timestamp: new Date()
            });
        },

        clearChat() {
            $('#chat-messages').empty();
            this.state.messageHistory = [];
            this.state.messageCount = 0;
            this.updateStats();
            this.addWelcomeMessage();
            this.showNotification('Chat cleared successfully!', 'info');
        },

        addWelcomeMessage() {
            this.addMessage({
                user: 'System',
                text: `Welcome to ChatPro, ${this.state.username}! 🎉\n\nType /help for available commands.`,
                type: 'other',
                timestamp: new Date()
            });
        },

        openSettings() {
            // Populate current settings
            $('#username').val(this.state.username);
            $('#user-status').val(this.state.userStatus);
            $('#theme').val(this.state.theme);
            $('#font-size').val(this.state.fontSize);
            $('#sound-notifications').prop('checked', this.state.soundEnabled);
            $('#desktop-notifications').prop('checked', this.state.notificationsEnabled);
            
            $('#settings-dialog').dialog('open');
        },

        saveSettings() {
            // Get values from form
            this.state.username = $('#username').val() || 'User';
            this.state.userStatus = $('#user-status').val() || 'online';
            this.state.theme = $('#theme').val() || 'light';
            this.state.fontSize = $('#font-size').val() || 'medium';
            this.state.soundEnabled = $('#sound-notifications').is(':checked');
            this.state.notificationsEnabled = $('#desktop-notifications').is(':checked');
            
            // Apply settings
            this.applyTheme();
            this.applyFontSize();
            this.updateUserDisplay();
            
            // Save to localStorage
            localStorage.setItem('chatAppSettings', JSON.stringify(this.state));
        },

        loadSettings() {
            const saved = localStorage.getItem('chatAppSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(this.state, settings);
                this.applyTheme();
                this.applyFontSize();
                this.updateUserDisplay();
            }
        },

        applyTheme() {
            $('body').toggleClass('dark-theme', this.state.theme === 'dark');
            
            // Update theme toggle button
            const themeIcon = this.state.theme === 'dark' ? 'fa-sun' : 'fa-moon';
            const themeText = this.state.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
            $('#theme-toggle').html(`<i class="fas ${themeIcon}"></i><span>${themeText}</span>`);
        },

        applyFontSize() {
            $('body').removeClass('font-small font-medium font-large')
                    .addClass(`font-${this.state.fontSize}`);
        },

        updateUserDisplay() {
            $('#display-username').text(this.state.username);
            
            // Update status indicator
            const statusMap = {
                online: { class: 'online', text: 'Online' },
                away: { class: 'away', text: 'Away' },
                busy: { class: 'busy', text: 'Busy' }
            };
            
            const status = statusMap[this.state.userStatus];
            $('#status-indicator')
                .removeClass('online away busy')
                .addClass(status.class)
                .find('.status-text')
                .text(status.text);
        },

        toggleTheme() {
            this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
            this.applyTheme();
            this.saveSettings();
        },

        initializeTheme() {
            // Auto theme detection
            if (this.state.theme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.state.theme = prefersDark ? 'dark' : 'light';
            }
            this.applyTheme();
        },

        startSessionTimer() {
            setInterval(() => {
                $('#session-time').text(this.formatSessionTime());
            }, 1000);
        },

        formatSessionTime() {
            const elapsed = Date.now() - this.state.sessionStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },

        updateStats() {
            $('#message-count').text(this.state.messageCount);
        },

        openSearch() {
            $('#search-dialog').dialog('open');
            $('#search-input').focus();
        },

        performSearch(query) {
            const results = $('#search-results');
            results.empty();
            
            if (query.length < 2) return;
            
            const matches = this.state.messageHistory.filter(msg => 
                msg.text.toLowerCase().includes(query.toLowerCase())
            );
            
            if (matches.length === 0) {
                results.html('<div class="search-result">No messages found</div>');
                return;
            }
            
            matches.slice(0, 10).forEach(msg => {
                const resultHtml = `
                    <div class="search-result" data-timestamp="${msg.timestamp.getTime()}">
                        <div class="search-result-text">${this.highlightSearchTerm(msg.text, query)}</div>
                        <div class="search-result-meta">${msg.user} - ${msg.timestamp.toLocaleString()}</div>
                    </div>
                `;
                results.append(resultHtml);
            });
        },

        highlightSearchTerm(text, term) {
            const regex = new RegExp(`(${term})`, 'gi');
            return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
        },

        showTypingIndicator() {
            if (this.state.typingTimeout) {
                clearTimeout(this.state.typingTimeout);
            }
            
            this.state.typingTimeout = setTimeout(() => {
                // Could implement actual typing indicator for multi-user chat
            }, 1000);
        },

        setupKeyboardShortcuts() {
            $(document).on('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case '/':
                            e.preventDefault();
                            $('#message-input').focus();
                            break;
                        case 'Escape':
                            $('.ui-dialog:visible .ui-dialog-titlebar-close').click();
                            break;
                    }
                }
            });
        },

        requestNotificationPermission() {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        },

        showDesktopNotification(user, message) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`${user} sent a message`, {
                    body: message.substring(0, 100),
                    icon: '/favicon.ico',
                    tag: 'chat-message'
                });
            }
        },

        showNotification(message, type = 'info') {
            // Simple toast notification (could be enhanced with a toast library)
            const notification = $(`
                <div class="toast-notification ${type}">
                    <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
                    ${message}
                </div>
            `);
            
            $('body').append(notification);
            
            setTimeout(() => {
                notification.addClass('show');
            }, 100);
            
            setTimeout(() => {
                notification.removeClass('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        },

        playSound(type) {
            // Audio feedback (could add actual sound files)
            if (this.state.soundEnabled) {
                const audio = new Audio();
                audio.volume = 0.1;
                // Would need actual sound files:
                // audio.src = `/sounds/${type}.mp3`;
                // audio.play().catch(() => {}); // Ignore autoplay policy errors
            }
        },

        scrollToBottom() {
            const chatMessages = $('#chat-messages');
            chatMessages.animate({
                scrollTop: chatMessages[0].scrollHeight
            }, 300);
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        saveSession() {
            // Save current session data
            localStorage.setItem('chatAppSession', JSON.stringify({
                messageHistory: this.state.messageHistory,
                messageCount: this.state.messageCount,
                sessionStartTime: this.state.sessionStartTime
            }));
        }
    };

    // Initialize the application
    ChatApp.init();
    
    // Make chat input focus automatically
    $('#message-input').focus();
    
    // Global access for debugging
    window.ChatApp = ChatApp;
});