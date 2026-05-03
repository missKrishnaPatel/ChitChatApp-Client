import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/Chatwindow";

const API_BASE_URL = "http://localhost:3000/api/v1";

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id : value;
};

const ChatPage = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");

  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const navigate = useNavigate();
  const { username, groupName: routeGroupName } = useParams();
  const token = localStorage.getItem("token");
  const socketRef = useRef(null);
  const selectedUserRef = useRef(null);
  const selectedGroupRef = useRef(null);

  // KEEP REFS UPDATED
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  // FETCH USERS
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alluser`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      // console.log("Users API:", data);

      if (response.ok) {
        setUsers(
          data.getAllUser ||
            data.users ||
            data.data?.getAllUser ||
            data.data?.users ||
            [],
        );
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
  }, [token]);

  // FETCH GROUPS
  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      // console.log("Groups API:", data);

      if (response.ok) {
        setGroups(data.message.groups || data.data?.message.groups || []);
      }
    } catch (error) {
      console.error("Fetch Groups Error:", error);
    }
  }, [token]);

  // INITIAL LOAD
  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      await fetchUsers();
      await fetchGroups();
    };

    loadData();
  }, [token, fetchUsers, fetchGroups]);

  // FETCH PRIVATE MESSAGES
  const fetchMessages = async (chatUserId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/get-all-messages/${chatUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessages(
          data.allMessages?.messages || data.data?.allMessages?.messages || [],
        );
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Fetch Messages Error:", error);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/group-messages/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      console.log("Group Messages API:", data);

      if (response.ok) {
        setMessages(data.message.messages || data.data?.message.messages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Fetch Group Messages Error:", error);
    }
  };

  // SELECT USER
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setMessages([]);
    setNewMessage("");

    const userPath = `${user.firstName}-${user.lastName}`
      .toLowerCase()
      .replace(/\s+/g, "-");

    navigate(`/dashboard/${userPath}`);

    await fetchMessages(user._id);
  };

  // SELECT GROUP
  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);

    setSelectedUser(null);
    // setMessages([]);
    setNewMessage("");

    const groupPath = group.groupName.toLowerCase().replace(/\s+/g, "-");

    navigate(`/dashboard/group/${groupPath}`);

    if (socketRef.current) {
      socketRef.current.emit("joinGroup", group._id);
    }
    await fetchGroupMessages(group._id);
  };

  // CREATE GROUP
  const createGroup = async () => {
    try {
      if (!groupName.trim() || selectedMembers.length === 0) {
        alert("Please enter group name and select members");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupName,
          members: selectedMembers,
        }),
      });

      const data = await response.json();
      // console.log("Create Group Response:/", data);

      if (response.ok) {
        setGroupName("");
        setSelectedMembers([]);
        setShowCreateGroup(false);

        await fetchGroups();
      } else {
        console.error(data.message || "Group creation failed");
      }
    } catch (error) {
      console.error("Create Group Error:", error);
    }
  };

  // SOCKET CONNECTION
  useEffect(() => {
  if (!token) return;

  const socket = io("http://localhost:3000", {
    auth: { token },
    transports: ["websocket"],
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    console.log("Socket Connected:", socket.id);
  });

  // PRIVATE MESSAGE
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

  // GROUP MESSAGE
  socket.on("receiveGroupMessage", (message) => {
    const activeGroup = selectedGroupRef.current;

    setMessages((prev) => {
      if (activeGroup && getId(message.groupId) === activeGroup._id) {
        return [...prev, message];
      }
      return prev;
    });
  });

  // PRIVATE DELETE
  socket.on("messageDeleted", (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  });

  // PRIVATE UPDATE
  socket.on("messageUpdated", (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  });

  // GROUP DELETE
  socket.on("groupMessageDeleted", (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  });

  // GROUP UPDATE
  socket.on("groupMessageUpdated", (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected");
  });

  return () => {
    socket.disconnect();
  };
}, [token]);

  useEffect(() => {
    if (!users.length && !groups.length) return;

    // USER ROUTE
    if (username) {
      const matchedUser = users.find((user) => {
        const userPath = `${user.firstName}-${user.lastName}`
          .toLowerCase()
          .replace(/\s+/g, "-");

        return userPath === username;
      });

      if (matchedUser && selectedUser?._id !== matchedUser._id) {
        setTimeout(() => {
          handleSelectUser(matchedUser);
        }, 0);
      }
    }

    // GROUP ROUTE
    if (routeGroupName) {
      const matchedGroup = groups.find((group) => {
        const groupPath = group.groupName.toLowerCase().replace(/\s+/g, "-");

        return groupPath === routeGroupName;
      });

      if (matchedGroup && selectedGroup?._id !== matchedGroup._id) {
        setTimeout(() => {
          handleSelectGroup(matchedGroup);
        }, 0);
      }
    }
  }, [username, routeGroupName, users, groups]);

  // SEND PRIVATE MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedUser) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedUser._id,
          message: newMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const sentMessage = data.newMessage || data.data?.newMessage;

        if (sentMessage) {
          setMessages((prev) => [...prev, sentMessage]);
        }

        setNewMessage("");
      }
    } catch (error) {
      console.error("Send Message Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // SEND GROUP MESSAGE
  const handleSendGroupMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedGroup || !socketRef.current) return;

    socketRef.current.emit("sendGroupMessage", {
      groupId: selectedGroup._id,
      message: newMessage,
    });

    setNewMessage("");
  };

  // const handleDeleteMessage = async (messageId) => {
  //   try {
  //     const endpoint = selectedGroup
  //     ? `${API_BASE_URL}/group/message/${messageId}`
  //     : `${API_BASE_URL}/message/${messageId}`;


  //     const response = await fetch(endpoint, {
  //       method: "DELETE",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const data = await response.json();

  //     if (response.ok) {
  //       setMessages((prev) =>
  //         prev.map((msg) =>
  //           msg._id === messageId ? data.deletedMessage : msg,
  //         ),
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Delete Message Error:", error);
  //   }
  // };
    const handleDeleteMessage = async (messageId) => {
      try {
        const endpoint = selectedGroup
          ? `${API_BASE_URL}/group/message/${messageId}`
          : `${API_BASE_URL}/message/${messageId}`;

        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Delete Message Error:", data);
          return;
        }

        const deletedMessage =
          data.deletedMessage || data.data?.deletedMessage || data.message || data.data?.message;

        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? deletedMessage : msg,
          ),
        );

        if (socketRef.current) {
          socketRef.current.emit(
            selectedGroup ? "deleteGroupMessage" : "deletePrivateMessage",
            selectedGroup
              ? { groupId: selectedGroup._id, messageId }
              : { receiverId: selectedUser._id, messageId },
          );
        }
      } catch (error) {
        console.error("Delete Message Error:", error);
      }
    };



  // const handleUpdateMessage = async (messageId) => {
  //   try {
  //      const endpoint = selectedGroup
  //     ? `${API_BASE_URL}/group/message/${messageId}`
  //     : `${API_BASE_URL}/message/${messageId}`;
  //     const response = await fetch(endpoint, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         message: editedText,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (response.ok) {
  //       setMessages((prev) =>
  //         prev.map((msg) =>
  //           msg._id === messageId ? data.updatedMessage : msg,
  //         ),
  //       );

  //       setEditingMessageId(null);
  //       setEditedText("");
  //     }
  //   } catch (error) {
  //     console.error("Update Message Error:", error);
  //   }
  // };
  const handleUpdateMessage = async (messageId) => {
    if (!editedText.trim()) return;

    try {
      const endpoint = selectedGroup
        ? `${API_BASE_URL}/group/message/${messageId}`
        : `${API_BASE_URL}/message/${messageId}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: editedText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Update Message Error:", data);
        return;
      }

      const updatedMessage =
        data.updatedMessage || data.data?.updatedMessage || data.message || data.data?.message;

      if (updatedMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? updatedMessage : msg,
          ),
        );
      }

      setEditingMessageId(null);
      setEditedText("");

      if (socketRef.current) {
        socketRef.current.emit(
          selectedGroup ? "updateGroupMessage" : "updatePrivateMessage",
          selectedGroup
            ? {
                groupId: selectedGroup._id,
                messageId,
                newMessage: editedText,
              }
            : {
                receiverId: selectedUser._id,
                messageId,
                newMessage: editedText,
              },
        );
      }
    } catch (error) {
      console.error("Update Message Error:", error);
    }
  };


  return (
    <>
      <Sidebar
        users={users}
        groups={groups}
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
        handleSelectUser={handleSelectUser}
        handleSelectGroup={handleSelectGroup}
        showCreateGroup={showCreateGroup}
        setShowCreateGroup={setShowCreateGroup}
        groupName={groupName}
        setGroupName={setGroupName}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
        createGroup={createGroup}
      />

      <ChatWindow
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
        messages={messages}
        token={token}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleSendGroupMessage={handleSendGroupMessage}
        loading={loading}
        getId={getId}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
        editedText={editedText}
        setEditedText={setEditedText}
        handleDeleteMessage={handleDeleteMessage}
        handleUpdateMessage={handleUpdateMessage}
      />
    </>
  );
};

export default ChatPage;
