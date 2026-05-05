const statusLabel = (isOnline, lastSeen) => {
  if (isOnline) return "Online";
  if (!lastSeen) return "Offline";
  const date = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
  return `Last seen ${date.toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short",
  })}`;
};

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
  editingMessageId,
  setEditingMessageId,
  editedText,
  setEditedText,
  handleDeleteMessage,
  handleUpdateMessage,
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
            {selectedUser && (
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    selectedUser.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                  title={statusLabel(
                    selectedUser.isOnline,
                    selectedUser.lastSeen,
                  )}
                  aria-hidden
                />
                <p
                  className={`text-sm ${
                    selectedUser.isOnline ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {statusLabel(selectedUser.isOnline, selectedUser.lastSeen)}
                </p>
              </div>
            )}
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
                  atob(token.split(".")[1]),
                ).userId;

                const isSender = getId(msg.senderId) === currentUserId;

                // FORMAT DATE
                const messageDate = new Date(
                  msg.createdAt || msg.timestamp,
                ).toLocaleDateString([], {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                // FORMAT TIME
                const messageTime = new Date(
                  msg.createdAt || msg.timestamp,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                // SHOW DATE HEADER ONLY ON DATE CHANGE
                const previousMsg = messages[index - 1];
                const previousDate = previousMsg
                  ? new Date(
                      previousMsg.createdAt || previousMsg.timestamp,
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
                        {/* MESSAGE BOX */}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isSender
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-300 text-black"
                          }`}
                        >
                          {editingMessageId === msg._id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                className="px-2 py-1 rounded text-black"
                              />

                              <button
                                onClick={() => handleUpdateMessage(msg._id)}
                                className="text-xs text-green-300"
                              >
                                Save
                              </button>
                            </div>
                          ) : // ) : msg.isDeleted ? (
                          //   <i>This message was deleted</i>
                          // ) : (
                          //   <>
                          //     {msg.message}
                          //     {msg.isEdited && (
                          //       <span className="text-xs ml-2">(edited)</span>
                          //     )}
                          //   </>
                          // )}

                          msg.isDeleted ? (
                            <i>This message was deleted</i>
                          ) : msg.fileUrl ? (
                            // FILE MESSAGE
                            <div className="flex flex-col gap-1">
                              {msg.fileType?.startsWith("image/") ? (
                                // IMAGE
                                <img
                                  src={`http://localhost:3000${msg.fileUrl}`}
                                  alt="attachment"
                                  className="max-w-xs rounded-lg cursor-pointer"
                                  onClick={() =>
                                    window.open(
                                      `http://localhost:3000${msg.fileUrl}`,
                                      "_blank",
                                    )
                                  }
                                />
                              ) : msg.fileType?.startsWith("video/") ? (
                                // VIDEO
                                <video controls className="max-w-xs rounded-lg">
                                  <source
                                    src={`http://localhost:3000${msg.fileUrl}`}
                                    type={msg.fileType}
                                  />
                                </video>
                              ) : (
                                // PDF / DOC / ZIP / OTHER
                                <a
                                  href={`http://localhost:3000${msg.fileUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-opacity-30 border-white bg-black bg-opacity-10"
                                >
                                  <span className="text-2xl">
                                    {msg.fileType?.includes("pdf")
                                      ? "📄"
                                      : msg.fileType?.includes("word") ||
                                          msg.fileType?.includes("doc")
                                        ? "📝"
                                        : msg.fileType?.includes("zip") ||
                                            msg.fileType?.includes("rar")
                                          ? "🗜️"
                                          : "📎"}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium truncate max-w-[150px]">
                                      {msg.fileName ||
                                        msg.fileUrl?.split("/").pop()}
                                    </span>
                                    <span className="text-[10px] opacity-70">
                                      Tap to download
                                    </span>
                                  </div>
                                </a>
                              )}
                              {/* CAPTION (text sent with file) */}
                              {msg.message && (
                                <p className="text-sm mt-1">{msg.message}</p>
                              )}
                            </div>
                          ) : (
                            // TEXT MESSAGE
                            <>
                              {msg.message}
                              {msg.isEdited && (
                                <span className="text-xs ml-2">(edited)</span>
                              )}
                            </>
                          )}
                        </div>

                        {isSender && !msg.isDeleted && (
                          <div className="flex gap-3 mt-1">
                            <button
                              onClick={() => {
                                setEditingMessageId(msg._id);
                                setEditedText(msg.message);
                              }}
                              className="text-xs text-blue-500"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="text-xs text-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        )}
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
              <p className="text-center text-gray-400 mt-10">No messages yet</p>
            )}
          </div>

          {/* INPUT */}
          {/* <form
            onSubmit={
              selectedGroup ? handleSendGroupMessage : handleSendMessage
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
          </form> */}
          <form
            onSubmit={
              selectedGroup ? handleSendGroupMessage : handleSendMessage
            }
            className="p-4 bg-white border-t flex gap-3 items-center"
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

            {/* ATTACHMENT BUTTON */}
            <label
              className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-3 rounded-full flex items-center justify-center text-xl shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
                onChange={(e) => {
  e.stopPropagation();
  const file = e.target.files[0];
  if (file) {
    if (selectedGroup) {
      handleSendGroupMessage({ preventDefault: () => {} }, file);
    } else {
      handleSendMessage({ preventDefault: () => {} }, file);
    }
  }
  e.target.value = "";
}}
              />
              📎
            </label>

            <button
              type="submit"
              disabled={loading || groupMessagesLoading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-full shrink-0"
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
