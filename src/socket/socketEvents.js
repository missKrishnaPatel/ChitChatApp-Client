const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id : value;
};

export const registerSocketEvents = ({
  socket,
  setUsers,
  setSelectedUser,
  setMessages,
  selectedUserRef,
  selectedGroupRef,
  fetchUsers,
  setGroups,
    setSelectedGroup,
  setCurrentUser,
}) => {
  if (!socket) return;

  const matchesUserId = (idA, idB) => String(idA) === String(idB);

  socket.on("connect", () => {
    console.log("Socket Connected:", socket.id);
    if (fetchUsers) setTimeout(fetchUsers, 500);
  });

  socket.on("userOnline", (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        matchesUserId(user._id, userId)
          ? { ...user, isOnline: true, lastSeen: null }
          : user
      )
    );
    setSelectedUser((prev) =>
      prev && matchesUserId(prev._id, userId)
        ? { ...prev, isOnline: true, lastSeen: null }
        : prev
    );
  });

  socket.on("userOffline", (payload) => {
    const { userId, lastSeen } =
      typeof payload === "string"
        ? { userId: payload, lastSeen: null }
        : payload || {};

    setUsers((prev) =>
      prev.map((user) =>
        matchesUserId(user._id, userId)
          ? { ...user, isOnline: false, lastSeen: lastSeen || new Date() }
          : user
      )
    );
    setSelectedUser((prev) =>
      prev && matchesUserId(prev._id, userId)
        ? { ...prev, isOnline: false, lastSeen: lastSeen || new Date() }
        : prev
    );
  });

  // RESTORED — was missing
  socket.on("userStatusChanged", ({ userId, isOnline, lastSeen }) => {
    setUsers((prev) =>
      prev.map((user) =>
        matchesUserId(user._id, userId)
          ? { ...user, isOnline, lastSeen }
          : user
      )
    );
    setSelectedUser((prev) =>
      prev && matchesUserId(prev._id, userId)
        ? { ...prev, isOnline, lastSeen }
        : prev
    );
  });

  socket.on("userProfileUpdated", ({ userId, profilePicture, user }) => {
    const nextPic = user?.profilePicture || profilePicture;
    if (!userId || !nextPic) return;

    if (setCurrentUser && user) {
      setCurrentUser((prev) =>
        prev && matchesUserId(prev._id, userId) ? user : prev
      );
    } else if (setCurrentUser) {
      setCurrentUser((prev) =>
        prev && matchesUserId(prev._id, userId)
          ? { ...prev, profilePicture: nextPic }
          : prev
      );
    }

    setUsers((prev) =>
      prev.map((u) =>
        matchesUserId(u._id, userId) ? { ...u, profilePicture: nextPic } : u
      )
    );

    setSelectedUser((prev) =>
      prev && matchesUserId(prev._id, userId)
        ? { ...prev, profilePicture: nextPic }
        : prev
    );

    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        members: (g.members ?? []).map((m) =>
          matchesUserId(m?._id ?? m, userId)
            ? { ...(typeof m === "object" ? m : {}), _id: userId, profilePicture: nextPic }
            : m
        ),
        admins: (g.admins ?? []).map((a) =>
          matchesUserId(a?._id ?? a, userId)
            ? { ...(typeof a === "object" ? a : {}), _id: userId, profilePicture: nextPic }
            : a
        ),
      }))
    );

    if (selectedGroupRef?.current) {
      const gid = selectedGroupRef.current._id;
      setSelectedGroup((prev) =>
        prev && String(prev._id) === String(gid)
          ? {
              ...prev,
              members: (prev.members ?? []).map((m) =>
                matchesUserId(m?._id ?? m, userId)
                  ? { ...m, profilePicture: nextPic }
                  : m
              ),
              admins: (prev.admins ?? []).map((a) =>
                matchesUserId(a?._id ?? a, userId)
                  ? { ...a, profilePicture: nextPic }
                  : a
              ),
            }
          : prev
      );
    }
  });


  socket.on("newMessage", (message) => {
    const activeUser = selectedUserRef.current;
    setMessages((prev) => {
      if (
        activeUser &&
        (getId(message.senderId) === activeUser._id ||
          getId(message.receiverId) === activeUser._id)
      ) {
        return [...prev, message];
      }
      return prev;
    });
  });

  socket.on("receiveGroupMessage", (message) => {
    const activeGroup = selectedGroupRef.current;
    setMessages((prev) => {
      if (activeGroup && getId(message.groupId) === activeGroup._id) {
        return [...prev, message];
      }
      return prev;
    });
  });

  socket.on("messageDeleted", (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
    );
  });

  socket.on("messageUpdated", (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
    );
  });

  socket.on("groupMessageDeleted", (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
    );
  });

  socket.on("groupMessageUpdated", (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
    );
  });

  socket.on("groupUpdated", (updatedGroup) => {
    setGroups((prev) =>
      prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g))
    );
     if (selectedGroupRef.current?._id === updatedGroup._id) {
    setSelectedGroup(updatedGroup); // ← this was missing
  }
  });

  socket.on("joinNewGroup", (groupId) => {
    socket.emit("joinGroup", groupId);
  });

  socket.on("memberRemoved", ({ groupId }) => {
    setGroups((prev) => prev.filter((g) => g._id !== groupId));
    if (selectedGroupRef.current?._id === groupId) {
      setMessages([]);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected");
  });
};