const REACT_APP_BASE_URL = import.meta.env.VITE_BASE_URL;



const statusLabel = (isOnline, lastSeen) => {
  if (isOnline) return "Online";
  if (!lastSeen) return "Offline";
  const date = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
  return `Last seen ${date.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`;
};

const isGroupAdmin = (group, userId) =>
  (group?.admins ?? []).some((a) => String(a?._id ?? a) === String(userId));

const ChatWindow = ({
  selectedUser,
  selectedGroup,
  users,
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
  showMembers,
  setShowMembers,
  showAddUser,
  setShowAddUser,
  removeMember,
  addMember,
  makeAdmin,
  handleGroupImageUpload,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      {selectedUser || selectedGroup ? (
        <>
          {/* HEADER */}

          <div className="bg-white p-4 border-b">
            <div className="flex items-center gap-3">
  {/* ONE TO ONE USER HEADER */}
  {selectedUser && (
    <div className="flex items-center gap-3 p-4">
      {selectedUser.profilePicture ? (
        <img
          src={selectedUser.profilePicture}
          alt="user"
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
          {selectedUser.firstName?.charAt(0).toUpperCase()}
        </div>
      )}

      <div>
        <div className="font-semibold text-lg">
          {selectedUser.firstName} {selectedUser.lastName}
        </div>

        {/* <div className="text-xs text-gray-500">
          {selectedUser.isOnline ? "Online" : "Offline"}
        </div> */}
      </div>
    </div>
  )}

  {/* GROUP HEADER */}
  {selectedGroup && (
    <div className="flex items-center gap-3 p-4">
      {/* Clickable group avatar */}
      <label className="relative cursor-pointer group">
        {selectedGroup.groupImage ? (
          <img
            src={selectedGroup.groupImage}
            alt="group"
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
            {selectedGroup.groupName?.charAt(0).toUpperCase()}
          </div>
        )}

        <div
          className="absolute inset-0 bg-black bg-opacity-40 rounded-full 
          flex items-center justify-center opacity-0 
          group-hover:opacity-100 transition-opacity"
        >
          <span className="text-white text-xs font-medium">
            Edit
          </span>
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              handleGroupImageUpload(file, selectedGroup._id);
            }

            e.target.value = "";
          }}
        />
      </label>

      <div>
        <div className="font-semibold text-lg">
          {selectedGroup.groupName}
        </div>

        <div className="text-xs text-gray-500">
          {selectedGroup.members?.length} members
        </div>
      </div>
    </div>
  )}
</div>

            {/* PRIVATE CHAT — online status */}
            {selectedUser && (
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${selectedUser.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                  aria-hidden
                />
                <p
                  className={`text-sm ${selectedUser.isOnline ? "text-green-600" : "text-gray-500"}`}
                >
                  {statusLabel(selectedUser.isOnline, selectedUser.lastSeen)}
                </p>
              </div>
            )}

            {/* group chat */}
            {selectedGroup && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowMembers((v) => !v);
                    setShowAddUser(false);
                  }}
                  className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                >
                  Members
                </button>
                <button
                  onClick={() => {
                    setShowAddUser((v) => !v);
                    setShowMembers(false);
                  }}
                  className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                >
                  Add User
                </button>
              </div>
            )}

            {/* MEMBERS PANEL */}
            {selectedGroup && showMembers && (
              <div className="mt-3 border rounded-lg divide-y">
                {(selectedGroup.members ?? []).map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span>
                      {member.firstName} {member.lastName}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          removeMember(selectedGroup._id, member._id)
                        }
                        className="text-red-500 hover:underline text-xs"
                      >
                        Remove
                      </button>
                      {isGroupAdmin(selectedGroup, member._id) ? (
                        <span className="text-xs font-semibold text-indigo-600">
                          Admin
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            makeAdmin(selectedGroup._id, member._id)
                          }
                          className="text-blue-500 hover:underline text-xs"
                        >
                          Make Admin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(selectedGroup.members ?? []).length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">No members</p>
                )}
              </div>
            )}

            {/* ADD USER PANEL */}
            {selectedGroup && showAddUser && (
              <div className="mt-3 border rounded-lg divide-y max-h-48 overflow-y-auto">
                {users
                  .filter(
                    (u) =>
                      !(selectedGroup.members ?? []).some(
                        (m) => String(m._id) === String(u._id),
                      ),
                  )
                  .map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                      <button
                        onClick={() => addMember(selectedGroup._id, user._id)}
                        className="text-green-600 hover:underline text-xs"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                {users.filter(
                  (u) =>
                    !(selectedGroup.members ?? []).some((m) => m._id === u._id),
                ).length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">
                    No users to add
                  </p>
                )}
              </div>
            )}
          </div>

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

                const messageDate = new Date(
                  msg.createdAt || msg.timestamp,
                ).toLocaleDateString([], {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const messageTime = new Date(
                  msg.createdAt || msg.timestamp,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

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
                    {showDateHeader && (
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-300 text-gray-700 text-xs px-4 py-1 rounded-full">
                          {messageDate}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex flex-col max-w-xs">
                        <p
                          className={`text-xs mb-1 font-semibold ${isSender ? "text-right text-indigo-600" : "text-left text-gray-600"}`}
                        >
                          {isSender
                            ? "You"
                            : selectedGroup
                              ? msg.senderName || "User"
                              : `${selectedUser?.firstName || ""} ${selectedUser?.lastName || ""}`}
                        </p>

                        <div
                          className={`px-4 py-2 rounded-2xl ${isSender ? "bg-indigo-600 text-white" : "bg-gray-300 text-black"}`}
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
                          ) : msg.isDeleted ? (
                            <i>This message was deleted</i>
                          ) : msg.fileUrl ? (
                            <div className="flex flex-col gap-1">
                              {msg.fileType?.startsWith("image/") ? (
                                <img
                                  src={`${REACT_APP_BASE_URL}${msg.fileUrl}`}
                                  alt="attachment"
                                  className="max-w-xs rounded-lg cursor-pointer"
                                  onClick={() =>
                                    window.open(
                                      `${REACT_APP_BASE_URL}${msg.fileUrl}`,
                                      "_blank",
                                    )
                                  }
                                />
                              ) : msg.fileType?.startsWith("video/") ? (
                                <video controls className="max-w-xs rounded-lg">
                                  <source
                                    src={`${REACT_APP_BASE_URL}${msg.fileUrl}`}
                                    type={msg.fileType}
                                  />
                                </video>
                              ) : (
                                <a
                                  href={`${REACT_APP_BASE_URL}${msg.fileUrl}`}
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
                              {msg.message && (
                                <p className="text-sm mt-1">{msg.message}</p>
                              )}
                            </div>
                          ) : (
                            <>
                              {msg.message}
                              {msg.isEdited && (
                                <span className="text-xs ml-2 opacity-70">
                                  (edited)
                                </span>
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

                        <p
                          className={`text-[10px] mt-1 ${isSender ? "text-right text-gray-500" : "text-left text-gray-500"}`}
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
                    if (selectedGroup)
                      handleSendGroupMessage(
                        { preventDefault: () => {} },
                        file,
                      );
                    else handleSendMessage({ preventDefault: () => {} }, file);
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
