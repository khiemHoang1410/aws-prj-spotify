"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, Send, User, UserPlus, Music, ArrowLeft, MessageSquare } from "lucide-react";
import moment from "moment";

const ChatSidebar = ({ isOpen, onClose, currentUser }) => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wsConnected, setWsConnected] = useState(false); // Trạng thái kết nối WebSocket

  // Refs
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const wsRef = useRef(null); // Lưu trữ WebSocket instance

  // Khởi tạo WebSocket khi component mount và user đăng nhập
  useEffect(() => {
    if (!isOpen || !currentUser?.user_id) return;

    // Kết nối WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${currentUser.user_id}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
      // Đồng bộ tin nhắn cục bộ (nếu có) khi kết nối
      syncLocalMessages();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const message = data.message;
      const otherUserId = message.sender_id === currentUser.user_id ? message.receiver_id : message.sender_id;

      setMessages((prev) => {
        const existingMessages = prev[otherUserId] || [];
        // Kiểm tra xem tin nhắn tạm có tồn tại không (dựa trên tempId hoặc nội dung)
        const tempMsgIndex = existingMessages.findIndex(
          (msg) =>
            (message.tempId && msg.tempId === message.tempId) ||
            (msg.senderId === message.sender_id &&
              msg.receiverId === message.receiver_id &&
              msg.text === message.text &&
              Math.abs(new Date(msg.timestamp) - new Date(message.sent_at)) < 1000)
        );

        if (tempMsgIndex !== -1) {
          // Thay thế tin nhắn tạm
          const updatedMessages = [...existingMessages];
          updatedMessages[tempMsgIndex] = {
            id: message.message_id,
            senderId: message.sender_id,
            receiverId: message.receiver_id,
            text: message.text,
            timestamp: new Date(message.sent_at),
            is_read: message.is_read,
          };
          return { ...prev, [otherUserId]: updatedMessages };
        } else {
          // Thêm tin nhắn mới
          return {
            ...prev,
            [otherUserId]: [
              ...existingMessages,
              {
                id: message.message_id,
                senderId: message.sender_id,
                receiverId: message.receiver_id,
                text: message.text,
                timestamp: new Date(message.sent_at),
                is_read: message.is_read,
              },
            ],
          };
        }
      });
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
    };

    // Lấy dữ liệu ban đầu
    fetchUsers();
    fetchMessages();
    fetchFriendRequests();
    fetchFriends();

    // Cleanup
    return () => {
      ws.close();
    };
  }, [isOpen, currentUser]);

  // Theo dõi trạng thái kết nối mạng
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Thử kết nối lại WebSocket
      if (!wsConnected && currentUser?.user_id) {
        const ws = new WebSocket(`ws://localhost:8000/ws/chat/${currentUser.user_id}/`);
        wsRef.current = ws;
        ws.onopen = () => {
          setWsConnected(true);
          syncLocalMessages();
        };
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const message = data.message;
          const otherUserId = message.sender_id === currentUser.user_id ? message.receiver_id : message.sender_id;

          setMessages((prev) => ({
            ...prev,
            [otherUserId]: [
              ...(prev[otherUserId] || []),
              {
                id: message.message_id,
                senderId: message.sender_id,
                receiverId: message.receiver_id,
                text: message.text,
                timestamp: new Date(message.sent_at),
                is_read: message.is_read,
              },
            ],
          }));
        };
        ws.onclose = () => setWsConnected(false);
        ws.onerror = () => setWsConnected(false);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wsConnected, currentUser]);

  // Cuộn đến tin nhắn mới nhất và đánh dấu tin nhắn đã đọc
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

  
  }, [ messages]);

  // Đồng bộ tin nhắn cục bộ khi kết nối lại
  const syncLocalMessages = async () => {
    const localMessages = JSON.parse(localStorage.getItem("localMessages") || "{}");
    for (const userId in localMessages) {
      for (const msg of localMessages[userId]) {
        if (msg.local) {
          try {
            await wsRef.current.send(
              JSON.stringify({
                text: msg.text,
                sender_id: msg.senderId,
                receiver_id: msg.receiverId,
                tempId: msg.tempId,
              })
            );
            // Xóa tin nhắn cục bộ sau khi gửi
            localMessages[userId] = localMessages[userId].filter((m) => m.id !== msg.id);
            localStorage.setItem("localMessages", JSON.stringify(localMessages));
          } catch (error) {
            console.error("Error syncing local message:", error);
          }
        }
      }
    }
  };

  // API Functions
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/users/");
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      const formattedUsers = data
        .filter((user) => user.user_id !== currentUser?.user_id)
        .map((user) => ({
          id: user.user_id,
          name: user.full_name || user.username,
          email: user.email,
          avatar: user.avatar_url || "/placeholder.svg?height=40&width=40",
          online: user.is_active,
          lastSeen: new Date(user.updated_at),
        }));

      setOnlineUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    if (!currentUser?.user_id) return;
    try {
      const response = await fetch(
        `http://localhost:8000/api/friend-requests/?receiver_id=${currentUser.user_id}&status=pending`
      );
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setFriendRequests(data);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      setFriendRequests([]);
    }
  };

  const fetchFriends = async () => {
    if (!currentUser?.user_id) return;
    try {
      const response = await fetch(`http://localhost:8000/api/users/${currentUser.user_id}/friends/`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setFriends([]);
    }
  };

  const fetchMessages = async () => {
    if (!currentUser?.user_id) return;
    try {
      const response = await fetch(`http://localhost:8000/api/messages/?user_id=${currentUser.user_id}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      const messagesByUser = {};
      data.forEach((msg) => {
        const otherUserId = msg.sender_id === currentUser.user_id ? msg.receiver_id : msg.sender_id;
        if (!messagesByUser[otherUserId]) messagesByUser[otherUserId] = [];
        messagesByUser[otherUserId].push({
          id: msg.message_id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          text: msg.text,
          timestamp: new Date(msg.sent_at),
          is_read: msg.is_read,
        });
      });

      setMessages(messagesByUser);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchConversation = async (userId) => {
    if (!currentUser?.user_id || !userId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/messages/?user_id=${currentUser.user_id}&other_user_id=${userId}`
      );
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      const formattedMessages = data.map((msg) => ({
        id: msg.message_id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        text: msg.text,
        timestamp: new Date(msg.sent_at),
        is_read: msg.is_read,
      }));

      setMessages((prev) => ({
        ...prev,
        [userId]: formattedMessages,
      }));
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setActiveTab("chats");
    await fetchConversation(user.id);
    await markMessagesAsRead(user.id); // Đánh dấu đã đọc trước
    await fetchConversation(user.id); // Tải lại cuộc trò chuyện
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || !selectedUser || !currentUser?.user_id) return;

    const tempId = `temp_${Date.now()}`;
    const newMessage = {
      id: tempId,
      senderId: currentUser.user_id,
      receiverId: selectedUser.id,
      text: currentMessage,
      timestamp: new Date(),
      is_read: false,
      sendStatus: wsConnected ? "pending" : "local",
      tempId, // Lưu tempId để so sánh
    };

    // Cập nhật UI ngay lập tức
    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage],
    }));

    const messageText = currentMessage;
    setCurrentMessage("");

    if (wsConnected) {
      // Gửi qua WebSocket
      try {
        wsRef.current.send(
          JSON.stringify({
            text: messageText,
            sender_id: currentUser.user_id,
            receiver_id: selectedUser.id,
            tempId, // Gửi tempId để server trả về
          })
        );
      } catch (error) {
        console.error("Error sending message via WebSocket:", error);
        setMessages((prev) => {
          const updatedMessages = [...prev[selectedUser.id]];
          const tempMsgIndex = updatedMessages.findIndex((msg) => msg.id === newMessage.id);
          updatedMessages[tempMsgIndex] = { ...updatedMessages[tempMsgIndex], sendStatus: "failed" };
          return { ...prev, [selectedUser.id]: updatedMessages };
        });
      }
    } else {
      // Lưu cục bộ khi offline
      const localMessages = JSON.parse(localStorage.getItem("localMessages") || "{}");
      if (!localMessages[selectedUser.id]) localMessages[selectedUser.id] = [];
      localMessages[selectedUser.id].push({
        id: newMessage.id,
        senderId: currentUser.user_id,
        receiverId: selectedUser.id,
        text: messageText,
        timestamp: new Date().toISOString(),
        is_read: false,
        local: true,
        tempId,
      });
      localStorage.setItem("localMessages", JSON.stringify(localMessages));
    }
  };

  const handleRetryMessage = (message) => {
    setCurrentMessage(message.text);
    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: prev[selectedUser.id].filter((m) => m.id !== message.id),
    }));
    if (wsConnected) {
      wsRef.current.send(
        JSON.stringify({
          text: message.text,
          sender_id: currentUser.user_id,
          receiver_id: selectedUser.id,
        })
      );
    }
  };

  const handleShareMusic = () => {
    const currentSong = JSON.parse(localStorage.getItem("currentSong")) || {
      title: "Unknown Song",
      artist: { artist_name: "Unknown Artist" },
    };
    const shareMessage = `Đang nghe: ${currentSong.title} - ${
      currentSong.artist?.artist_name || currentSong.artist || "Unknown Artist"
    }`;
    setCurrentMessage(shareMessage);
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/friend-requests/${requestId}/accept/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      setFriendRequests((prev) => prev.filter((request) => request.request_id !== requestId));
      fetchFriends();
      alert("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert(`Error accepting friend request: ${error.message}`);
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/friend-requests/${requestId}/reject/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      setFriendRequests((prev) => prev.filter((request) => request.request_id !== requestId));
      alert("Friend request rejected");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      alert(`Error rejecting friend request: ${error.message}`);
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredUsers(onlineUsers);
      return;
    }
    const filtered = onlineUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
    setActiveTab("search");
  };

  const handleAddFriend = async (userId) => {
    if (!currentUser?.user_id) {
      alert("You must be logged in to add friends");
      return;
    }
    if (userId === currentUser.user_id) {
      alert("You cannot add yourself as a friend");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/api/friend-requests/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUser.user_id,
          receiver_id: userId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      alert("Friend request sent successfully");
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert(`Error sending friend request: ${error.message}`);
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  const markMessagesAsRead = async (userId) => {
    if (!currentUser?.user_id) return;
    try {
      const response = await fetch(`http://localhost:8000/api/messages/read/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          sender_id: userId,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      // Cập nhật state messages: Đặt is_read = true cho tất cả tin nhắn từ userId
      setMessages((prev) => {
        const updatedMessages = { ...prev };
        if (updatedMessages[userId]) {
          updatedMessages[userId] = updatedMessages[userId].map((msg) =>
            msg.senderId === userId && msg.receiverId === currentUser.user_id
              ? { ...msg, is_read: true }
              : msg
          );
        }
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Helper Functions
  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    if (now.toDateString() === messageDate.toDateString()) {
      return moment(messageDate).format("h:mm A");
    } else if (now.getDate() - messageDate.getDate() === 1) {
      return "Yesterday";
    } else {
      return moment(messageDate).format("DD/MM/YYYY");
    }
  };

  const getUnreadMessageCount = (userId) => {
    if (!messages[userId]) return 0;
    return messages[userId].filter(
      (msg) => msg.senderId === userId && msg.receiverId === currentUser?.user_id && !msg.is_read
    ).length;
  };

  // Render functions
  const renderChatsList = () => (
    <div className="chat-users-list">
      <div className="chat-section-title">
        <h3>Online Users ({onlineUsers.filter((user) => user.online).length})</h3>
      </div>
      {filteredUsers.map((user) => (
        <div key={user.id} className="chat-user-item" onClick={() => handleUserSelect(user)}>
          <div className="chat-user-avatar">
            <img src={user.avatar || "/placeholder.svg"} alt={user.name} />
            {user.online && <span className="online-indicator"></span>}
          </div>
          <div className="chat-user-info">
            <div className="chat-user-name-container">
              <h4 className="chat-user-name">{user.name}</h4>
              {messages[user.id] && messages[user.id].length > 0 && (
                <span className="chat-last-message-time">
                  {formatTime(messages[user.id][messages[user.id].length - 1].timestamp)}
                </span>
              )}
            </div>
            <p className="chat-last-message">
              {messages[user.id] && messages[user.id].length > 0
                ? messages[user.id][messages[user.id].length - 1].text.substring(0, 30) +
                  (messages[user.id][messages[user.id].length - 1].text.length > 30 ? "..." : "")
                : "No messages yet"}
            </p>
          </div>
          {getUnreadMessageCount(user.id) > 0 && (
            <div
              className={`unread-badge ${getUnreadMessageCount(user.id) > 0 ? "pulse" : ""}`}
              title={`${getUnreadMessageCount(user.id)} unread message(s)`}
            >
              {getUnreadMessageCount(user.id) > 99 ? "99+" : getUnreadMessageCount(user.id)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderFriendRequests = () => (
    <div className="friend-requests-list">
      <div className="chat-section-title">
        <h3>Friend Requests ({friendRequests.length})</h3>
      </div>
      {friendRequests.length === 0 ? (
        <p className="no-requests-message">No friend requests</p>
      ) : (
        friendRequests.map((request) => (
          <div key={request.request_id} className="friend-request-item">
            <div className="chat-user-avatar">
              <img src={request.sender_avatar || "/placeholder.svg"} alt={request.sender_name} />
            </div>
            <div className="friend-request-info">
              <h4 className="chat-user-name">{request.sender_name}</h4>
              <p className="friend-request-time">{moment(request.created_at).fromNow()}</p>
              <div className="friend-request-actions">
                <button
                  className="accept-request-button"
                  onClick={() => handleAcceptFriendRequest(request.request_id)}
                >
                  Accept
                </button>
                <button
                  className="reject-request-button"
                  onClick={() => handleRejectFriendRequest(request.request_id)}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))
      )}
      <div className="chat-section-title">
        <h3>My Friends ({friends.length})</h3>
      </div>
      {friends.length === 0 ? (
        <p className="no-friends-message">You don't have any friends yet</p>
      ) : (
        friends.map((friend) => (
          <div
            key={friend.user_id}
            className="chat-user-item"
            onClick={() =>
              handleUserSelect({
                id: friend.user_id,
                name: friend.full_name || friend.username,
                email: friend.email,
                avatar: friend.avatar_url || "/placeholder.svg?height=40&width=40",
                online: friend.is_active,
                lastSeen: new Date(friend.updated_at),
              })
            }
          >
            <div className="chat-user-avatar">
              <img src={friend.avatar_url || "/placeholder.svg"} alt={friend.full_name || friend.username} />
              {friend.is_active && <span className="online-indicator"></span>}
            </div>
            <div className="chat-user-info">
              <h4 className="chat-user-name">{friend.full_name || friend.username}</h4>
              <p className="chat-user-email">{friend.email}</p>
            </div>
            <button className="message-button">
              <MessageSquare size={16} />
            </button>
          </div>
        ))
      )}
      <div className="chat-section-title">
        <h3>Find Friends</h3>
      </div>
      <div className="chat-search-container">
        <form onSubmit={handleSearchUser} className="chat-search-form">
          <div className="chat-search-input-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chat-search-input"
            />
          </div>
        </form>
      </div>
      {filteredUsers.slice(0, 10).map((user) => (
        <div key={user.id} className="chat-user-item">
          <div className="chat-user-avatar">
            <img src={user.avatar || "/placeholder.svg"} alt={user.name} />
            {user.online && <span className="online-indicator"></span>}
          </div>
          <div className="chat-user-info">
            <h4 className="chat-user-name">{user.name}</h4>
            <p className="chat-user-email">{user.email}</p>
          </div>
          <button className="add-friend-button" onClick={() => handleAddFriend(user.id)}>
            <UserPlus size={16} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderSearchResults = () => (
    <div className="search-results-list">
      <div className="chat-section-title">
        <h3>Search Results</h3>
      </div>
      {filteredUsers.length === 0 ? (
        <p className="no-results-message">No users found</p>
      ) : (
        filteredUsers.map((user) => (
          <div key={user.id} className="chat-user-item">
            <div className="chat-user-avatar">
              <img src={user.avatar || "/placeholder.svg"} alt={user.name} />
              {user.online && <span className="online-indicator"></span>}
            </div>
            <div className="chat-user-info">
              <h4 className="chat-user-name">{user.name}</h4>
              <p className="chat-user-email">{user.email}</p>
            </div>
            <div className="search-user-actions">
              <button className="chat-with-user-button" onClick={() => handleUserSelect(user)}>
                <User size={16} />
              </button>
              <button className="add-friend-button" onClick={() => handleAddFriend(user.id)}>
                <UserPlus size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderConversation = () => (
    <div className="chat-messages-container" ref={chatContainerRef}>
      <div className="chat-messages">
        {messages[selectedUser.id] && messages[selectedUser.id].length > 0 ? (
          messages[selectedUser.id].map((message) => (
            <div
              key={message.id}
              className={`chat-message ${
                message.senderId === currentUser?.user_id ? "sent" : "received"
              } ${
                message.sendStatus === "failed" ? "failed" : message.sendStatus === "local" ? "local" : ""
              }`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">
                  {message.sendStatus === "failed" ? (
                    <span className="error-status">Failed to send</span>
                  ) : message.sendStatus === "local" ? (
                    <span className="local-status">Saved locally</span>
                  ) : (
                    formatTime(message.timestamp)
                  )}
                </span>
              </div>
              {message.sendStatus === "failed" && (
                <button className="retry-button" onClick={() => handleRetryMessage(message)}>
                  Retry
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="no-messages">
            <p>No messages yet. Start a conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          className="chat-input"
        />
        <div className="chat-input-actions">
          <button type="button" className="share-music-button" onClick={handleShareMusic}>
            <Music size={20} />
          </button>
          <button type="submit" className="send-message-button" disabled={!currentMessage.trim()}>
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );

  // Main render
  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="chat-sidebar-overlay">
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Messages</h2>
            <button className="close-chat-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="login-required">
            <p>Please log in to use the messaging feature</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar-overlay">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">
            {selectedUser ? (
              <div className="selected-user-header">
                <button className="back-button" onClick={handleBackToList}>
                  <ArrowLeft size={20} />
                </button>
                <div className="selected-user-info">
                  <div className="selected-user-avatar">
                    <img src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.name} />
                    {selectedUser.online && <span className="online-indicator"></span>}
                  </div>
                  <div>
                    <h3>{selectedUser.name}</h3>
                    <p className="user-status">
                      {selectedUser.online ? "Online" : `Last seen ${moment(selectedUser.lastSeen).fromNow()}`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2>Messages</h2>
                <div className="chat-tabs">
                  <button
                    className={`chat-tab ${activeTab === "chats" ? "active" : ""}`}
                    onClick={() => setActiveTab("chats")}
                  >
                    Chats
                  </button>
                  <button
                    className={`chat-tab ${activeTab === "friends" ? "active" : ""}`}
                    onClick={() => setActiveTab("friends")}
                  >
                    Friends
                    {friendRequests.length > 0 && <span className="notification-badge">{friendRequests.length}</span>}
                  </button>
                </div>
              </>
            )}
          </div>
          <button className="close-chat-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {!selectedUser && (
          <div className={`connection-status ${wsConnected ? "online" : "offline"}`}>
            {wsConnected ? "Connected to chat server" : "Offline - Messages will be saved locally"}
          </div>
        )}
        {!selectedUser ? (
          <>
            <div className="chat-search-container">
              <form onSubmit={handleSearchUser} className="chat-search-form">
                <div className="chat-search-input-container">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="chat-search-input"
                  />
                </div>
              </form>
            </div>
            {activeTab === "chats" && renderChatsList()}
            {activeTab === "friends" && renderFriendRequests()}
            {activeTab === "search" && renderSearchResults()}
          </>
        ) : (
          renderConversation()
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;