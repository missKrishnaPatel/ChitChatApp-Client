import { getSocket } from "./socketClient";

// JOIN GROUP
export const joinGroup = (groupId) => {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("joinGroup", groupId);
};

//SEND GROUP MESSAGE
export const emitGroupMessage = (groupId, message) => {
  const socket = getSocket();
  if (!socket) return;

  socket.emit("sendGroupMessage", { groupId, message });
};

//DELETE MESSAGE
export const emitDeleteMessage = ({
  messageId,
  selectedUser,
  selectedGroup,
}) => {
  const socket = getSocket();
  if (!socket) return;

  if (selectedGroup) {
    socket.emit("deleteGroupMessage", {
      groupId: selectedGroup._id,
      messageId,
    });
  } else {
    socket.emit("deletePrivateMessage", {
      receiverId: selectedUser._id,
      messageId,
    });
  }
};

//UPDATE MESSAGE
export const emitUpdateMessage = ({
  messageId,
  newMessage,
  selectedUser,
  selectedGroup,
}) => {
  const socket = getSocket();
  if (!socket) return;

  if (selectedGroup) {
    socket.emit("updateGroupMessage", {
      groupId: selectedGroup._id,
      messageId,
      newMessage,
    });
  } else {
    socket.emit("updatePrivateMessage", {
      receiverId: selectedUser._id,
      messageId,
      newMessage,
    });
  }
};