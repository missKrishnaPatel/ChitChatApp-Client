const ChatWindow = ({
  selectedUser,
  selectedGroup,
  messages,
  token,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleSendGroupMessage,
  loading,
  groupMessagesLoading,
  getId,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      {selectedUser || selectedGroup ? (
        <>
          {/* HEADER */}
          <div className="bg-white p-4 border-b">
            <h3 className="font-bold text-lg">
              {selectedUser
                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                : selectedGroup?.groupName}
            </h3>
          </div>

          {/* MESSAGES */}
         {/* MESSAGES */}
<div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
  {groupMessagesLoading ? (
  <p className="text-center text-gray-400 mt-10">
    Loading group messages...
  </p>
) : messages.length > 0 ? (
    messages.map((msg, index) => {
      const currentUserId = JSON.parse(
        atob(token.split(".")[1])
      ).userId;

      const isSender = getId(msg.senderId) === currentUserId;

      // FORMAT DATE
      const messageDate = new Date(
        msg.createdAt || msg.timestamp
      ).toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // FORMAT TIME
      const messageTime = new Date(
        msg.createdAt || msg.timestamp
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // SHOW DATE HEADER ONLY ON DATE CHANGE
      const previousMsg = messages[index - 1];
      const previousDate = previousMsg
        ? new Date(
            previousMsg.createdAt || previousMsg.timestamp
          ).toLocaleDateString([], {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null;

      const showDateHeader = messageDate !== previousDate;

      return (
        <div key={msg._id || index}>
          {/* DATE CENTER HEADER */}
          {showDateHeader && (
            <div className="flex justify-center my-4">
              <span className="bg-gray-300 text-gray-700 text-xs px-4 py-1 rounded-full">
                {messageDate}
              </span>
            </div>
          )}

          {/* MESSAGE ROW */}
          <div
            className={`flex ${
              isSender ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex flex-col max-w-xs">
              {/* SENDER NAME */}
              <p
                className={`text-xs mb-1 font-semibold ${
                  isSender
                    ? "text-right text-indigo-600"
                    : "text-left text-gray-600"
                }`}
              >
                {isSender
                  ? "You"
                  : selectedGroup
                  ? msg.senderName || "User"
                  : `${selectedUser?.firstName || ""} ${
                      selectedUser?.lastName || ""
                    }`}
              </p>

              {/* MESSAGE BOX */}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  isSender
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-300 text-black"
                }`}
              >
                {msg.message}
              </div>

              {/* TIME */}
              <p
                className={`text-[10px] mt-1 ${
                  isSender
                    ? "text-right text-gray-500"
                    : "text-left text-gray-500"
                }`}
              >
                {messageTime}
              </p>
            </div>
          </div>
        </div>
      );
    })
  ) : (
    <p className="text-center text-gray-400 mt-10">
      No messages yet
    </p>
  )}
</div>

          {/* INPUT */}
          <form
            onSubmit={
              selectedGroup
                ? handleSendGroupMessage
                : handleSendMessage
            }
            className="p-4 bg-white border-t flex gap-3"
          >
            <input
  type="text"
  placeholder={
    groupMessagesLoading
      ? "Loading messages..."
      : "Type your message..."
  }
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  disabled={groupMessagesLoading}
  className="flex-1 px-4 py-3 border rounded-full"
/>

            <button
              type="submit"
             disabled={loading || groupMessagesLoading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-full"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
          Select a user or group to start chatting
        </div>
      )}
    </div>
  );
};

export default ChatWindow;