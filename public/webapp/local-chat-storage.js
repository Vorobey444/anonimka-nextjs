// Локальное хранилище чатов (обходим блокировку Supabase)
const LocalChatStorage = {
    // Получить все чаты
    getAllChats() {
        const chats = localStorage.getItem('private_chats');
        return chats ? JSON.parse(chats) : [];
    },

    // Сохранить чаты
    saveChats(chats) {
        localStorage.setItem('private_chats', JSON.stringify(chats));
    },

    // Проверить существование чата
    checkExisting(user1, user2, adId) {
        const chats = this.getAllChats();
        return chats.find(chat => 
            chat.user1 === user1 && 
            chat.user2 === user2 && 
            chat.ad_id === adId
        );
    },

    // Создать новый чат
    createChat(user1, user2, adId) {
        const chats = this.getAllChats();
        const newChat = {
            id: Date.now(),
            user1,
            user2,
            ad_id: adId,
            accepted: false,
            blocked_by: null,
            created_at: new Date().toISOString()
        };
        chats.push(newChat);
        this.saveChats(chats);
        return newChat;
    },

    // Получить входящие запросы
    getPendingRequests(userId) {
        const chats = this.getAllChats();
        return chats.filter(chat => 
            chat.user2 === userId && 
            chat.accepted === false && 
            chat.blocked_by === null
        );
    },

    // Получить активные чаты
    getActiveChats(userId) {
        const chats = this.getAllChats();
        return chats.filter(chat => 
            (chat.user1 === userId || chat.user2 === userId) && 
            chat.accepted === true && 
            chat.blocked_by === null
        );
    },

    // Принять запрос
    acceptChat(chatId, userId) {
        const chats = this.getAllChats();
        const chat = chats.find(c => c.id === chatId && c.user2 === userId);
        if (chat) {
            chat.accepted = true;
            this.saveChats(chats);
            return true;
        }
        return false;
    },

    // Отклонить запрос
    rejectChat(chatId, userId) {
        const chats = this.getAllChats();
        const filteredChats = chats.filter(c => 
            !(c.id === chatId && c.user2 === userId)
        );
        this.saveChats(filteredChats);
        return true;
    },

    // Подсчитать запросы
    countRequests(userId) {
        return this.getPendingRequests(userId).length;
    }
};

window.LocalChatStorage = LocalChatStorage;
