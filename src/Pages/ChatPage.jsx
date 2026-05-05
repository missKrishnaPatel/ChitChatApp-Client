import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/Chatwindow";
import { connectSocket, disconnectSocket } from "../socket/socketClient";
import { registerSocketEvents } from "../socket/socketEvents";
import {
  joinGroup,
  emitGroupMessage,
  emitDeleteMessage,
  emitUpdateMessage,
} from "../socket/socketEmitters";

const API_BASE_URL =
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1";

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
  const [showMembers, setShowMembers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const navigate = useNavigate();
  const { username, groupName: routeGroupName } = useParams();
  const token = localStorage.getItem("token");
  const socketRef = useRef(null);
  const selectedUserRef = useRef(null);
  const selectedGroupRef = useRef(null);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { selectedGroupRef.current = selectedGroup; }, [selectedGroup]);

  //Fetching data

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alluser`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const userList =
          data.getAllUser || data.users || data.data?.getAllUser || data.data?.users || [];
        setUsers(
          userList.map((user) => ({
            ...user,
            isOnline: user.isOnline ?? false,
            lastSeen: user.lastSeen ?? null,
          }))
        );
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
  }, [token]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setGroups(data.message.groups || data.data?.message.groups || []);
      }
    } catch (error) {
      console.error("Fetch Groups Error:", error);
    }
  }, [token]);



  const refreshGroup = useCallback(async (groupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return;
      const updated = data.group || data.data?.group || data.message?.group;
      if (!updated) return;
      setGroups((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
      setSelectedGroup((prev) => (prev?._id === updated._id ? updated : prev));
    } catch (error) {
      console.error("Refresh Group Error:", error);
    }
  }, [token]);

  const fetchMessages = async (chatUserId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-all-messages/${chatUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessages(
        response.ok
          ? data.allMessages?.messages || data.data?.allMessages?.messages || []
          : []
      );
    } catch (error) {
      console.error("Fetch Messages Error:", error);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/group-messages/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessages(
        response.ok
          ? data.message.messages || data.data?.message.messages || []
          : []
      );
    } catch (error) {
      console.error("Fetch Group Messages Error:", error);
    }
  };

  //GROUP MEMBER Management

  const addMember = async (groupId, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/group/add-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupId, userId }),
      });
      if (!response.ok) { console.error("Add Member Error:", await response.json()); return; }
      await refreshGroup(groupId);
    } catch (error) {
      console.error("Add Member Error:", error);
    }
  };

  const removeMember = async (groupId, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/group/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupId, userId }),
      });
      // console.log("Heyy", groupId, userId)
      if (!response.ok) { console.error("Remove Member Error:", await response.json()); return; }
      await refreshGroup(groupId);
    } catch (error) {
      console.error("Remove Member Error:", error);
    }
  };

  const makeAdmin = async (groupId, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/group/make-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupId, userId }),
      });
      if (!response.ok) { console.error("Make Admin Error:", await response.json()); return; }
      await refreshGroup(groupId);
    } catch (error) {
      console.error("Make Admin Error:", error);
    }
  };

  //INITIAL LOAD 

  const fetchUsersRef = useRef(fetchUsers);
const fetchGroupsRef = useRef(fetchGroups);

useEffect(() => {
  fetchUsersRef.current = fetchUsers;
  fetchGroupsRef.current = fetchGroups;
}, [fetchUsers, fetchGroups]);

useEffect(() => {
  if (!token) return;
  fetchUsersRef.current();
  fetchGroupsRef.current();
}, [token]); // only re-runs when token actually changes

  //SOCKET SETUP 

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    socketRef.current = socket;
    registerSocketEvents({
      socket, setUsers, setSelectedUser, setMessages,
      selectedUserRef, selectedGroupRef, fetchUsers, setGroups,setSelectedGroup, 
    });
    return () => disconnectSocket();
  }, [token]);

  //SELECT HANDLERS 

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setMessages([]);
    setNewMessage("");
    navigate(`/dashboard/${`${user.firstName}-${user.lastName}`.toLowerCase().replace(/\s+/g, "-")}`);
    await fetchMessages(user._id);
  };

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setNewMessage("");
    navigate(`/dashboard/group/${group.groupName.toLowerCase().replace(/\s+/g, "-")}`);
    if (socketRef.current) joinGroup(group._id);
    await fetchGroupMessages(group._id);
  };

  // ─── URL ROUTE SYNC ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!users.length && !groups.length) return;
    if (username) {
      const matchedUser = users.find(
        (user) => `${user.firstName}-${user.lastName}`.toLowerCase().replace(/\s+/g, "-") === username
      );
      if (matchedUser && selectedUser?._id !== matchedUser._id) {
        setTimeout(() => handleSelectUser(matchedUser), 0);
      }
    }
    if (routeGroupName) {
      const matchedGroup = groups.find(
        (group) => group.groupName.toLowerCase().replace(/\s+/g, "-") === routeGroupName
      );
      if (matchedGroup && selectedGroup?._id !== matchedGroup._id) {
        setTimeout(() => handleSelectGroup(matchedGroup), 0);
      }
    }
  }, [username, routeGroupName, users, groups]);

  // ─── CREATE GROUP ─────────────────────────────────────────────────────────

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert("Please enter group name and select members");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/group`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupName, members: selectedMembers }),
      });
      if (response.ok) {
        setGroupName("");
        setSelectedMembers([]);
        setShowCreateGroup(false);
        await fetchGroups();
      }
    } catch (error) {
      console.error("Create Group Error:", error);
    }
  };

  // ─── SEND MESSAGES ────────────────────────────────────────────────────────

  const handleSendMessage = async (e, file = null) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;
    if (!selectedUser) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("receiverId", selectedUser._id);
      if (newMessage.trim()) formData.append("message", newMessage);
      if (file) formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/send-message`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        const sentMessage = data.newMessage || data.data?.newMessage;
        if (sentMessage) setMessages((prev) => [...prev, sentMessage]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Send Message Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendGroupFile = async (file) => {
    if (!file || !selectedGroup) return;
    try {
      const formData = new FormData();
      formData.append("groupId", selectedGroup._id);
      formData.append("file", file);
      if (newMessage.trim()) formData.append("message", newMessage);
      const response = await fetch(`${API_BASE_URL}/group/send-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (response.ok) setNewMessage("");
    } catch (error) {
      console.error("Send Group File Error:", error);
    }
  };

  const handleSendGroupMessage = (e, file = null) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;
    if (!selectedGroup) return;
    if (file) { handleSendGroupFile(file); return; }
    if (!socketRef.current) return;
    emitGroupMessage(selectedGroup._id, newMessage);
    setNewMessage("");
  };

  //DELETE / UPDATE 

  const handleDeleteMessage = async (messageId) => {
    try {
      const endpoint = selectedGroup
        ? `${API_BASE_URL}/group/message/${messageId}`
        : `${API_BASE_URL}/message/${messageId}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return;
      const deletedMessage =
        data.deletedMessage || data.data?.deletedMessage || data.message || data.data?.message;
      setMessages((prev) => prev.map((msg) => (msg._id === messageId ? deletedMessage : msg)));
      if (socketRef.current) emitDeleteMessage({ messageId, selectedUser, selectedGroup });
    } catch (error) {
      console.error("Delete Message Error:", error);
    }
  };

  const handleUpdateMessage = async (messageId) => {
    if (!editedText.trim()) return;
    try {
      const endpoint = selectedGroup
        ? `${API_BASE_URL}/group/message/${messageId}`
        : `${API_BASE_URL}/message/${messageId}`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: editedText }),
      });
      const data = await response.json();
      if (!response.ok) return;
      const updatedMessage =
        data.updatedMessage || data.data?.updatedMessage || data.message || data.data?.message;
      if (updatedMessage) {
        setMessages((prev) => prev.map((msg) => (msg._id === messageId ? updatedMessage : msg)));
      }
      setEditingMessageId(null);
      setEditedText("");
      if (socketRef.current) emitUpdateMessage({ messageId, newMessage: editedText, selectedUser, selectedGroup });
    } catch (error) {
      console.error("Update Message Error:", error);
    }
  };

  //RENDER 

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
        users={users}
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
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        showAddUser={showAddUser}
        setShowAddUser={setShowAddUser}
        removeMember={removeMember}
        addMember={addMember}
        makeAdmin={makeAdmin}
      />
    </>
  );
};

export default ChatPage;